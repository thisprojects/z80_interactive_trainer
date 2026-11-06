import { startWith, hints } from './helpers.js'

export default [
  {
    id: 'memory',
    title: 'Memory: numbered boxes',
    module: 'Memory and data types',
    intro: 'Registers are few. Memory is a long row of numbered bytes you can read and write.',
    content: [
      { type: 'text', text: 'The Z80 can address 65,536 bytes of memory, numbered 0 to 65535. The number of a byte is its address. Your program lives in memory too, starting at the `ORG` address, so use addresses well away from it for data: this trainer is happy with `0x9000` and above.' },
      { type: 'text', text: 'Brackets mean "the byte at this address". `LD A,(0x9000)` reads memory into A, and `LD (0x9000),A` writes A out to memory. Without the brackets a number is just a number.' },
      { type: 'compare', high: 'score = 10\nscore = score + 5', z80: 'LD A,10\nLD (0x9000),A\nADD A,5\nLD (0x9000),A' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,10
        LD (0x9000),A   ; write 10 to address 0x9000
        LD A,(0x9000)   ; read it back
        ADD A,5
        LD (0x9001),A   ; write 15 to the next address
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; prints 15
        HALT`,
        prints: '15',
      },
      { type: 'text', text: 'Remembering raw addresses gets tedious. A label names a spot in the program, and `DB` ("define byte") reserves a byte there with a starting value. Put data after `HALT` so the processor never tries to run it:' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,(score)
        ADD A,5
        LD (score),A
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; prints 15
        HALT
score:  DB 10           ; one byte, starting at 10`,
        prints: '15',
      },
    ],
    task: ['Create a one-byte variable called ammo that starts at 6.', 'Add 4 to it and store the answer back in ammo.', 'Put the variable after HALT, so the processor never runs it as an instruction.'],
    starterCode: startWith('define ammo with DB after HALT, then add 4 to it'),
    hints: hints(
      ['Put the variable after HALT: a label, then DB and its starting value.', 'Memory can only be reached through A for this: read it with LD A,(ammo), add 4 with ADD A,4, then write it back with LD (ammo),A.'],
      'Define the variable, then read, add, write back.',
      `        ORG 0x8000
        LD A,(ammo)     ; read
        ADD A,4         ; change
        LD (ammo),A     ; write back
        HALT
ammo:   DB 6            ; the variable, starting at 6`,
    ),
    tests: [
      { name: '6 becomes 10', expect: { memory: { ammo: [10] } } },
      { name: '250 becomes 254', setup: { memory: { ammo: [250] } }, expect: { memory: { ammo: [254] } } },
      { name: '0 becomes 4', setup: { memory: { ammo: [0] } }, expect: { memory: { ammo: [4] } } },
    ],
  },
  {
    id: 'pointers',
    title: 'Pointers: HL and (HL)',
    module: 'Memory and data types',
    intro: 'Put an address in HL and `(HL)` becomes the byte it points at. Move HL and you move along memory.',
    content: [
      { type: 'text', text: 'A pointer is a variable that holds an address, such as the address of another variable. On the Z80, `HL` is the pointer register. `LD HL,first` puts the address of the variable `first` in HL, and `(HL)` then means "the byte at the address in HL". You can read it with `LD A,(HL)` and write it with `LD (HL),A`.' },
      { type: 'text', text: 'Because HL is a normal 16-bit number, `INC HL` moves the pointer to the next byte and `DEC HL` moves it back.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD HL,first     ; HL = address of the variable first
        LD A,(HL)       ; A = 10
        INC HL          ; HL now points at the next byte
        ADD A,(HL)      ; A = 10 + 20
        LD (HL),A       ; store 30 over the 20
        HALT
first:  DB 10           ; two byte variables, side by side
second: DB 20`,
      },
      { type: 'text', text: '`INC (HL)` and `DEC (HL)` change the byte HL points at directly, with no need to go through A. `BC` and `DE` can act as pointers too, but only to and from A: `LD A,(DE)` and `LD (BC),A`.' },
      { type: 'tip', text: 'Do not confuse `LD A,(HL)` (the byte HL points at) with `LD A,H` (the top half of the pointer itself).' },
    ],
    task: ['Create two byte variables side by side: first holding 5 and second holding 9.', 'Use HL as a pointer to swap their values.', 'You may use A and B as scratch registers.'],
    starterCode: startWith('define first and second with DB after HALT (one straight after the other)'),
    hints: hints(
      ['Put the variables after HALT: first: DB 5, then second: DB 9 on the next line, so they sit in neighbouring bytes.', 'Point HL at first with LD HL,first. Read one byte into A and the other into B before you write anything back.', 'INC HL steps to the second byte and DEC HL steps back.'],
      'Define both variables, read both, then write them back the other way round.',
      `        ORG 0x8000
        LD HL,first
        LD A,(HL)       ; first
        INC HL
        LD B,(HL)       ; second
        LD (HL),A       ; second := first
        DEC HL
        LD (HL),B       ; first := second
        HALT
first:  DB 5
second: DB 9`,
    ),
    tests: [
      { name: 'swap 5 and 9', expect: { memory: { first: [9, 5] } } },
      { name: 'swap 0 and 255', setup: { memory: { first: [0, 255] } }, expect: { memory: { first: [255, 0] } } },
      { name: 'equal values', setup: { memory: { first: [7, 7] } }, expect: { memory: { first: [7, 7] } } },
    ],
  },
  {
    id: 'arrays',
    title: 'Arrays: one byte after another',
    module: 'Memory and data types',
    intro: 'An array is just consecutive bytes. The start address plus the index gives you any element.',
    content: [
      { type: 'text', text: '`DB` can list many values, and they are stored side by side. Element 0 is at the label, element 1 at the label plus 1, and so on. To reach element `i`, put the start in HL and step along with `INC HL` `i` times. For a bigger or variable index, put `i` in DE and use `ADD HL,DE` instead.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD HL,table
        INC HL
        INC HL          ; HL = table + 2, the third element
        LD A,(HL)       ; A = the character at index 2
        RST 0x10        ; print it
        HALT
table:  DB 'A','B','C','D'`,
        prints: 'C',
      },
      { type: 'tip', text: 'Programmers count from 0, so the first element is index 0 and an array of 4 elements has indexes 0 to 3. `INC HL` is also how you walk along an array one element at a time.' },
    ],
    task: ['Create an array called scores holding the four bytes 10, 20, 30 and 40.', 'Put element 2 (the third one) into register A.', 'Then store the number 99 in element 3 (the last one).'],
    starterCode: startWith('define the array scores with DB after HALT'),
    hints: hints(
      ['The array is a label followed by DB and four values, placed after HALT. Point HL at it with LD HL,scores.', 'Move HL along the array with INC HL (or ADD HL,DE). Read the third element, then move on one more byte to write the last.'],
      'Define the array, step twice, read, step once more, write.',
      `        ORG 0x8000
        LD HL,scores
        INC HL
        INC HL          ; HL points at element 2
        LD A,(HL)       ; read it
        INC HL          ; element 3
        LD (HL),99      ; overwrite the last one
        HALT
scores: DB 10,20,30,40`,
    ),
    tests: [
      { name: '10,20,30,40', expect: { registers: { A: 30 }, memory: { scores: [10, 20, 30, 99] } } },
      { name: '1,2,3,4', setup: { memory: { scores: [1, 2, 3, 4] } }, expect: { registers: { A: 3 }, memory: { scores: [1, 2, 3, 99] } } },
      { name: '9,8,7,6', setup: { memory: { scores: [9, 8, 7, 6] } }, expect: { registers: { A: 7 }, memory: { scores: [9, 8, 7, 99] } } },
    ],
  },
  {
    id: 'words',
    title: 'Words: 16-bit values in memory',
    module: 'Memory and data types',
    intro: 'A 16-bit value takes two bytes of memory, low byte first.',
    content: [
      { type: 'text', text: 'Numbers bigger than 255 take two bytes in memory. `DW` ("define word") stores a 16-bit value, and the Z80 stores it little-endian: the low byte first, then the high byte. So `DW 0x1234` puts `0x34` at the label and `0x12` at the next address.' },
      { type: 'text', text: '`LD HL,(address)` reads both bytes into HL and `LD (address),HL` writes them back, handling the byte order for you.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD HL,(value)   ; HL = 0x1234
        INC HL          ; HL = 0x1235
        LD (value),HL   ; store it back, low byte first
        LD BC,(value)   ; read the new value into BC
        CALL 0x2D2B
        CALL 0x2DE3     ; prints 4661, which is 0x1235
        HALT
value:  DW 0x1234`,
        prints: '4661',
      },
    ],
    task: ['Create two words: count holding 255 and total holding 0.', 'Store count + 1 in total. Leave count where it is.'],
    starterCode: startWith('define the words count and total with DW after HALT'),
    hints: hints(
      ['Each word is a label followed by DW and its value, placed after HALT.', 'LD HL,(count) reads the whole word at once. INC HL adds one to all 16 bits, and LD (total),HL writes it out.'],
      'Define both words, then read, add one, write to the other.',
      `        ORG 0x8000
        LD HL,(count)   ; read the word
        INC HL
        LD (total),HL   ; write the result to the other word
        HALT
count:  DW 255
total:  DW 0`,
    ),
    tests: [
      { name: '255 + 1 carries into the high byte', expect: { memory: { count: [0xff, 0x00], total: [0x00, 0x01] } } },
      { name: '0x1234', setup: { memory: { count: [0x34, 0x12] } }, expect: { memory: { count: [0x34, 0x12], total: [0x35, 0x12] } } },
      { name: '0xFFFF wraps to 0', setup: { memory: { count: [0xff, 0xff] } }, expect: { memory: { total: [0x00, 0x00] } } },
    ],
  },
  {
    id: 'sum-32',
    title: '32-bit numbers: chaining ADD and ADC',
    module: 'Memory and data types',
    intro: 'A 16-bit register tops out at 65535. For bigger numbers, store two words and add them with `ADD HL,DE` then `ADC HL,DE`.',
    content: [
      { type: 'text', text: 'Scores, timers and frame counters often outgrow 16 bits (65535). A 32-bit number takes four bytes, which is two words: the low word first, then the high word, each stored low byte first like any word. 70000 is 1 × 65536 + 4464, so its low word is 4464 and its high word is 1.' },
      { type: 'text', text: 'The Z80 has no 32-bit add, so you add the low words, then the high words, and let the Carry flag pass the overflow between them. `ADD HL,DE` adds the low words and sets Carry if they overflowed. `ADC HL,DE` then adds the high words plus that carry. `LD HL,(address)`, `LD DE,(address)` and `LD (address),HL` do not change the flags, so the carry survives the loads and stores in between.' },
      { type: 'text', text: 'This example adds 80000 to a 32-bit total, in place:' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD HL,(total)       ; low word of the total
        LD DE,(amount)      ; low word of the amount
        ADD HL,DE           ; add the low words, may set carry
        LD (total),HL
        LD HL,(total+2)     ; high word of the total
        LD DE,(amount+2)    ; high word of the amount
        ADC HL,DE           ; add the high words plus the carry
        LD (total+2),HL
        HALT                ; total = 70000 + 80000 = 150000
total:  DW 4464, 1          ; 70000 = 1 x 65536 + 4464
amount: DW 14464, 1         ; 80000 = 1 x 65536 + 14464`,
      },
      { type: 'tip', text: 'Use `ADD` for the low word and `ADC` for the high word, exactly as with bytes.' },
    ],
    task: ['Create two 32-bit numbers, each as two words: first holding 100000 and second holding 200000.', 'Create a third 32-bit number called sum (four bytes, starting at 0) and store first + second in it. Leave first and second where they are.'],
    starterCode: startWith('define first, second and sum with DW after HALT'),
    hints: hints(
      ['A 32-bit number is two DW words, low word first. 100000 is 1 x 65536 + 34464, and 200000 is 3 x 65536 + 3392.', 'Add the low words with ADD HL,DE, store HL, then add the high words with ADC HL,DE and store HL again. The loads and stores do not disturb the carry.'],
      'Define the three numbers, then low words with ADD and high words with ADC.',
      `        ORG 0x8000
        LD HL,(first)   ; low word of the first number
        LD DE,(second)  ; low word of the second
        ADD HL,DE       ; may set carry
        LD (sum),HL
        LD HL,(first+2) ; high word of the first
        LD DE,(second+2) ; high word of the second
        ADC HL,DE       ; includes the carry
        LD (sum+2),HL
        HALT
first:  DW 34464, 1     ; 100000
second: DW 3392, 3      ; 200000
sum:    DW 0, 0`,
    ),
    tests: [
      { name: '100000 + 200000', expect: { memory: { first: [0xa0, 0x86, 0x01, 0x00], second: [0x40, 0x0d, 0x03, 0x00], sum: [0xe0, 0x93, 0x04, 0x00] } } },
      { name: '70000 + 80000', setup: { memory: { first: [0x70, 0x11, 0x01, 0x00], second: [0x80, 0x38, 0x01, 0x00] } }, expect: { memory: { sum: [0xf0, 0x49, 0x02, 0x00] } } },
      { name: '65535 + 1 carries into the high word', setup: { memory: { first: [0xff, 0xff, 0x00, 0x00], second: [0x01, 0x00, 0x00, 0x00] } }, expect: { memory: { sum: [0x00, 0x00, 0x01, 0x00] } } },
      { name: '4294967295 + 1 wraps to 0', setup: { memory: { first: [0xff, 0xff, 0xff, 0xff], second: [0x01, 0x00, 0x00, 0x00] } }, expect: { memory: { sum: [0x00, 0x00, 0x00, 0x00] } } },
    ],
  },
  {
    id: 'constants',
    title: 'Named constants with EQU',
    module: 'Memory and data types',
    intro: 'Give numbers names so a program says what it means.',
    content: [
      { type: 'text', text: '`name EQU value` defines a constant. It costs nothing at run time: the assembler replaces the name with the value everywhere. You can do arithmetic on constants, and a single `EQU` at the top lets you change a value in one place.' },
      { type: 'compare', high: 'WIDTH = 4\nHEIGHT = 3\narea = WIDTH * HEIGHT', z80: 'WIDTH   EQU 4\nHEIGHT  EQU 3\n        LD A,WIDTH*HEIGHT' },
      {
        type: 'code',
        code: `WIDTH   EQU 4
HEIGHT  EQU 3
        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,WIDTH*HEIGHT
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; prints 12
        HALT`,
        prints: '12',
      },
      { type: 'tip', text: 'Constants are for values known when you write the program. They are not registers or memory, so they cannot change while it runs.' },
      { type: 'tip', text: 'The `*` in `WIDTH*HEIGHT` is the assembler multiplying two numbers while it builds your program, and it writes the answer (12) into the instruction. The Z80 has no multiply instruction, so something like `LD A,B*C` does not work: registers only have values when the program runs.' },
    ],
    task: ['Define a constant PRICE equal to 25 and a constant TAX equal to 3.', 'Load register A with PRICE + TAX and register B with PRICE * 2.'],
    starterCode: '        ORG 0x8000\n\n        ; define PRICE and TAX here, then use them\n\n        HALT\n',
    hints: hints(
      ['Write each constant as name EQU value, usually before the ORG line or just after it.', 'In LD you can write an expression such as PRICE*2.'],
      'Two constants and two loads that use them.',
      `PRICE   EQU 25
TAX     EQU 3
        ORG 0x8000
        LD A,PRICE+TAX
        LD B,PRICE*2
        HALT`,
    ),
    tests: [{ name: 'A = 28, B = 50', expect: { registers: { A: 28, B: 50 } } }],
  },
]
