// All trainer challenges. To add one, append an object that follows the schema
// documented in challengeSchema.js. Every challenge needs a reference solution in
// solutions.js (tests only, keyed by challenge id); the unit tests run it, so a
// new challenge is proven solvable.
//
// Output ports: OUT (0),A prints a character, OUT (1),A prints A as a decimal
// number and OUT (2),A prints a newline.

const bytesOf = (s) => [...s].map((ch) => ch.charCodeAt(0))
const lines = (items) => items.join('\n')
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
const fizzbuzz = (n) =>
  lines(range(1, n).map((i) => (i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i))))

const challenges = [
  {
    id: 'load-a',
    title: 'Hello, Register A',
    difficulty: 'beginner',
    category: 'basics',
    description: 'Registers are the Z80\'s variables. Your first job is to store a value in one of them.',
    task: ['Make register A hold the number 42 when the program ends.'],
    explanation:
      'The Z80 has a handful of 8-bit registers named A, B, C, D, E, H and L. The A register, the accumulator, is the busiest of them. Every program ends with HALT, which tells the processor to stop.',
    starterCode: '        ORG 0x8000\n\n        ; your code here\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'The LD instruction copies a value into a destination: LD destination, source.' },
      { title: 'Hint 2', body: 'A number written directly in the instruction is called an immediate value.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'One LD loads the constant 42 into A.',
        code: `        ORG 0x8000
        LD A,42         ; load the constant 42 into A
        HALT
`,
      },
    ],
    tests: [{ name: 'A equals 42', expect: { registers: { A: 42 } } }],
  },
  {
    id: 'copy-registers',
    title: 'Copy Cat',
    difficulty: 'beginner',
    category: 'basics',
    description: 'Register B already holds a value. Make copies of it in other registers.',
    task: ['Copy the value in register B into register C.', 'Copy it into register D as well.', 'Register B must keep its value.'],
    explanation: 'Registers can be copied to one another with a single instruction. The source is left unchanged by a copy.',
    starterCode: '        ORG 0x8000\n\n        ; B already contains a value\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'LD works between two registers: LD dest, source.' },
      { title: 'Hint 2', body: 'You will need two LD instructions.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'Two loads copy B into C and D. B is only read, so it keeps its value.',
        code: `        ORG 0x8000
        LD C,B          ; C = B
        LD D,B          ; D = B
        HALT
`,
      },
    ],
    tests: [
      { name: 'B = 7', setup: { registers: { B: 7 } }, expect: { registers: { B: 7, C: 7, D: 7 } } },
      { name: 'B = 200', setup: { registers: { B: 200 } }, expect: { registers: { B: 200, C: 200, D: 200 } } },
    ],
  },
  {
    id: 'add-two',
    title: 'Add Them Up',
    difficulty: 'beginner',
    category: 'arithmetic',
    description: 'Registers A and B each contain a number. Add them together.',
    task: ['Leave the sum of A and B in register A.', 'You may assume the sum is no larger than 255.'],
    explanation: 'Arithmetic on the Z80 happens in the accumulator, register A, which is both an input and the place where the result lands.',
    starterCode: '        ORG 0x8000\n\n        ; A and B contain numbers\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'There is an ADD instruction that takes A as its first operand.' },
      { title: 'Hint 2', body: 'ADD A,B adds B to A.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'ADD A,B adds B to A and leaves the sum in A.',
        code: `        ORG 0x8000
        ADD A,B         ; A = A + B
        HALT
`,
      },
    ],
    tests: [
      { name: '3 + 4', setup: { registers: { A: 3, B: 4 } }, expect: { registers: { A: 7 } } },
      { name: '100 + 55', setup: { registers: { A: 100, B: 55 } }, expect: { registers: { A: 155 } } },
      { name: '0 + 0', setup: { registers: { A: 0, B: 0 } }, expect: { registers: { A: 0 } } },
    ],
  },
  {
    id: 'subtract',
    title: 'Take Away',
    difficulty: 'beginner',
    category: 'arithmetic',
    description: 'Registers A and B each contain a number, and A is the larger (or equal).',
    task: ['Subtract B from A, leaving the difference in register A.'],
    explanation: 'Subtraction works in the accumulator too: A is the number being subtracted from, and it receives the result.',
    starterCode: '        ORG 0x8000\n\n        ; A >= B\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'The mnemonic for subtracting is SUB.' },
      { title: 'Hint 2', body: 'SUB B subtracts register B from A.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'SUB B subtracts B from A and leaves the difference in A.',
        code: `        ORG 0x8000
        SUB B           ; A = A - B
        HALT
`,
      },
    ],
    tests: [
      { name: '10 - 3', setup: { registers: { A: 10, B: 3 } }, expect: { registers: { A: 7 } } },
      { name: '50 - 50', setup: { registers: { A: 50, B: 50 } }, expect: { registers: { A: 0 } } },
    ],
  },
  {
    id: 'inc-dec',
    title: 'One Up, One Down',
    difficulty: 'beginner',
    category: 'arithmetic',
    description: 'Register B holds a number between 1 and 254.',
    task: ['Put B + 1 into register C.', 'Put B - 1 into register D.', 'Register B must keep its original value.'],
    explanation: 'Adding or removing exactly one is one of the most common operations in any program. Here you must also keep the original value intact.',
    starterCode: '        ORG 0x8000\n\n        ; B contains a number from 1 to 254\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'INC adds one to a register and DEC subtracts one.' },
      { title: 'Hint 2', body: 'INC and DEC change the register in place, so copy B first.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'Copy B into C and D first, then change the copies so B is untouched.',
        code: `        ORG 0x8000
        LD C,B
        INC C           ; C = B + 1
        LD D,B
        DEC D           ; D = B - 1
        HALT
`,
      },
    ],
    tests: [
      { name: 'B = 5', setup: { registers: { B: 5 } }, expect: { registers: { B: 5, C: 6, D: 4 } } },
      { name: 'B = 100', setup: { registers: { B: 100 } }, expect: { registers: { B: 100, C: 101, D: 99 } } },
    ],
  },
  {
    id: 'bit-twiddle',
    title: 'Flip the Bits',
    difficulty: 'beginner',
    category: 'basics',
    description: 'Register A holds a byte. Change two of its bits.',
    task: ['Set bit 7 of A to 1.', 'Clear bit 0 of A to 0.', 'Leave all other bits as they were.'],
    explanation: 'A byte is eight bits, numbered 0 (the least significant) to 7 (the most significant). Individual bits can be switched on and off without disturbing their neighbours.',
    starterCode: '        ORG 0x8000\n\n        ; A contains a byte\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'There are instructions that operate on a single named bit of a register.' },
      { title: 'Hint 2', body: 'SET b,r turns a bit on. RES b,r turns it off.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'SET turns bit 7 on and RES turns bit 0 off. Other bits are not touched.',
        code: `        ORG 0x8000
        SET 7,A         ; bit 7 = 1
        RES 0,A         ; bit 0 = 0
        HALT
`,
      },
    ],
    tests: [
      { name: 'A = 0', setup: { registers: { A: 0 } }, expect: { registers: { A: 0x80 } } },
      { name: 'A = 255', setup: { registers: { A: 0xff } }, expect: { registers: { A: 0xfe } } },
      { name: 'A = 0x55', setup: { registers: { A: 0x55 } }, expect: { registers: { A: 0xd4 } } },
    ],
  },
  {
    id: 'print-char',
    title: 'Say It With a Letter',
    difficulty: 'beginner',
    category: 'output',
    description: 'Programs usually need to show something to the user. In this trainer, you print by writing to an output port.',
    task: ['Print the single letter Z to the console.'],
    explanation:
      'The Z80 talks to the outside world through ports. In this trainer, port 0 is the console: whatever character code you send there is displayed. Port 1 prints a number in decimal and port 2 prints a newline.',
    starterCode: '        ORG 0x8000\n\n        ; port 0 = print a character\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'OUT (port),A sends the value in A to a port.' },
      { title: 'Hint 2', body: 'Characters are just numbers. You can write a character in quotes, like \'Z\', anywhere a number goes.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'Load the character code into A, then send A to port 0.',
        code: `        ORG 0x8000
        LD A,'Z'        ; the character code for Z
        OUT (0),A       ; port 0 prints a character
        HALT
`,
      },
    ],
    tests: [{ name: 'prints Z', expect: { output: 'Z' } }],
  },
  {
    id: 'print-hello',
    title: 'Hello, World',
    difficulty: 'intermediate',
    category: 'output',
    description: 'The traditional first program: print a greeting.',
    task: ['Print exactly Hello, Z80! to the console.'],
    explanation: 'Text is stored in memory as a row of byte values, and the console shows whatever character codes you send it.',
    starterCode: '        ORG 0x8000\n\n        ; port 0 prints a character\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'You can print each character separately, but that is a lot of repeated code.' },
      { title: 'Hint 2', body: 'DB "text" stores a string in memory. Add a 0 after it to mark the end.' },
      { title: 'Hint 3', body: 'A register pair such as HL can point at a byte in memory. LD A,(HL) reads that byte, INC HL moves to the next.' },
      { title: 'Hint 4', body: 'In outline: point HL at the text. Then loop: read the byte at HL into A, stop if it is 0, otherwise print it, move HL on by one, and go round again. The text and its 0 go after HALT.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'HL walks along the string. OR A sets the Z flag when the byte is the 0 terminator, which ends the loop.',
        code: `        ORG 0x8000
        LD HL,msg       ; HL points at the first character
next:   LD A,(HL)       ; read the character
        OR A            ; Z is set if it is the 0 terminator
        JR Z,done
        OUT (0),A       ; print it
        INC HL          ; move to the next character
        JR next
done:   HALT
msg:    DB "Hello, Z80!",0
`,
      },
    ],
    tests: [{ name: 'prints the greeting', expect: { output: 'Hello, Z80!' } }],
  },
  {
    id: 'print-number',
    title: 'Show Me the Number',
    difficulty: 'beginner',
    category: 'output',
    description: 'Register B contains a number. Show it to the user.',
    task: ['Print the value of register B as a decimal number.'],
    explanation: 'Port 1 turns a byte into its decimal text. Sending the byte 65 to port 0 would print the letter A, but sending it to port 1 prints the digits 65.',
    starterCode: '        ORG 0x8000\n\n        ; B contains a number\n        ; port 1 = print a number\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'OUT only sends the A register.' },
      { title: 'Hint 2', body: 'Copy B into A first.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'OUT only sends A, so copy B into A and use port 1 to print it as a decimal number.',
        code: `        ORG 0x8000
        LD A,B          ; OUT can only send A
        OUT (1),A       ; port 1 prints A as a number
        HALT
`,
      },
    ],
    tests: [
      { name: 'B = 42', setup: { registers: { B: 42 } }, expect: { output: '42' } },
      { name: 'B = 0', setup: { registers: { B: 0 } }, expect: { output: '0' } },
      { name: 'B = 255', setup: { registers: { B: 255 } }, expect: { output: '255' } },
    ],
  },
  {
    id: 'count-up',
    title: 'Count to Ten',
    difficulty: 'beginner',
    category: 'loops',
    description: 'Loops let a program repeat work without repeating code.',
    task: ['Print the numbers 1 to 10, one per line.'],
    explanation:
      'The Z80 has no for or while keyword, so repetition has to be built from the pieces the processor gives you.',
    starterCode: '        ORG 0x8000\n\n        ; port 1 = print a number, port 2 = newline\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'A loop needs a label to jump back to, a counter in a register, and a conditional jump that decides whether to go round again.' },
      { title: 'Hint 2', body: 'CP compares A to a value and sets the flags. JR NZ and JR Z jump depending on the result.' },
      { title: 'Hint 3', body: 'OUT (2),A prints a newline whatever A contains.' },
      { title: 'Hint 4', body: 'In outline: start a counter at 1. Each time round, print it and a newline, add 1, then compare it with 11 and go round again unless it has reached 11.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'B is the counter. Stopping when it reaches 11 means the loop body runs for 1 to 10.',
        code: `        ORG 0x8000
        LD B,1          ; counter
loop:   LD A,B
        OUT (1),A       ; print the number
        OUT (2),A       ; print a newline
        INC B
        LD A,B
        CP 11           ; reached 11?
        JR NZ,loop      ; no: repeat
        HALT
`,
      },
    ],
    tests: [{ name: 'prints 1 to 10', expect: { output: lines(range(1, 10)) } }],
  },
  {
    id: 'countdown',
    title: 'Liftoff',
    difficulty: 'intermediate',
    category: 'loops',
    description: 'Count backwards and finish with a message.',
    task: ['Print the numbers 10 down to 1, one per line.', 'Then print the word Liftoff! on its own line.'],
    explanation: 'Counting down is just as common as counting up, and loops often finish when a counter reaches zero.',
    starterCode: '        ORG 0x8000\n\n        ; port 0 = character, 1 = number, 2 = newline\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'DJNZ decrements B and jumps if the result is not zero.' },
      { title: 'Hint 2', body: 'DJNZ ends the loop when B reaches 0, so think about how your printed value relates to B.' },
      { title: 'Hint 3', body: 'In outline: put 10 in B. Each time round, copy B to A, print it and a newline; DJNZ then subtracts 1 and repeats until B is 0. Afterwards print the word with a loop over a 0-terminated string.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'DJNZ counts B down from 10 to 1, so B is exactly the number to print. A second loop then prints the message.',
        code: `        ORG 0x8000
        LD B,10
loop:   LD A,B
        OUT (1),A       ; print the number
        OUT (2),A       ; print a newline
        DJNZ loop       ; B = B - 1, repeat while B != 0
        LD HL,msg
next:   LD A,(HL)
        OR A            ; reached the 0 terminator?
        JR Z,done
        OUT (0),A
        INC HL
        JR next
done:   HALT
msg:    DB "Liftoff!",0
`,
      },
    ],
    tests: [{ name: 'counts down and launches', expect: { output: lines([...range(1, 10).reverse(), 'Liftoff!']) } }],
  },
  {
    id: 'sum-to-n',
    title: 'Gauss Would Be Proud',
    difficulty: 'beginner',
    category: 'loops',
    description: 'Register B holds a number N between 1 and 20.',
    task: ['Leave the sum 1 + 2 + ... + N in register A.'],
    explanation: 'Accumulating a running total inside a loop is one of the most common patterns in programming.',
    starterCode: '        ORG 0x8000\n\n        ; B = N\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'Start with a running total of zero. XOR A is a quick way to zero A.' },
      { title: 'Hint 2', body: 'DJNZ loops while decrementing B. B itself is a number you want to add.' },
      { title: 'Hint 3', body: 'In outline: clear A to 0. Each time round, add B to A. DJNZ then subtracts 1 from B and repeats while B is not 0, so you add N, N-1, ... 1.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'B counts down from N to 1 and is added to the total each time round.',
        code: `        ORG 0x8000
        XOR A           ; A = 0, the running total
loop:   ADD A,B         ; add the current B
        DJNZ loop       ; B = B - 1, repeat while B != 0
        HALT
`,
      },
    ],
    tests: [
      { name: 'N = 1', setup: { registers: { B: 1 } }, expect: { registers: { A: 1 } } },
      { name: 'N = 5', setup: { registers: { B: 5 } }, expect: { registers: { A: 15 } } },
      { name: 'N = 10', setup: { registers: { B: 10 } }, expect: { registers: { A: 55 } } },
      { name: 'N = 20', setup: { registers: { B: 20 } }, expect: { registers: { A: 210 } } },
    ],
  },
  {
    id: 'multiply',
    title: 'Multiply the Hard Way',
    difficulty: 'intermediate',
    category: 'loops',
    description: 'The Z80 has no multiply instruction. Registers B and C hold two numbers.',
    task: ['Leave B x C in register A.', 'Either number may be zero.', 'The product is never more than 255.'],
    explanation: 'The Z80 gives you only addition, so multiplication has to be built from simpler steps. Watch out for edge cases: either input may be zero.',
    starterCode: '        ORG 0x8000\n\n        ; B and C contain numbers\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'Multiplication is repeated addition: start a running total at zero and add C to it, B times.' },
      { title: 'Hint 2', body: 'DJNZ decrements before it tests, so a counter of 0 would loop 256 times.' },
      { title: 'Hint 3', body: 'INC B followed by DEC B leaves B unchanged but updates the Z flag.' },
      { title: 'Hint 4', body: 'In outline: clear A, then add C to it B times with a DJNZ loop. If B is 0 you must skip the loop altogether, so test B before the loop starts.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'The INC B / DEC B pair sets Z when B is 0 without changing B, which lets the program skip the loop for a multiplier of zero.',
        code: `        ORG 0x8000
        XOR A           ; A = 0, the running total
        INC B
        DEC B           ; B unchanged, but Z is set if B = 0
        JR Z,done       ; multiplying by 0: A is already 0
loop:   ADD A,C         ; add C
        DJNZ loop       ; ...B times
done:   HALT
`,
      },
    ],
    tests: [
      { name: '3 x 4', setup: { registers: { B: 3, C: 4 } }, expect: { registers: { A: 12 } } },
      { name: '7 x 9', setup: { registers: { B: 7, C: 9 } }, expect: { registers: { A: 63 } } },
      { name: '0 x 5', setup: { registers: { B: 0, C: 5 } }, expect: { registers: { A: 0 } } },
      { name: '5 x 0', setup: { registers: { B: 5, C: 0 } }, expect: { registers: { A: 0 } } },
    ],
  },
  {
    id: 'max-of-two',
    title: 'Bigger Wins',
    difficulty: 'beginner',
    category: 'conditionals',
    description: 'Registers A and B hold two unsigned numbers.',
    task: ['Make sure register A ends up holding the larger of the two.'],
    explanation: 'Decisions on the Z80 are made with flags, the processor\'s record of what the last operation did. This is the assembly version of an if statement.',
    starterCode: '        ORG 0x8000\n\n        ; A and B contain numbers\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'A comparison sets the flags and a conditional jump reads them. CP B compares A with B without changing either register.' },
      { title: 'Hint 2', body: 'After CP B, the Carry flag is set when A is less than B.' },
      { title: 'Hint 3', body: 'JR C and JR NC jump depending on the Carry flag.' },
      { title: 'Hint 4', body: 'In outline: compare A with B. If A is not smaller (no carry) you are done; otherwise copy B into A.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'CP B sets Carry when A < B. If Carry is clear, A is already the larger value and the copy is skipped.',
        code: `        ORG 0x8000
        CP B            ; compare A with B (Carry set if A < B)
        JR NC,done      ; A >= B: A is already the larger
        LD A,B          ; otherwise take B
done:   HALT
`,
      },
    ],
    tests: [
      { name: 'A smaller', setup: { registers: { A: 3, B: 9 } }, expect: { registers: { A: 9 } } },
      { name: 'A larger', setup: { registers: { A: 9, B: 3 } }, expect: { registers: { A: 9 } } },
      { name: 'equal', setup: { registers: { A: 5, B: 5 } }, expect: { registers: { A: 5 } } },
      { name: 'large values', setup: { registers: { A: 200, B: 100 } }, expect: { registers: { A: 200 } } },
    ],
  },
  {
    id: 'even-odd',
    title: 'Odd One Out',
    difficulty: 'beginner',
    category: 'conditionals',
    description: 'Register A holds a number. Decide whether it is even.',
    task: ['Set register B to 1 if A is even.', 'Set register B to 0 if A is odd.'],
    explanation: 'Even and odd numbers differ in their binary representation.',
    starterCode: '        ORG 0x8000\n\n        ; A contains a number\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'Look at which bit differs between 4 (100) and 5 (101).' },
      { title: 'Hint 2', body: 'AND with a mask keeps only the bits you ask for, and sets the Z flag if the result is zero.' },
      { title: 'Hint 3', body: 'BIT 0,A sets the Z flag when bit 0 is clear.' },
      { title: 'Hint 4', body: 'In outline: test bit 0 of A. If it is clear the number is even. Put 1 in B before the test so you only need to overwrite it for the odd case.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'BIT 0,A sets Z when bit 0 is clear (even). LD does not change flags, so B can be loaded before the test.',
        code: `        ORG 0x8000
        LD B,1          ; assume even
        BIT 0,A         ; Z is set if bit 0 is 0 (even)
        JR Z,done
        LD B,0          ; odd
done:   HALT
`,
      },
    ],
    tests: [
      { name: '4 is even', setup: { registers: { A: 4 } }, expect: { registers: { B: 1 } } },
      { name: '7 is odd', setup: { registers: { A: 7 } }, expect: { registers: { B: 0 } } },
      { name: '0 is even', setup: { registers: { A: 0 } }, expect: { registers: { B: 1 } } },
      { name: '255 is odd', setup: { registers: { A: 255 } }, expect: { registers: { B: 0 } } },
    ],
  },
  {
    id: 'absolute-value',
    title: 'Stay Positive',
    difficulty: 'beginner',
    category: 'conditionals',
    description: 'Register A holds a signed 8-bit number in two\'s complement form (so 251 means -5).',
    task: ['Replace A with its absolute value.', 'Positive numbers and zero must not change.'],
    explanation: 'Negative numbers are stored in two\'s complement, so the same byte can mean different values depending on how you read it.',
    starterCode: '        ORG 0x8000\n\n        ; A is a signed number\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'First work out whether the number is negative. In two\'s complement the top bit (bit 7) is 1 for negative values.' },
      { title: 'Hint 2', body: 'NEG turns A into 0 - A.' },
      { title: 'Hint 3', body: 'In outline: test bit 7 of A. If it is clear the number is already positive and you are done; otherwise negate it.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'BIT 7,A sets Z when the number is non-negative. NEG then turns a negative number into its positive value.',
        code: `        ORG 0x8000
        BIT 7,A         ; Z is set if bit 7 is 0 (positive)
        JR Z,done
        NEG             ; A = 0 - A
done:   HALT
`,
      },
    ],
    tests: [
      { name: '-5 becomes 5', setup: { registers: { A: 251 } }, expect: { registers: { A: 5 } } },
      { name: '5 stays 5', setup: { registers: { A: 5 } }, expect: { registers: { A: 5 } } },
      { name: '0 stays 0', setup: { registers: { A: 0 } }, expect: { registers: { A: 0 } } },
      { name: '-1 becomes 1', setup: { registers: { A: 255 } }, expect: { registers: { A: 1 } } },
    ],
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    difficulty: 'advanced',
    category: 'loops',
    description: 'The classic interview question. Register H holds the number N to count up to.',
    task: [
      'For every number from 1 to N (inclusive), print one line.',
      'If the number is divisible by 3, print Fizz.',
      'If it is divisible by 5, print Buzz.',
      'If both, print FizzBuzz.',
      'Otherwise print the number itself.',
    ],
    explanation: 'FizzBuzz combines loops, conditionals and output. The Z80 has no divide instruction, which makes spotting multiples an interesting puzzle.',
    starterCode: '        ORG 0x8000\n\n        ; H = N\n        ; port 0 = character, 1 = number, 2 = newline\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'You do not need to divide. A counter that counts down from 3 and resets can tell you when a multiple of 3 has arrived.' },
      { title: 'Hint 2', body: 'Use a second counter for 5.' },
      { title: 'Hint 3', body: 'Printing a word is a loop of its own. Put it in a subroutine with CALL and RET.' },
      { title: 'Hint 4', body: 'Remember whether either word was printed so you know whether to print the number.' },
      { title: 'Hint 5', body: 'In outline: keep the number in B, a countdown from 3 in C and a countdown from 5 in D, and a flag in E recording whether a word was printed. For each number: decrement C and D; when one reaches 0, reload it, print its word and set a bit in E. If E is still 0, print the number. Then a newline, and stop after the limit.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'The limit arrives in H, but HL is needed for the strings, so it is saved to memory first. Counters replace division, and a shared PUTS routine prints each word.',
        code: `        ORG 0x8000
        LD A,H
        LD (limit),A    ; save the limit: HL is needed below
        LD B,1          ; current number
        LD C,3          ; counts down to the next multiple of 3
        LD D,5          ; counts down to the next multiple of 5
loop:   LD E,0          ; E = 0: nothing printed yet
        DEC C
        JR NZ,not3
        LD C,3          ; reload
        SET 0,E         ; remember we printed Fizz
        LD HL,fizz
        CALL puts
not3:   DEC D
        JR NZ,not5
        LD D,5
        SET 1,E         ; remember we printed Buzz
        LD HL,buzz
        CALL puts
not5:   LD A,E
        OR A            ; was a word printed?
        JR NZ,eol
        LD A,B
        OUT (1),A       ; no: print the number
eol:    OUT (2),A       ; newline
        LD A,(limit)
        CP B            ; finished?
        JR Z,finish
        INC B
        JR loop
finish: HALT

puts:   LD A,(HL)       ; print a 0-terminated string at HL
        OR A
        RET Z
        OUT (0),A
        INC HL
        JR puts
fizz:   DB "Fizz",0
buzz:   DB "Buzz",0
limit:  DB 0
`,
      },
    ],
    tests: [
      { name: 'N = 15', setup: { registers: { H: 15 } }, expect: { output: fizzbuzz(15) } },
      { name: 'N = 5', setup: { registers: { H: 5 } }, expect: { output: fizzbuzz(5) } },
      { name: 'N = 30', setup: { registers: { H: 30 } }, expect: { output: fizzbuzz(30) } },
      { name: 'N = 1', setup: { registers: { H: 1 } }, expect: { output: fizzbuzz(1) } },
      { name: 'N = 3', setup: { registers: { H: 3 } }, expect: { output: fizzbuzz(3) } },
      { name: 'N = 100', setup: { registers: { H: 100 } }, expect: { output: fizzbuzz(100) } },
    ],
  },
  {
    id: 'fill-memory',
    title: 'Paint the Memory',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'Memory is a long row of bytes, each with an address.',
    task: [
      'HL holds an address, B holds a count (at least 1) and A holds a value.',
      'Write the value into B consecutive bytes of memory, starting at the address in HL.',
      'Do not touch any byte beyond those.',
    ],
    explanation: 'A register pair like HL can act as a pointer. The notation (HL) means "the byte of memory that HL points to".',
    starterCode: '        ORG 0x8000\n\n        ; HL = address, B = count, A = value\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'LD (HL),A stores A into the byte at the address in HL.' },
      { title: 'Hint 2', body: 'INC HL moves the pointer along by one byte.' },
      { title: 'Hint 3', body: 'DJNZ makes a simple counted loop.' },
      { title: 'Hint 4', body: 'In outline: loop B times. Each time round, store A at the address in HL and move HL on by one.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'HL is the write pointer and B is the count; DJNZ ends the loop after B bytes.',
        code: `        ORG 0x8000
loop:   LD (HL),A       ; store A at the address in HL
        INC HL          ; next address
        DJNZ loop       ; repeat B times
        HALT
`,
      },
    ],
    tests: [
      {
        name: 'fill 5 bytes',
        setup: { registers: { HL: 0x9000, B: 5, A: 0xaa } },
        expect: { memory: { 0x9000: [0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0x00] } },
      },
      {
        name: 'fill 1 byte',
        setup: { registers: { HL: 0x9100, B: 1, A: 7 } },
        expect: { memory: { 0x9100: [7, 0] } },
      },
    ],
  },
  {
    id: 'copy-block',
    title: 'Block Copy',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'Copy a block of bytes from one place in memory to another.',
    task: [
      'HL holds the source address, DE the destination address and BC the number of bytes.',
      'Copy BC bytes from the source to the destination.',
    ],
    explanation: 'Copying memory is one of the most common jobs a program does.',
    starterCode: '        ORG 0x8000\n\n        ; HL = source, DE = destination, BC = length\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'Block transfer instructions use HL, DE and BC as source, destination and count.' },
      { title: 'Hint 2', body: 'LDIR repeats until BC reaches zero.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'LDIR copies BC bytes from the address in HL to the address in DE, so all the work is one instruction.',
        code: `        ORG 0x8000
        LDIR            ; copy BC bytes from (HL) to (DE)
        HALT
`,
      },
    ],
    tests: [
      {
        name: 'copy 4 bytes',
        setup: { registers: { HL: 0x9000, DE: 0x9100, BC: 4 }, memory: { 0x9000: [1, 2, 3, 4] } },
        expect: { memory: { 0x9100: [1, 2, 3, 4] } },
      },
      {
        name: 'copy 10 bytes',
        setup: { registers: { HL: 0x9200, DE: 0x9300, BC: 10 }, memory: { 0x9200: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] } },
        expect: { memory: { 0x9300: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] } },
      },
    ],
  },
  {
    id: 'sum-array',
    title: 'Array Total',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'An array of bytes is stored in memory.',
    task: ['HL holds the address of the first element and B holds the number of elements (at least 1).', 'Leave the sum of all the elements in register A.', 'The total never exceeds 255.'],
    explanation: 'Arrays are just consecutive bytes in memory, and a program reaches them through addresses held in registers.',
    starterCode: '        ORG 0x8000\n\n        ; HL = array address, B = length\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'Start with A = 0.' },
      { title: 'Hint 2', body: 'ADD A,(HL) adds the byte at the address in HL to A.' },
      { title: 'Hint 3', body: 'Keep HL as a pointer that moves forward after each element, and use B as a counter that says when to stop (DJNZ helps).' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'A is the running total, HL walks the array and B counts the elements.',
        code: `        ORG 0x8000
        XOR A           ; A = 0, the running total
loop:   ADD A,(HL)      ; add the element at HL
        INC HL          ; next element
        DJNZ loop       ; repeat B times
        HALT
`,
      },
    ],
    tests: [
      { name: 'five numbers', setup: { registers: { HL: 0x9000, B: 5 }, memory: { 0x9000: [1, 2, 3, 4, 5] } }, expect: { registers: { A: 15 } } },
      { name: 'three numbers', setup: { registers: { HL: 0x9000, B: 3 }, memory: { 0x9000: [10, 20, 30] } }, expect: { registers: { A: 60 } } },
      { name: 'one number', setup: { registers: { HL: 0x9000, B: 1 }, memory: { 0x9000: [99] } }, expect: { registers: { A: 99 } } },
    ],
  },
  {
    id: 'largest-in-array',
    title: 'King of the Array',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'An array of unsigned bytes is stored in memory.',
    task: ['HL holds the address of the first element and B holds the number of elements (at least 1).', 'Leave the largest element in register A.'],
    explanation: 'Searching an array for an extreme value combines a loop over memory with a comparison on every element.',
    starterCode: '        ORG 0x8000\n\n        ; HL = array address, B = length\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'Remember the best value seen so far, starting with the first element, and replace it whenever something bigger turns up.' },
      { title: 'Hint 2', body: 'CP (HL) compares A with the byte at HL.' },
      { title: 'Hint 3', body: 'After CP, the Carry flag tells you whether A was smaller.' },
      { title: 'Hint 4', body: 'In outline: load the first element into A as the best so far, then loop over the remaining B-1 elements. Compare each with A and replace A when the element is bigger. Allow for an array of just one element.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'A holds the best value so far. CP (HL) sets Carry when A < the element, so a replacement is needed only when the jump is not taken.',
        code: `        ORG 0x8000
        LD A,(HL)       ; best so far = first element
        INC HL
        DEC B           ; elements left to look at
        JR Z,done       ; only one element
loop:   CP (HL)         ; Carry set if A < element
        JR NC,skip      ; A >= element: keep A
        LD A,(HL)       ; new best
skip:   INC HL
        DJNZ loop
done:   HALT
`,
      },
    ],
    tests: [
      { name: 'mixed values', setup: { registers: { HL: 0x9000, B: 4 }, memory: { 0x9000: [3, 9, 2, 7] } }, expect: { registers: { A: 9 } } },
      { name: 'single value', setup: { registers: { HL: 0x9000, B: 1 }, memory: { 0x9000: [5] } }, expect: { registers: { A: 5 } } },
      { name: 'large value', setup: { registers: { HL: 0x9000, B: 3 }, memory: { 0x9000: [1, 200, 3] } }, expect: { registers: { A: 200 } } },
      { name: 'largest last', setup: { registers: { HL: 0x9000, B: 3 }, memory: { 0x9000: [1, 2, 250] } }, expect: { registers: { A: 250 } } },
    ],
  },
  {
    id: 'count-zeros',
    title: 'Zero Hunt',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'An array of bytes is stored in memory. Some elements are zero.',
    task: ['HL holds the address of the first element and B holds the number of elements (at least 1).', 'Leave the number of elements equal to zero in register C.'],
    explanation: 'Counting items that match a condition is a common task once data lives in memory.',
    starterCode: '        ORG 0x8000\n\n        ; HL = array address, B = length\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'Zero is the only value for which OR A leaves the Z flag set.' },
      { title: 'Hint 2', body: 'Load each element into A, then test it. Only increase your counter when the test succeeds, so jump over the INC otherwise.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'C counts zeros. OR A sets Z only when the element is 0, otherwise the INC C is jumped over.',
        code: `        ORG 0x8000
        LD C,0          ; count of zeros
loop:   LD A,(HL)
        OR A            ; Z is set if the element is 0
        JR NZ,skip
        INC C           ; found a zero
skip:   INC HL
        DJNZ loop
        HALT
`,
      },
    ],
    tests: [
      { name: 'three zeros', setup: { registers: { HL: 0x9000, B: 5 }, memory: { 0x9000: [0, 1, 0, 2, 0] } }, expect: { registers: { C: 3 } } },
      { name: 'no zeros', setup: { registers: { HL: 0x9000, B: 3 }, memory: { 0x9000: [1, 2, 3] } }, expect: { registers: { C: 0 } } },
      { name: 'all zeros', setup: { registers: { HL: 0x9000, B: 2 }, memory: { 0x9000: [0, 0] } }, expect: { registers: { C: 2 } } },
    ],
  },
  {
    id: 'string-length',
    title: 'How Long Is a String?',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'A string is stored in memory, ending with a zero byte.',
    task: ['HL holds the address of the first character.', 'Leave the length of the string (not counting the zero byte) in register B.'],
    explanation: 'Strings in memory have no stored length, so a program has to discover it for itself.',
    starterCode: '        ORG 0x8000\n\n        ; HL = string address, terminated by a 0 byte\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'Step along the string one byte at a time until you find the terminator.' },
      { title: 'Hint 2', body: 'Count the steps in B.' },
      { title: 'Hint 3', body: 'In outline: set B to 0. Then loop: read the byte at HL, stop if it is 0, otherwise add 1 to B and move HL on.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'B counts characters until the 0 terminator is found.',
        code: `        ORG 0x8000
        LD B,0          ; length so far
loop:   LD A,(HL)
        OR A            ; reached the 0 terminator?
        JR Z,done
        INC B
        INC HL
        JR loop
done:   HALT
`,
      },
    ],
    tests: [
      { name: 'Hello', setup: { registers: { HL: 0x9000 }, memory: { 0x9000: [...bytesOf('Hello'), 0] } }, expect: { registers: { B: 5 } } },
      { name: 'empty', setup: { registers: { HL: 0x9000 }, memory: { 0x9000: [0] } }, expect: { registers: { B: 0 } } },
      { name: 'Z80 Trainer', setup: { registers: { HL: 0x9000 }, memory: { 0x9000: [...bytesOf('Z80 Trainer'), 0] } }, expect: { registers: { B: 11 } } },
    ],
  },
  {
    id: 'subroutine',
    title: 'Call Me Maybe',
    difficulty: 'intermediate',
    category: 'subroutines',
    description: 'Subroutines are the Z80\'s functions: reusable pieces of code that you call and that return when finished.',
    task: [
      'Write a subroutine called double that doubles the value in register A.',
      'Your main program must use it three times on register A, so that A ends up eight times larger than it started.',
      'A is at most 31.',
    ],
    explanation: 'A subroutine is code you can run from several places and then return from. The processor keeps track of where it came from using the stack.',
    requires: { call: { label: 'double', min: 3 } },
    starterCode: '        ORG 0x8000\n\n        ; main program\n\n        HALT\n\n        ; subroutines go after HALT\n',
    hints: [
      { title: 'Hint 1', body: 'Put the subroutine after HALT so the main program does not run into it.' },
      { title: 'Hint 2', body: 'Doubling is the same as adding a number to itself.' },
      { title: 'Hint 3', body: 'CALL label runs a subroutine. End the subroutine with RET, which returns to the instruction after the CALL.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'The subroutine lives after HALT and ends with RET. The main program CALLs it three times.',
        code: `        ORG 0x8000
        CALL double
        CALL double
        CALL double
        HALT

double: ADD A,A         ; A = A * 2
        RET
`,
      },
    ],
    tests: [
      { name: 'A = 1', setup: { registers: { A: 1 } }, expect: { registers: { A: 8 } } },
      { name: 'A = 3', setup: { registers: { A: 3 } }, expect: { registers: { A: 24 } } },
      { name: 'A = 31', setup: { registers: { A: 31 } }, expect: { registers: { A: 248 } } },
    ],
  },
  {
    id: 'swap-registers',
    title: 'Switcheroo',
    difficulty: 'beginner',
    category: 'basics',
    description: 'Registers B and C hold different values.',
    task: ['Swap the values of B and C.', 'You may use A as scratch space.'],
    explanation: 'Overwriting a register destroys what it held, so the order of your copies matters.',
    starterCode: '        ORG 0x8000\n\n        ; B and C contain values\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'If you copy B over C straight away, the old value of C is lost.' },
      { title: 'Hint 2', body: 'Park one value in A first. Swapping needs a third place to hold one value temporarily, like swapping two glasses of water.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'A is used as a temporary place to hold one value while the other is moved.',
        code: `        ORG 0x8000
        LD A,B          ; park B
        LD B,C          ; B = old C
        LD C,A          ; C = old B
        HALT
`,
      },
    ],
    tests: [
      { name: '1 and 2', setup: { registers: { B: 1, C: 2 } }, expect: { registers: { B: 2, C: 1 } } },
      { name: '255 and 0', setup: { registers: { B: 255, C: 0 } }, expect: { registers: { B: 0, C: 255 } } },
    ],
  },
  {
    id: 'reverse-string',
    title: 'Mirror, Mirror',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'A row of bytes is stored in memory. Turn it back to front.',
    task: [
      'HL holds the address of the first byte and B holds the number of bytes (at least 1).',
      'Reverse the order of those bytes in memory.',
      'Do not touch any byte outside them.',
    ],
    explanation: 'Memory can be read and written in any order, and two addresses can be tracked at once.',
    starterCode: '        ORG 0x8000\n\n        ; HL = address of the bytes, B = how many\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'Work from both ends towards the middle, swapping the byte at the front with the byte at the back.' },
      { title: 'Hint 2', body: 'Keep one pointer in DE and one in HL. ADD HL,BC moves HL forward by BC bytes, so the last byte is at start + length - 1.' },
      { title: 'Hint 3', body: 'Stop when the two pointers meet or cross. Compare the high bytes first, then the low bytes, with CP.' },
      { title: 'Hint 4', body: 'LD A,(DE) and LD C,(HL) read the two bytes, and LD (HL),A and LD (DE),A write them back. Only A can be used for the (DE) forms.' },
      { title: 'Hint 5', body: 'In outline: set DE to the start and HL to the last byte. Repeat: if HL is no longer above DE, stop; otherwise swap the two bytes, move DE up and HL down.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'DE and HL are the two ends. The loop stops when HL meets or passes DE, so the middle byte of an odd-length string stays put.',
        code: `        ORG 0x8000
        LD D,H
        LD E,L          ; DE = start of the string
        LD C,B
        LD B,0          ; BC = length
        ADD HL,BC
        DEC HL          ; HL = address of the last byte
loop:   LD A,H          ; compare HL with DE, high bytes first
        CP D
        JR C,done       ; HL < DE: the pointers have crossed
        JR NZ,swap      ; HL > DE: keep going
        LD A,L
        CP E
        JR C,done
        JR Z,done       ; HL = DE: the middle byte
swap:   LD A,(DE)
        LD C,(HL)
        LD (HL),A       ; front byte goes to the back
        LD A,C
        LD (DE),A       ; back byte goes to the front
        INC DE
        DEC HL
        JR loop
done:   HALT
`,
      },
    ],
    tests: [
      {
        name: 'five bytes',
        setup: { registers: { HL: 0x9000, B: 5 }, memory: { 0x9000: [...bytesOf('Hello'), 0xee] } },
        expect: { memory: { 0x9000: [...bytesOf('olleH'), 0xee] } },
      },
      {
        name: 'four bytes',
        setup: { registers: { HL: 0x9100, B: 4 }, memory: { 0x9100: [1, 2, 3, 4] } },
        expect: { memory: { 0x9100: [4, 3, 2, 1] } },
      },
      {
        name: 'one byte',
        setup: { registers: { HL: 0x9200, B: 1 }, memory: { 0x9200: [7, 0xee] } },
        expect: { memory: { 0x9200: [7, 0xee] } },
      },
      {
        name: 'across a page boundary',
        setup: { registers: { HL: 0x90fe, B: 4 }, memory: { 0x90fe: [10, 20, 30, 40] } },
        expect: { memory: { 0x90fe: [40, 30, 20, 10] } },
      },
    ],
  },
  {
    id: 'stack-swap',
    title: 'Stack Shuffle',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'Register pairs BC and DE each hold a 16-bit value.',
    task: [
      'Swap the contents of BC and DE.',
      'Registers A, H and L must end with the values they started with.',
    ],
    explanation: 'Every register can be overwritten, so a program sometimes needs somewhere else to keep values safe.',
    starterCode: '        ORG 0x8000\n\n        ; BC and DE hold 16-bit values\n\n        HALT\n',
    hints: [
      { title: 'Hint 1', body: 'The stack is a block of memory that PUSH and POP use to save and restore register pairs.' },
      { title: 'Hint 2', body: 'The last pair pushed is the first pair popped. PUSH BC then POP DE moves a value between pairs.' },
      { title: 'Hint 3', body: 'Push both pairs, then pop them back in the opposite order.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'Pushing BC then DE and popping them into BC then DE reverses the order, which swaps the pairs.',
        code: `        ORG 0x8000
        PUSH BC
        PUSH DE
        POP BC          ; BC gets the old DE
        POP DE          ; DE gets the old BC
        HALT
`,
      },
    ],
    tests: [
      {
        name: 'distinct values',
        setup: { registers: { BC: 0x1234, DE: 0xabcd, A: 9, HL: 0x5566 } },
        expect: { registers: { BC: 0xabcd, DE: 0x1234, A: 9, HL: 0x5566 } },
      },
      {
        name: 'one is zero',
        setup: { registers: { BC: 0, DE: 0xffff, A: 1, HL: 0x0102 } },
        expect: { registers: { BC: 0xffff, DE: 0, A: 1, HL: 0x0102 } },
      },
    ],
  },
]

export default challenges
