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
    id: 'bits-and-bytes',
    title: 'Bits and bytes: why 0 to 255?',
    module: 'Values and registers',
    intro: 'A byte is 8 bits, and 8 bits can make 256 different patterns. That is why a register holds 0 to 255.',
    content: [
      { type: 'text', text: 'Computers store everything in binary, a counting system with only two digits, 0 and 1. One binary digit is called a bit. A group of 8 bits is called a byte, and each 8-bit register on the Z80 holds exactly one byte.' },
      { type: 'text', text: 'Each bit in a byte is worth a different amount, doubling as you move left. A number is the total of the bits that are 1.' },
      {
        type: 'table',
        head: ['Bit', '7', '6', '5', '4', '3', '2', '1', '0'],
        rows: [['Worth', '128', '64', '32', '16', '8', '4', '2', '1'], ['Example', '0', '0', '0', '0', '0', '1', '0', '1']],
      },
      { type: 'text', text: 'In the example, only the bits worth 4 and 1 are on, so the byte means 4 + 1 = 5. With every bit off you get 0. With every bit on you get 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255. Each of the 8 bits can be on or off, so there are 2 x 2 x 2 x 2 x 2 x 2 x 2 x 2 = 256 patterns, and they give the numbers 0 to 255.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,%00000101  ; bits worth 4 and 1 are on: 5
        LD B,%11111111  ; every bit on: 255
        LD C,%00000000  ; every bit off: 0
        HALT`,
      },
      { type: 'tip', text: 'A single register such as A or B is 8 bits wide, so it can never hold 256 or more. There are only 256 patterns, and they are used up by 0 to 255. Registers can also be joined in pairs (BC, DE and HL) to make 16-bit registers, which hold much bigger numbers. You will meet them later.' },
    ],
    task: ['Put the largest number a byte can hold in register A.', 'Put the smallest number a byte can hold in register B.', 'Put the decimal equivalent of the byte 00010000 in register C.'],
    starterCode: START,
    hints: hints(
      ['The largest byte has every bit on, and the smallest has every bit off.', 'For C, only one bit is on in 00010000. Use the table to see what that bit is worth.'],
      'A is 255, B is 0 and C is 16.',
      `        ORG 0x8000
        LD A,255        ; every bit on
        LD B,0          ; every bit off
        LD C,%00010000  ; only the bit worth 16 is on
        HALT`,
    ),
    tests: [{ name: 'A = 255, B = 0, C = 16', expect: { registers: { A: 255, B: 0, C: 16 } } }],
  },
]
