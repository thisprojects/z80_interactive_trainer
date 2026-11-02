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
        LD A,10
        LD (0x9000),A   ; write 10 to address 0x9000
        LD A,(0x9000)   ; read it back
        ADD A,5
        LD (0x9001),A   ; write 15 to the next address
        OUT (1),A       ; prints 15
        HALT`,
        prints: '15',
      },
      { type: 'text', text: 'Remembering raw addresses gets tedious. A label names a spot in the program, and `DB` ("define byte") reserves a byte there with a starting value. Put data after `HALT` so the processor never tries to run it:' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,(score)
        ADD A,5
        LD (score),A
        OUT (1),A       ; prints 15
        HALT
score:  DB 10           ; one byte, starting at 10`,
        prints: '15',
      },
    ],
    task: ['The byte at address 0x9000 holds a number.', 'Add 4 to it and store the answer back at the same address.'],
    starterCode: startWith('the number is in memory at address 0x9000'),
    hints: hints(
      ['Memory can only be reached through A for this: read it with LD A,(address).', 'Add 4 with ADD A,4, then write it back with LD (address),A.'],
      'Read, add, write back.',
      `        ORG 0x8000
        LD A,(0x9000)   ; read
        ADD A,4         ; change
        LD (0x9000),A   ; write back
        HALT`,
    ),
    tests: [
      { name: '3 becomes 7', setup: { memory: { 0x9000: [3] } }, expect: { memory: { 0x9000: [7] } } },
      { name: '250 becomes 254', setup: { memory: { 0x9000: [250] } }, expect: { memory: { 0x9000: [254] } } },
      { name: '0 becomes 4', setup: { memory: { 0x9000: [0] } }, expect: { memory: { 0x9000: [4] } } },
    ],
  },
  {
    id: 'pointers',
    title: 'Pointers: HL and (HL)',
    module: 'Memory and data types',
    intro: 'Put an address in HL and `(HL)` becomes the byte it points at. Move HL and you move along memory.',
    content: [
      { type: 'text', text: 'A pointer is a variable that holds an address. On the Z80, `HL` is the pointer register. `LD HL,data` puts the address of `data` in HL, and `(HL)` then means "the byte at the address in HL". You can read it with `LD A,(HL)` and write it with `LD (HL),A`.' },
      { type: 'text', text: 'Because HL is a normal 16-bit number, `INC HL` moves the pointer to the next byte and `DEC HL` moves it back.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD HL,data      ; HL = address of the first byte
        LD A,(HL)       ; A = 10
        INC HL          ; HL now points at the next byte
        ADD A,(HL)      ; A = 10 + 20
        LD (HL),A       ; store 30 over the 20
        HALT
data:   DB 10,20`,
      },
      { type: 'text', text: '`INC (HL)` and `DEC (HL)` change the byte HL points at directly, with no need to go through A. `BC` and `DE` can act as pointers too, but only to and from A: `LD A,(DE)` and `LD (BC),A`.' },
      { type: 'tip', text: 'Do not confuse `LD A,(HL)` (the byte HL points at) with `LD A,H` (the top half of the pointer itself).' },
    ],
    task: ['HL holds the address of a byte, and the byte after it is the next address.', 'Swap those two bytes in memory.', 'You may use A and B as scratch registers.'],
    starterCode: startWith('HL points at the first of two bytes'),
    hints: hints(
      ['Read one byte into A and the other into B before you write anything back.', 'INC HL steps to the second byte and DEC HL steps back.'],
      'Read both, then write them back the other way round.',
      `        ORG 0x8000
        LD A,(HL)       ; first byte
        INC HL
        LD B,(HL)       ; second byte
        LD (HL),A       ; second := first
        DEC HL
        LD (HL),B       ; first := second
        HALT`,
    ),
    tests: [
      { name: 'swap 5 and 9', setup: { registers: { HL: 0x9000 }, memory: { 0x9000: [5, 9] } }, expect: { memory: { 0x9000: [9, 5] } } },
      { name: 'swap 0 and 255', setup: { registers: { HL: 0x9100 }, memory: { 0x9100: [0, 255] } }, expect: { memory: { 0x9100: [255, 0] } } },
    ],
  },
  {
    id: 'arrays',
    title: 'Arrays: one byte after another',
    module: 'Memory and data types',
    intro: 'An array is just consecutive bytes. The start address plus the index gives you any element.',
    content: [
      { type: 'text', text: '`DB` can list many values, and they are stored side by side. Element 0 is at the label, element 1 at the label plus 1, and so on. To reach element `i`, put the start in HL, put `i` in DE and use `ADD HL,DE`.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD HL,table
        LD DE,2         ; index 2 is the third element
        ADD HL,DE       ; HL = table + 2
        LD A,(HL)
        OUT (1),A       ; prints 30
        HALT
table:  DB 10,20,30,40`,
        prints: '30',
      },
      { type: 'tip', text: 'Programmers count from 0, so the first element is index 0 and an array of 4 elements has indexes 0 to 3. Stepping with `INC HL` is the other way to walk along an array.' },
    ],
    task: ['HL holds the address of an array of four bytes.', 'Put element 2 (the third one) into register A.', 'Then store the number 99 in element 3 (the last one).'],
    starterCode: startWith('HL points at an array of four bytes'),
    hints: hints(
      ['Move HL along the array with INC HL (or ADD HL,DE).', 'Read the third element, then move on one more byte to write the last.'],
      'Step twice, read, step once more, write.',
      `        ORG 0x8000
        INC HL
        INC HL          ; HL points at element 2
        LD A,(HL)       ; read it
        INC HL          ; element 3
        LD (HL),99      ; overwrite the last one
        HALT`,
    ),
    tests: [
      { name: '1,2,3,4', setup: { registers: { HL: 0x9000 }, memory: { 0x9000: [1, 2, 3, 4] } }, expect: { registers: { A: 3 }, memory: { 0x9000: [1, 2, 3, 99] } } },
      { name: '9,8,7,6', setup: { registers: { HL: 0x9200 }, memory: { 0x9200: [9, 8, 7, 6] } }, expect: { registers: { A: 7 }, memory: { 0x9200: [9, 8, 7, 99] } } },
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
        LD HL,(value)   ; HL = 0x1234
        INC HL          ; HL = 0x1235
        LD (value),HL   ; store it back, low byte first
        LD A,L
        OUT (1),A       ; prints 53, the low byte 0x35
        HALT
value:  DW 0x1234`,
        prints: '53',
      },
    ],
    task: ['A 16-bit word is stored at address 0x9000.', 'Add 1 to it and store the result as a word at address 0x9002. Leave the original where it is.'],
    starterCode: startWith('the word is stored at address 0x9000'),
    hints: hints(
      ['LD HL,(0x9000) reads the whole word at once.', 'INC HL adds one to all 16 bits, and LD (0x9002),HL writes it out.'],
      'Read, add one, write to the new address.',
      `        ORG 0x8000
        LD HL,(0x9000)  ; read the word
        INC HL
        LD (0x9002),HL  ; write the result next door
        HALT`,
    ),
    tests: [
      { name: '0x1234', setup: { memory: { 0x9000: [0x34, 0x12] } }, expect: { memory: { 0x9000: [0x34, 0x12], 0x9002: [0x35, 0x12] } } },
      { name: '0x00FF carries into the high byte', setup: { memory: { 0x9000: [0xff, 0x00] } }, expect: { memory: { 0x9002: [0x00, 0x01] } } },
      { name: '0xFFFF wraps to 0', setup: { memory: { 0x9000: [0xff, 0xff] } }, expect: { memory: { 0x9002: [0x00, 0x00] } } },
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
        LD A,WIDTH*HEIGHT
        OUT (1),A       ; prints 12
        HALT`,
        prints: '12',
      },
      { type: 'tip', text: 'Constants are for values known when you write the program. They are not registers or memory, so they cannot change while it runs.' },
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
