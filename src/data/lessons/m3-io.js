import { startWith, hints } from './helpers.js'

export default [
  {
    id: 'print-char',
    title: 'Printing a character',
    module: 'Input and output',
    intro: 'A program talks to the outside world through ports. Port 0 here is the console.',
    content: [
      { type: 'text', text: 'The Z80 has no print command. Instead `OUT (port),A` sends the value in A to a numbered port, and what happens next depends on what is wired to that port. In this trainer port 0 is the console: send it a character code and the character appears.' },
      { type: 'compare', high: 'print("H")', z80: "LD A,'H'\nOUT (0),A" },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,'H'
        OUT (0),A       ; prints H
        LD A,'i'
        OUT (0),A       ; prints i
        HALT`,
        prints: 'Hi',
      },
      { type: 'tip', text: '`OUT` can only send register A, so load the character into A first. Each character needs its own load and its own OUT.' },
    ],
    task: ['Print the text Z80 to the console (three characters, no spaces).'],
    starterCode: startWith('port 0 = print a character'),
    hints: hints(
      ['OUT (0),A sends A to the console.', 'Load each character into A in quotes, for example LD A,\'Z\'.'],
      'Three loads and three OUTs.',
      `        ORG 0x8000
        LD A,'Z'
        OUT (0),A
        LD A,'8'
        OUT (0),A
        LD A,'0'
        OUT (0),A
        HALT`,
    ),
    tests: [{ name: 'prints Z80', expect: { output: 'Z80' } }],
  },
  {
    id: 'print-number',
    title: 'Printing a number',
    module: 'Input and output',
    intro: 'Port 1 prints the value in A as a decimal number instead of a character.',
    content: [
      { type: 'text', text: 'Port 0 treats the byte as a character, so 65 prints the letter A. Port 1 prints the same byte as a decimal number, so 65 prints the digits 6 and 5.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,65
        OUT (0),A       ; prints the character A
        OUT (1),A       ; prints the number 65
        HALT`,
        prints: 'A65',
      },
      { type: 'tip', text: 'Printing does not change A, so you can print the same value several ways in a row.' },
    ],
    task: ['Register B holds a number. Print it as a decimal number.'],
    starterCode: startWith('B contains a number', 'port 1 = print a number'),
    hints: hints(
      ['OUT only sends the A register.', 'Copy B into A first.'],
      'Copy B into A, then send it to port 1.',
      `        ORG 0x8000
        LD A,B          ; OUT can only send A
        OUT (1),A       ; port 1 prints it as a number
        HALT`,
    ),
    tests: [
      { name: 'B = 42', setup: { registers: { B: 42 } }, expect: { output: '42' } },
      { name: 'B = 0', setup: { registers: { B: 0 } }, expect: { output: '0' } },
      { name: 'B = 255', setup: { registers: { B: 255 } }, expect: { output: '255' } },
    ],
  },
  {
    id: 'newlines',
    title: 'Building up output',
    module: 'Input and output',
    intro: 'Port 2 starts a new line, so a program can print several lines of results.',
    content: [
      { type: 'text', text: 'Port 2 prints a newline whatever is in A. Together the three ports let you build up readable output a piece at a time: text, then a number, then a new line.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,1
        OUT (1),A       ; 1
        OUT (2),A       ; new line
        LD A,2
        OUT (1),A       ; 2
        HALT`,
        prints: '1\n2',
      },
      { type: 'tip', text: 'The trainer ignores blank space at the very end of the output when it checks your answer, but newlines in the middle matter.' },
    ],
    task: ['Print the letters OK on the first line.', 'Then print the number held in register B on the second line.'],
    starterCode: startWith('B contains a number'),
    hints: hints(
      ['Print O, then K with port 0. Then use port 2 to start the next line.', 'Remember that port 1 sends A, so B has to be copied into A first.'],
      'Text, newline, then the number.',
      `        ORG 0x8000
        LD A,'O'
        OUT (0),A
        LD A,'K'
        OUT (0),A
        OUT (2),A       ; new line
        LD A,B
        OUT (1),A       ; the number
        HALT`,
    ),
    tests: [
      { name: 'B = 3', setup: { registers: { B: 3 } }, expect: { output: 'OK\n3' } },
      { name: 'B = 250', setup: { registers: { B: 250 } }, expect: { output: 'OK\n250' } },
    ],
  },
]
