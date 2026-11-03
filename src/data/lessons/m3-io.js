import { startWithScreen, hints } from './helpers.js'

export default [
  {
    id: 'print-char',
    title: 'Printing a character',
    module: 'Input and output',
    intro: 'The Z80 has no print command. The ZX Spectrum has printing routines in its ROM, and `RST 0x10` calls the one that prints a character.',
    content: [
      { type: 'text', text: 'The Z80 itself has no print command, but the computer around it can supply routines for printing. The ZX Spectrum keeps a set of them in its ROM, the built-in program that comes with the machine. `RST` ("restart") is a one-byte call to a fixed address, and `RST 0x10` calls the ROM routine that prints the character whose code is in A.' },
      { type: 'text', text: 'Before anything can be printed, the ROM needs to know where to print. Load A with 2 (the main screen) and `CALL 0x1601`, the ROM routine that opens a channel. Do this once, at the start of every program that prints.' },
      { type: 'compare', high: 'print("H")', z80: "LD A,'H'\nRST 0x10" },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel (once, at the start)
        LD A,'H'
        RST 0x10        ; prints H
        LD A,'i'
        RST 0x10        ; prints i
        HALT`,
        prints: 'Hi',
      },
      { type: 'tip', text: '`RST 0x10` prints whatever is in A, so load the character into A first. Each character needs its own load and its own `RST 0x10`.' },
    ],
    task: ['Print the text Z80 on the screen (three characters, no spaces).'],
    starterCode: startWithScreen('RST 0x10 prints the character in A'),
    hints: hints(
      ['RST 0x10 prints the character in A.', 'Load each character into A in quotes, for example LD A,\'Z\'.'],
      'Three loads and three RST 0x10s.',
      `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,'Z'
        RST 0x10
        LD A,'8'
        RST 0x10
        LD A,'0'
        RST 0x10
        HALT`,
    ),
    tests: [{ name: 'prints Z80', expect: { output: 'Z80' } }],
  },
  {
    id: 'print-number',
    title: 'Printing a number',
    module: 'Input and output',
    intro: 'Two more ROM routines turn the number in BC into decimal digits and print them.',
    content: [
      { type: 'text', text: '`RST 0x10` treats the byte as a character, so 65 prints the letter A. To print 65 as the digits 6 and 5 you use two other ROM routines. Put the number in the register pair `BC`, then `CALL 0x2D2B` (which hands the number to the ROM) and `CALL 0x2DE3` (which prints it). Any number from 0 to 65535 works.' },
      { type: 'text', text: '`CALL` runs a routine and then carries on with the next instruction. You will write your own routines later; for now just use the ROM\'s.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,65
        RST 0x10        ; prints the character A
        LD BC,65
        CALL 0x2D2B     ; ROM: hand BC to the number printer
        CALL 0x2DE3     ; ROM: print it as decimal digits
        HALT`,
        caption: '`LD BC,65` puts 65 in the pair: B (the high byte) becomes 0 and C (the low byte) becomes 65.',
        prints: 'A65',
      },
      { type: 'tip', text: 'The ROM number routines use the registers freely, so treat A, BC and HL as changed afterwards. If you still need their values, reload them (or save them with `PUSH` and `POP`, which you will meet later).' },
    ],
    task: ['Register C holds a number and register B is 0, so BC holds the number. Print it as a decimal number.'],
    starterCode: startWithScreen('BC holds a number (B is 0)', 'CALL 0x2D2B then CALL 0x2DE3 print BC as a number'),
    hints: hints(
      ['The ROM reads the number from BC, and here BC already holds it.', 'Call the two number routines one after the other.'],
      'BC already holds the number, so call the two ROM routines.',
      `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        CALL 0x2D2B     ; hand BC to the number printer
        CALL 0x2DE3     ; print it
        HALT`,
    ),
    tests: [
      { name: 'C = 42', setup: { registers: { B: 0, C: 42 } }, expect: { output: '42' } },
      { name: 'C = 0', setup: { registers: { B: 0, C: 0 } }, expect: { output: '0' } },
      { name: 'C = 255', setup: { registers: { B: 0, C: 255 } }, expect: { output: '255' } },
    ],
  },
  {
    id: 'newlines',
    title: 'Building up output',
    module: 'Input and output',
    intro: 'Character 13 starts a new line, so a program can print several lines of results.',
    content: [
      { type: 'text', text: 'Print character code 13 with `RST 0x10` and the screen moves to the start of the next line. Together with characters and numbers you can build up readable output a piece at a time: text, then a number, then a new line.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD BC,1
        CALL 0x2D2B
        CALL 0x2DE3     ; 1
        LD A,13
        RST 0x10        ; new line
        LD BC,2
        CALL 0x2D2B
        CALL 0x2DE3     ; 2
        HALT`,
        prints: '1\n2',
      },
      { type: 'tip', text: 'The trainer ignores blank space at the very end of the output when it checks your answer, but newlines in the middle matter.' },
    ],
    task: ['Print the letters OK on the first line.', 'Then print the number held in register C (B is 0) on the second line.'],
    starterCode: startWithScreen('BC holds a number (B is 0)'),
    hints: hints(
      ['Print O, then K with RST 0x10. Then print character 13 to start the next line.', 'The number routines use the registers freely, so print the letters first and the number last.'],
      'Text, newline, then the number.',
      `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,'O'
        RST 0x10
        LD A,'K'
        RST 0x10
        LD A,13
        RST 0x10        ; new line
        CALL 0x2D2B     ; BC still holds the number
        CALL 0x2DE3
        HALT`,
    ),
    tests: [
      { name: 'C = 3', setup: { registers: { B: 0, C: 3 } }, expect: { output: 'OK\n3' } },
      { name: 'C = 250', setup: { registers: { B: 0, C: 250 } }, expect: { output: 'OK\n250' } },
    ],
  },
]
