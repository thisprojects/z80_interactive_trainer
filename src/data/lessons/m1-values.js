import { START, startWith, hints } from './helpers.js'

export default [
  {
    id: 'registers-and-ld',
    title: 'Registers and LD',
    module: 'Values and registers',
    intro: 'A program keeps its working values in registers. You will store numbers in them with `LD`.',
    content: [
      { type: 'text', text: 'In a high-level language you make a variable and give it a value. The Z80 has no variables, but it has a few tiny, very fast storage boxes called registers, each with a fixed name. The 8-bit ones are `A B C D E H L`, and each holds a whole number from 0 to 255.' },
      { type: 'compare', high: 'b = 7', z80: 'LD B,7' },
      { type: 'text', text: '`LD` means "load". The register that receives the value goes first, then a comma, then the value. Read `LD B,7` as "B becomes 7". Here is a whole program:' },
      {
        type: 'code',
        code: `        ORG 0x8000      ; where the program is placed in memory
        LD B,7          ; B = 7
        LD C,200        ; C = 200
        HALT            ; stop the processor`,
        caption: 'Anything after a `;` is a comment for humans. Every program starts with `ORG 0x8000` and ends with `HALT`.',
      },
      { type: 'tip', text: 'The processor runs one instruction after another from the top. Without `HALT` it would carry on into whatever bytes come next.' },
    ],
    task: ['Make register A hold 42 and register D hold 9 when the program ends.'],
    starterCode: START,
    hints: hints(
      ['Each register needs its own LD instruction: LD destination,value.', 'The order of the two instructions does not matter.'],
      'One LD per register.',
      `        ORG 0x8000
        LD A,42         ; A = 42
        LD D,9          ; D = 9
        HALT`,
    ),
    tests: [{ name: 'A = 42 and D = 9', expect: { registers: { A: 42, D: 9 } } }],
  },
  {
    id: 'copying-registers',
    title: 'Copying between registers',
    module: 'Values and registers',
    intro: '`LD` can also copy one register into another, which is how you move values around.',
    content: [
      { type: 'text', text: 'The second half of `LD` does not have to be a number. It can be another register, and then the value is copied across. The register you copy from is left untouched.' },
      { type: 'compare', high: 'c = b', z80: 'LD C,B' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,10         ; A = 10
        LD B,A          ; B = A, so B = 10
        LD C,B          ; C = B, so C = 10
        HALT            ; A, B and C all hold 10`,
      },
      { type: 'tip', text: 'It is a copy, not a move: after `LD B,A`, register A still holds its value.' },
    ],
    task: ['Register B already holds a number. Copy it into both C and D.', 'B must still hold its original value at the end.'],
    starterCode: startWith('B already contains a value'),
    hints: hints(
      ['You need two copies, so two LD instructions.', 'Copy from B each time. B is never changed by being copied.'],
      'Two copies, both taken from B.',
      `        ORG 0x8000
        LD C,B          ; C = B
        LD D,B          ; D = B
        HALT`,
    ),
    tests: [
      { name: 'B = 7', setup: { registers: { B: 7 } }, expect: { registers: { B: 7, C: 7, D: 7 } } },
      { name: 'B = 200', setup: { registers: { B: 200 } }, expect: { registers: { B: 200, C: 200, D: 200 } } },
    ],
  },
  {
    id: 'number-forms',
    title: 'Ways to write a number',
    module: 'Values and registers',
    intro: 'The same value can be written in decimal, hexadecimal, binary or as a character. They all mean the same thing to the processor.',
    content: [
      { type: 'text', text: 'You can write a number whichever way is clearest. The assembler turns all of these into the same byte.' },
      {
        type: 'table',
        head: ['Form', 'Written as', 'Value'],
        rows: [
          ['Decimal', '65', '65'],
          ['Hexadecimal', '0x41  $41  41h', '65'],
          ['Binary', '0b01000001  %01000001', '65'],
          ['Character', "'A'", '65'],
        ],
      },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,65         ; decimal
        LD B,0x41       ; hexadecimal
        LD C,%01000001  ; binary
        LD D,'A'        ; the character code for A
        HALT            ; all four hold 65`,
      },
      { type: 'text', text: 'Hexadecimal is popular because one byte is always exactly two hex digits (`0x00` to `0xFF`). Binary shows the individual bits, which matters when you work with flags.' },
      { type: 'tip', text: 'A character is just a number: computers store the letter A as 65. That is why text and numbers mix freely in assembly.' },
    ],
    task: ['Put the hexadecimal number 7F in register A.', 'Put the binary number 10101010 in register B.', 'Put the character code for the letter Q in register C.'],
    starterCode: START,
    hints: hints(
      ['A hexadecimal number starts with 0x (or $), a binary number with 0b (or %), and a character goes in quotes.', 'You can write the number directly in the LD instruction in whichever form you like.'],
      'Three loads, each written in the form the task used.',
      `        ORG 0x8000
        LD A,0x7F       ; hexadecimal
        LD B,%10101010  ; binary
        LD C,'Q'        ; character
        HALT`,
    ),
    tests: [{ name: 'A = 0x7F, B = 0b10101010, C = "Q"', expect: { registers: { A: 0x7f, B: 0xaa, C: 0x51 } } }],
  },
  {
    id: 'wraparound',
    title: 'Bytes, wraparound and negative numbers',
    module: 'Values and registers',
    intro: 'A byte only holds 256 different values. Negative numbers are stored as the values at the top of that range.',
    content: [
      { type: 'text', text: 'A register is 8 bits wide, so it holds 0 to 255 and nothing else. Go past 255 and the count starts again from 0, like a car odometer rolling over. This "wraparound" is normal behaviour, not an error.' },
      { type: 'text', text: 'To store a negative number the processor counts backwards from the top: 255 stands for -1, 254 for -2, and so on down to 128 for -128. This is called two\'s complement. Bytes 0 to 127 are positive, 128 to 255 are negative, and bit 7 tells you which.' },
      {
        type: 'table',
        head: ['Written as', 'Same byte as', 'Meaning if signed'],
        rows: [['-1', '255  0xFF', '-1'], ['-2', '254  0xFE', '-2'], ['-128', '128  0x80', '-128'], ['127', '127  0x7F', '127']],
      },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,-1         ; the assembler turns -1 into 255
        LD B,255        ; exactly the same byte
        LD C,-100       ; 156
        LD A,5
        NEG             ; A = 0 - A = -5, which is the byte 251
        HALT`,
      },
      { type: 'text', text: '`NEG` negates A: it turns 5 into -5 (251) and -5 back into 5. It is the quick way to change a number\'s sign.' },
      { type: 'tip', text: 'The register does not remember whether you meant a signed or an unsigned number. That is up to your program: 255 and -1 are the same byte.' },
    ],
    task: ['Put -3 in register A.', 'Put -128 in register B.', 'Put the same byte as 200 in register C, but write it as a negative number.'],
    starterCode: START,
    hints: hints(
      ['LD accepts a negative number directly, for example LD A,-1.', 'A byte of 200 is 256 - 200 = 56 below the top of the range.'],
      '-3 is 253, -128 is 128, and 200 written negatively is -56.',
      `        ORG 0x8000
        LD A,-3         ; 253
        LD B,-128       ; 128
        LD C,-56        ; 200
        HALT`,
    ),
    tests: [{ name: 'A = 253, B = 128, C = 200', expect: { registers: { A: 253, B: 128, C: 200 } } }],
  },
]
