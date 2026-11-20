import { startWith, startWithScreen, hints } from './helpers.js'

export default [
  {
    id: 'array-loop',
    title: 'Looping over an array',
    module: 'Arrays and strings',
    intro: 'Combine a pointer in HL with a counter in B to visit every element.',
    content: [
      { type: 'text', text: 'Point HL at the first element, put the number of elements in B, and loop: work on `(HL)`, move on with `INC HL`, and let `DJNZ` count the elements. The array is processed one byte at a time, in order. Here each element is a single digit, so adding `\'0\'` turns it into a character that `RST 0x10` can print.' },
      { type: 'compare', high: 'for x in list:\n    show(x)', z80: '        LD HL,list\n        LD B,3\nnext:   LD A,(HL)\n        ADD A,\'0\'\n        RST 0x10\n        INC HL\n        DJNZ next\nlist:   DB 7,8,9' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD HL,list
        LD B,3          ; three elements
next:   LD A,(HL)
        ADD A,'0'       ; turn the digit into its character
        RST 0x10        ; print the element
        LD A,13
        RST 0x10        ; and a new line
        INC HL          ; move to the next one
        DJNZ next
        HALT
list:   DB 7,8,9`,
        prints: '7\n8\n9\n',
      },
      { type: 'tip', text: 'Writing back works the same way: `LD (HL),A` stores over the element HL points at, so you can change an array in place.' },
    ],
    task: ['Create an array called values holding the five bytes 3, 5, 7, 9 and 11.', 'Double every element in place, using a loop.'],
    starterCode: startWith('define the array values with DB after HALT'),
    hints: hints(
      ['Define values after HALT. Point HL at it and put its length, 5, in B.', 'Read each element into A, change it, and write it back to the same place. ADD A,A doubles A. Do not forget INC HL, or you will keep editing the same element.'],
      'Define the array, then a loop that reads, doubles, writes back and steps on.',
      `        ORG 0x8000
        LD HL,values
        LD B,5          ; five elements
loop:   LD A,(HL)       ; read
        ADD A,A         ; double
        LD (HL),A       ; write back
        INC HL
        DJNZ loop
        HALT
values: DB 3,5,7,9,11`,
    ),
    tests: [
      { name: '3,5,7,9,11', expect: { memory: { values: [6, 10, 14, 18, 22] } } },
      { name: 'zeros and big values', setup: { memory: { values: [100, 0, 5, 7, 127] } }, expect: { memory: { values: [200, 0, 10, 14, 254] } } },
      { name: 'a neighbouring byte is untouched', setup: { memory: { values: [1, 2, 3, 4, 5, 9] } }, expect: { memory: { values: [2, 4, 6, 8, 10, 9] } } },
    ],
  },
  {
    id: 'array-terminator',
    title: 'Ending an array with 0',
    module: 'Arrays and strings',
    intro: 'Put a 0 after the last element, and a loop can find the end by itself, with no counter.',
    content: [
      { type: 'text', text: 'A counter in B works when you know the length in advance. If you add or remove an element you must remember to change the count too. Another way is to end the array with a 0 byte, a "terminator", so the data marks its own end. The loop reads each element and tests it. If it is 0 the array is finished; otherwise it works on the element and moves on.' },
      { type: 'text', text: '`OR A` does not change A, but it sets the Zero flag when A is 0. So `LD A,(HL)` then `OR A` then `JR Z,done` stops the loop at the terminator. The catch is that 0 can no longer be a real element, because it would end the array early.' },
      { type: 'compare', high: 'i = 0\nwhile list[i] != 0:\n    show(list[i])\n    i += 1', z80: '        LD HL,list\nnext:   LD A,(HL)\n        OR A\n        JR Z,done\n        ADD A,\'0\'\n        RST 0x10\n        INC HL\n        JR next\ndone:\nlist:   DB 7,8,9,0' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD HL,list
next:   LD A,(HL)       ; read an element
        OR A            ; sets Zero if it is 0
        JR Z,done       ; 0 is the end of the array
        ADD A,'0'       ; turn the digit into its character
        RST 0x10        ; print it
        INC HL          ; move to the next one
        JR next
done:   HALT
list:   DB 7,8,9,0      ; the final 0 marks the end`,
        prints: '789',
      },
      { type: 'tip', text: 'Now you can add or remove elements and the loop needs no change. Just keep the 0 at the end. Forget it and the loop runs on into whatever bytes follow.' },
    ],
    task: ['Create an array called nums holding the bytes 4, 9, 15 and 2, followed by a 0 to end it.', 'Add up all the elements, without counting them, and leave the total in register D.'],
    starterCode: startWith('define nums with DB after HALT, ending in 0'),
    hints: hints(
      ['Define nums after HALT with DB 4,9,15,2,0. The last 0 is not part of the sum; it marks the end.', 'Keep the running total in D, starting at 0. Loop: read an element into A, use OR A and JR Z to stop at the terminator, otherwise add it to D and INC HL.', 'ADD A,D leaves the sum in A, so copy it back into D with LD D,A before the next element.'],
      'Clear D, then loop until the terminator, adding each element to D.',
      `        ORG 0x8000
        LD HL,nums
        LD D,0          ; running total
next:   LD A,(HL)       ; read an element
        OR A            ; is it the 0 terminator?
        JR Z,done
        ADD A,D         ; add the total so far
        LD D,A          ; keep the new total
        INC HL
        JR next
done:   HALT
nums:   DB 4,9,15,2,0`,
    ),
    tests: [
      { name: '4,9,15,2 adds up to 30', expect: { registers: { D: 30 } } },
      { name: 'an empty array', setup: { memory: { nums: [0] } }, expect: { registers: { D: 0 } } },
      { name: 'a single element', setup: { memory: { nums: [7, 0] } }, expect: { registers: { D: 7 } } },
      { name: 'a longer array', setup: { memory: { nums: [1, 2, 3, 4, 5, 6, 7, 8, 0] } }, expect: { registers: { D: 36 } } },
      { name: 'stops at the first 0', setup: { memory: { nums: [5, 5, 0, 9, 9, 0] } }, expect: { registers: { D: 10 } } },
    ],
  },
  {
    id: 'strings',
    title: 'Strings: text in memory',
    module: 'Arrays and strings',
    intro: 'A string is an array of characters. Ending it with a 0 byte lets a loop know where it stops.',
    content: [
      { type: 'text', text: '`DB "text"` stores the character codes of the text, one byte each. The Z80 does not know how long a string is, so the usual convention is to add a 0 byte at the end (a "terminator"). A print loop reads a character, stops if it is 0, otherwise prints it and moves on.' },
      { type: 'compare', high: 'for ch in "Hi!":\n    show(ch)', z80: '        LD HL,msg\nnext:   LD A,(HL)\n        OR A\n        JR Z,done\n        RST 0x10\n        INC HL\n        JR next\ndone:\nmsg:    DB "Hi!",0' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD HL,msg
next:   LD A,(HL)       ; read a character
        OR A            ; is it the 0 terminator?
        JR Z,done
        RST 0x10        ; print it
        INC HL          ; next character
        JR next
done:   HALT
msg:    DB "Hi!",0`,
        prints: 'Hi!',
      },
      { type: 'tip', text: 'Forgetting the 0 is a classic bug: the loop runs on past the end of your text into whatever bytes follow.' },
    ],
    task: ['Create a string called msg holding Hello, Z80! and print it.', 'Then start a new line and print how many characters the string has, as a decimal number.'],
    starterCode: startWithScreen('RST 0x10 prints a character'),
    hints: hints(
      ['Put the text in memory after HALT with DB "...",0 and give it a label.', 'Point HL at the label, then loop: LD A,(HL), stop on zero with OR A and JR Z, print, INC HL. Count the characters in a register as you go.', 'Printing a number destroys BC, so count in D (not B or C) and copy it into C at the end.'],
      'The print loop, plus a counter that goes up once per character.',
      `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD HL,msg
        LD D,0          ; character count
next:   LD A,(HL)
        OR A
        JR Z,done
        RST 0x10
        INC D           ; one more character
        INC HL
        JR next
done:   LD A,13
        RST 0x10        ; new line
        LD C,D
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; print the count
        HALT
msg:    DB "Hello, Z80!",0`,
    ),
    tests: [
      { name: 'Hello, Z80! has 11', expect: { output: 'Hello, Z80!\n11' } },
      { name: 'a shorter string', setup: { memory: { msg: [72, 105, 33, 0] } }, expect: { output: 'Hi!\n3' } },
      { name: 'an empty string', setup: { memory: { msg: [0] } }, expect: { output: '\n0' } },
    ],
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
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD HL,src
        LD DE,dst
        LD BC,3
        LDIR            ; copy 3 bytes from src to dst
        LD A,(dst)
        RST 0x10        ; prints H
        HALT
src:    DB "Hi!"
dst:    DS 3            ; three empty bytes`,
        prints: 'H',
      },
      { type: 'tip', text: 'If the destination overlaps the source and sits above it, `LDIR` would overwrite bytes it has not copied yet. Use `LDDR` instead: it works backwards, so start HL and DE at the last byte of each block.' },
    ],
    task: ['Create a six-byte array called source holding 1, 2, 3, 4, 5 and 6, and an empty six-byte block called target.', 'Copy the whole of source into target. Leave source where it is.'],
    starterCode: startWith('define source (DB) and target (DS) after HALT'),
    hints: hints(
      ['Put both blocks after HALT: source with DB and its six values, target with DS 6.', 'Set HL to the source address, DE to the target address and BC to the number of bytes (LD HL,source and so on), then you need one block instruction.'],
      'Define the two blocks, set up HL, DE and BC, then LDIR.',
      `        ORG 0x8000
        LD HL,source
        LD DE,target
        LD BC,6
        LDIR            ; copy BC bytes from (HL) to (DE)
        HALT
source: DB 1,2,3,4,5,6
target: DS 6`,
    ),
    tests: [
      { name: 'copy 1 to 6', expect: { memory: { source: [1, 2, 3, 4, 5, 6], target: [1, 2, 3, 4, 5, 6] } } },
      { name: 'copy other values', setup: { memory: { source: [9, 8, 7, 6, 5, 4] } }, expect: { memory: { source: [9, 8, 7, 6, 5, 4], target: [9, 8, 7, 6, 5, 4] } } },
      { name: 'zeros and 255', setup: { memory: { source: [0, 255, 0, 255, 0, 255] } }, expect: { memory: { target: [0, 255, 0, 255, 0, 255] } } },
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
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD HL,data
        LD BC,5         ; look at up to 5 bytes
        LD A,30
        CPIR
        JR NZ,missing   ; Z clear: not found
        LD A,'Y'
        JR show
missing: LD A,'N'
show:   RST 0x10        ; prints Y
        HALT
data:   DB 10,20,30,40,50`,
        prints: 'Y',
      },
      { type: 'tip', text: '`CPI` is the single-step version: it compares once, moves HL on and counts BC down. A loop of `CPI` lets you do extra work between bytes.' },
    ],
    task: ['Create a block of text called text holding the nine characters Hello*Z80.', 'If the byte 0x2A (the star character) appears anywhere in text, put 1 in register D. Otherwise D must be 0.'],
    starterCode: startWith('define text with DB after HALT'),
    hints: hints(
      ['Define text after HALT with DB "Hello*Z80". It is nine bytes long and has no zero on the end.', 'Put the value you are searching for in A, then use CPIR. After CPIR, the Zero flag is set only if the value was found.'],
      'Define text, clear D, search, and set D if found.',
      `        ORG 0x8000
        LD HL,text
        LD BC,9         ; nine bytes to look at
        LD A,0x2A       ; the value to find
        LD D,0
        CPIR
        JR NZ,done      ; not found
        LD D,1
done:   HALT
text:   DB "Hello*Z80"`,
    ),
    tests: [
      { name: 'star in the middle', expect: { registers: { D: 1 } } },
      { name: 'not present', setup: { memory: { text: [72, 101, 108, 108, 111, 45, 90, 56, 48] } }, expect: { registers: { D: 0 } } },
      { name: 'star at the very end', setup: { memory: { text: [72, 101, 108, 108, 111, 90, 56, 48, 0x2a] } }, expect: { registers: { D: 1 } } },
      { name: 'star just past the end is not searched', setup: { memory: { text: [72, 101, 108, 108, 111, 90, 56, 48, 49, 0x2a] } }, expect: { registers: { D: 0 } } },
    ],
  },
]
