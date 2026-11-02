import { startWith, hints } from './helpers.js'

export default [
  {
    id: 'array-loop',
    title: 'Looping over an array',
    module: 'Arrays and strings',
    intro: 'Combine a pointer in HL with a counter in B to visit every element.',
    content: [
      { type: 'text', text: 'Point HL at the first element, put the number of elements in B, and loop: work on `(HL)`, move on with `INC HL`, and let `DJNZ` count the elements. The array is processed one byte at a time, in order.' },
      { type: 'compare', high: 'for x in list:\n    show(x)', z80: '        LD HL,list\n        LD B,3\nnext:   LD A,(HL)\n        OUT (1),A\n        INC HL\n        DJNZ next\nlist:   DB 7,8,9' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD HL,list
        LD B,3          ; three elements
next:   LD A,(HL)
        OUT (1),A       ; print the element
        OUT (2),A       ; and a new line
        INC HL          ; move to the next one
        DJNZ next
        HALT
list:   DB 7,8,9`,
        prints: '7\n8\n9\n',
      },
      { type: 'tip', text: 'Writing back works the same way: `LD (HL),A` stores over the element HL points at, so you can change an array in place.' },
    ],
    task: ['HL points to an array and B holds how many elements it has (at least 1).', 'Double every element in place. Each element is at most 127.'],
    starterCode: startWith('HL points at the array, B holds its length'),
    hints: hints(
      ['Read each element into A, change it, and write it back to the same place.', 'ADD A,A doubles A. Do not forget INC HL, or you will keep editing the same element.'],
      'A loop that reads, doubles, writes back and steps on.',
      `        ORG 0x8000
loop:   LD A,(HL)       ; read
        ADD A,A         ; double
        LD (HL),A       ; write back
        INC HL
        DJNZ loop
        HALT`,
    ),
    tests: [
      { name: '[1,2,3]', setup: { registers: { HL: 0x9000, B: 3 }, memory: { 0x9000: [1, 2, 3] } }, expect: { memory: { 0x9000: [2, 4, 6] } } },
      { name: 'five elements', setup: { registers: { HL: 0x9100, B: 5 }, memory: { 0x9100: [100, 0, 5, 7, 50] } }, expect: { memory: { 0x9100: [200, 0, 10, 14, 100] } } },
      { name: 'one element, neighbour untouched', setup: { registers: { HL: 0x9200, B: 1 }, memory: { 0x9200: [60, 9] } }, expect: { memory: { 0x9200: [120, 9] } } },
    ],
  },
  {
    id: 'strings',
    title: 'Strings: text in memory',
    module: 'Arrays and strings',
    intro: 'A string is an array of characters. Ending it with a 0 byte lets a loop know where it stops.',
    content: [
      { type: 'text', text: '`DB "text"` stores the character codes of the text, one byte each. The Z80 does not know how long a string is, so the usual convention is to add a 0 byte at the end (a "terminator"). A print loop reads a character, stops if it is 0, otherwise prints it and moves on.' },
      { type: 'compare', high: 'for ch in "Hi!":\n    show(ch)', z80: '        LD HL,msg\nnext:   LD A,(HL)\n        OR A\n        JR Z,done\n        OUT (0),A\n        INC HL\n        JR next\ndone:\nmsg:    DB "Hi!",0' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD HL,msg
next:   LD A,(HL)       ; read a character
        OR A            ; is it the 0 terminator?
        JR Z,done
        OUT (0),A       ; print it
        INC HL          ; next character
        JR next
done:   HALT
msg:    DB "Hi!",0`,
        prints: 'Hi!',
      },
      { type: 'tip', text: 'Forgetting the 0 is a classic bug: the loop runs on past the end of your text into whatever bytes follow.' },
    ],
    task: ['Print exactly Hello, Z80! to the console, using a string in memory and a loop.'],
    starterCode: startWith('port 0 prints a character'),
    hints: hints(
      ['Put the text in memory after HALT with DB "...",0 and give it a label.', 'Point HL at the label, then loop: LD A,(HL), stop on zero with OR A and JR Z, print, INC HL.'],
      'The string-printing loop from the example, with the new text.',
      `        ORG 0x8000
        LD HL,msg
next:   LD A,(HL)
        OR A
        JR Z,done
        OUT (0),A
        INC HL
        JR next
done:   HALT
msg:    DB "Hello, Z80!",0`,
    ),
    tests: [{ name: 'prints the greeting', expect: { output: 'Hello, Z80!' } }],
  },
  {
    id: 'block-copy',
    title: 'Copying blocks of memory',
    module: 'Arrays and strings',
    intro: '`LDIR` copies a whole block in one instruction.',
    content: [
      { type: 'text', text: 'Copying memory byte by byte with a loop works, but the Z80 has a block instruction that does it all. Set `HL` to the source address, `DE` to the destination and `BC` to the number of bytes, then `LDIR` ("load, increment, repeat") copies them all, leaving BC at 0.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD HL,src
        LD DE,dst
        LD BC,3
        LDIR            ; copy 3 bytes from src to dst
        LD A,(dst)
        OUT (0),A       ; prints H
        HALT
src:    DB "Hi!"
dst:    DS 3            ; three empty bytes`,
        prints: 'H',
      },
      { type: 'tip', text: 'If the destination overlaps the source and sits above it, `LDIR` would overwrite bytes it has not copied yet. Use `LDDR` instead: it works backwards, so start HL and DE at the last byte of each block.' },
    ],
    task: ['HL holds the source address, DE the destination address and BC the number of bytes.', 'Copy the block from the source to the destination.'],
    starterCode: startWith('HL = source, DE = destination, BC = length'),
    hints: hints(
      ['The three registers are already set up the way the block instructions want them.', 'You need one instruction.'],
      'LDIR does it all.',
      `        ORG 0x8000
        LDIR            ; copy BC bytes from (HL) to (DE)
        HALT`,
    ),
    tests: [
      { name: 'copy 4 bytes', setup: { registers: { HL: 0x9000, DE: 0x9100, BC: 4 }, memory: { 0x9000: [1, 2, 3, 4] } }, expect: { memory: { 0x9100: [1, 2, 3, 4] } } },
      { name: 'copy 10 bytes', setup: { registers: { HL: 0x9200, DE: 0x9300, BC: 10 }, memory: { 0x9200: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] } }, expect: { memory: { 0x9300: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] } } },
    ],
  },
  {
    id: 'search',
    title: 'Searching with CPIR',
    module: 'Arrays and strings',
    intro: '`CPIR` scans a block for a value in A without a loop.',
    content: [
      { type: 'text', text: 'Put the value to find in `A`, the start of the block in `HL` and the maximum number of bytes to look at in `BC`, then run `CPIR` ("compare, increment, repeat"). It stops at the first byte equal to A or when BC runs out. If it found the value, the Zero flag is set and HL is one past it; if not, Zero is clear.' },
      { type: 'compare', high: 'if 30 in data:\n    show("Y")', z80: '        LD A,30\n        CPIR\n        JR NZ,missing\n        ; found it\nmissing:' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD HL,data
        LD BC,5         ; look at up to 5 bytes
        LD A,30
        CPIR
        JR NZ,missing   ; Z clear: not found
        LD A,'Y'
        JR show
missing: LD A,'N'
show:   OUT (0),A       ; prints Y
        HALT
data:   DB 10,20,30,40,50`,
        prints: 'Y',
      },
      { type: 'tip', text: '`CPI` is the single-step version: it compares once, moves HL on and counts BC down. A loop of `CPI` lets you do extra work between bytes.' },
    ],
    task: ['HL points at a block of bytes and BC says how many bytes it has (at least 1).', 'If the byte 0x2A (the star character) appears anywhere in the block, put 1 in register D. Otherwise D must be 0.'],
    starterCode: startWith('HL = start of the block, BC = its length'),
    hints: hints(
      ['Put the value you are searching for in A, then use CPIR.', 'After CPIR, the Zero flag is set only if the value was found.'],
      'Clear D, search, and set D if found.',
      `        ORG 0x8000
        LD A,0x2A       ; the value to find
        LD D,0
        CPIR
        JR NZ,done      ; not found
        LD D,1
done:   HALT`,
    ),
    tests: [
      { name: 'found at the end', setup: { registers: { HL: 0x9000, BC: 3 }, memory: { 0x9000: [1, 2, 0x2a] } }, expect: { registers: { D: 1 } } },
      { name: 'not present', setup: { registers: { HL: 0x9000, BC: 3 }, memory: { 0x9000: [1, 2, 3] } }, expect: { registers: { D: 0 } } },
      { name: 'single byte found', setup: { registers: { HL: 0x9000, BC: 1 }, memory: { 0x9000: [0x2a, 5] } }, expect: { registers: { D: 1 } } },
      { name: 'past the end is not searched', setup: { registers: { HL: 0x9000, BC: 1 }, memory: { 0x9000: [1, 0x2a] } }, expect: { registers: { D: 0 } } },
    ],
  },
]
