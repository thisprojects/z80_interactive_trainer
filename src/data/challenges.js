// All trainer challenges. To add one, append an object that follows the schema
// documented in challengeSchema.js. Every challenge needs a reference solution in
// solutions.js (tests only, keyed by challenge id); the unit tests run it, so a
// new challenge is proven solvable.
//
// Output uses two real ZX Spectrum ROM routines: RST 0x10 prints the character in A (13 = newline) and
// CALL 0x2D2B then CALL 0x2DE3 print BC as a decimal number.

const bytesOf = (s) => [...s].map((ch) => ch.charCodeAt(0))
const lines = (items) => items.join('\n')
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i)
const fizzbuzz = (n) =>
  lines(range(1, n).map((i) => (i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i))))

const challenges = [
  {
    id: 'countdown',
    title: 'Liftoff',
    difficulty: 'intermediate',
    category: 'loops',
    description: 'Count backwards and finish with a message.',
    task: ['Print the numbers 10 down to 1, one per line.', 'Then print the word Liftoff! on its own line.'],
    explanation: 'Counting down is just as common as counting up, and loops often finish when a counter reaches zero.',
    starterCode: '        ORG 0x8000\n        LD A,2\n        CALL 0x1601     ; open the main screen channel\n\n        ; RST 0x10 prints the character in A (13 = newline)\n        ; number: LD BC,n / CALL 0x2D2B / CALL 0x2DE3\n\n        HALT\n',
    uses: ['djnz', 'strings', 'print-number', 'newlines', 'stack'],
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
        PUSH BC
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3
        POP BC     ; print the number
        LD A,13
        RST 0x10        ; print a newline
        DJNZ loop       ; B = B - 1, repeat while B != 0
        LD HL,msg
next:   LD A,(HL)
        OR A            ; reached the 0 terminator?
        JR Z,done
        RST 0x10
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
    uses: ['djnz', 'accumulate'],
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
    uses: ['djnz', 'accumulate', 'guard-loops'],
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
    uses: ['if-else'],
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
    uses: ['testing-bits', 'if-else'],
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
    uses: ['testing-bits', 'wraparound'],
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
    starterCode: '        ORG 0x8000\n        LD A,2\n        CALL 0x1601     ; open the main screen channel\n\n        ; H = N\n        ; RST 0x10 prints the character in A (13 = newline)\n        ; number: LD BC,n / CALL 0x2D2B / CALL 0x2DE3\n\n        HALT\n',
    uses: ['djnz', 'if-equal', 'subroutine', 'strings', 'newlines', 'preserving'],
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
        PUSH BC
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3
        POP BC     ; no: print the number
eol:    LD A,13
        RST 0x10        ; newline
        LD A,(limit)
        CP B            ; finished?
        JR Z,finish
        INC B
        JR loop
finish: HALT

puts:   LD A,(HL)       ; print a 0-terminated string at HL
        OR A
        RET Z
        RST 0x10
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
    uses: ['pointers', 'array-loop'],
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
    id: 'sum-array',
    title: 'Array Total',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'An array of bytes is stored in memory.',
    task: ['HL holds the address of the first element and B holds the number of elements (at least 1).', 'Leave the sum of all the elements in register A.', 'The total never exceeds 255.'],
    explanation: 'Arrays are just consecutive bytes in memory, and a program reaches them through addresses held in registers.',
    starterCode: '        ORG 0x8000\n\n        ; HL = array address, B = length\n\n        HALT\n',
    uses: ['array-loop', 'accumulate'],
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
    uses: ['array-loop', 'if-else'],
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
    uses: ['array-loop', 'if-equal'],
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
    uses: ['strings', 'pointers'],
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
    id: 'swap-registers',
    title: 'Switcheroo',
    difficulty: 'beginner',
    category: 'basics',
    description: 'Registers B and C hold different values.',
    task: ['Swap the values of B and C.', 'You may use A as scratch space.'],
    explanation: 'Overwriting a register destroys what it held, so the order of your copies matters.',
    starterCode: '        ORG 0x8000\n\n        ; B and C contain values\n\n        HALT\n',
    uses: ['copying-registers'],
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
    uses: ['array-loop', 'strings', 'sixteen-bit', 'pointers'],
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
    id: 'gcd',
    title: 'Greatest Common Divisor',
    difficulty: 'intermediate',
    category: 'loops',
    description: 'Two numbers can often be divided by a larger number without a remainder. Find the largest one that works for both.',
    task: ['A and B each hold a number from 1 to 255.', 'Leave the greatest common divisor of A and B in register A.'],
    explanation: 'The greatest common divisor of 12 and 18 is 6. There is no divide or remainder instruction on the Z80, so the method has to be built from the operations you do have.',
    starterCode: '        ORG 0x8000\n\n        ; A and B contain numbers from 1 to 255\n\n        HALT\n',
    uses: ['loop-counter', 'while-loops', 'if-else'],
    hints: [
      { title: 'Hint 1', body: 'Euclid\'s idea: if two numbers are equal, that is the answer. Otherwise the bigger one can be replaced by the difference of the two without changing the answer.' },
      { title: 'Hint 2', body: 'Loop: compare A with B. Equal means finished. If A is bigger, subtract B from A; otherwise subtract A from B.' },
      { title: 'Hint 3', body: 'Swapping is not needed: keep A and B in place and subtract into whichever is bigger. Use C to hold A while you work out B - A.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'Keep subtracting the smaller from the larger until they are equal.',
        code: `        ORG 0x8000
loop:   CP B            ; compare A with B
        JR Z,done       ; equal: that is the answer
        JR C,less       ; A < B
        SUB B           ; A > B: A = A - B
        JR loop
less:   LD C,A          ; remember A
        LD A,B
        SUB C           ; B - A
        LD B,A          ; B = B - A
        LD A,C          ; restore A
        JR loop
done:   HALT
`,
      },
    ],
    tests: [
      { name: '12 and 18', setup: { registers: { A: 12, B: 18 } }, expect: { registers: { A: 6 } } },
      { name: 'coprime 7 and 13', setup: { registers: { A: 7, B: 13 } }, expect: { registers: { A: 1 } } },
      { name: '100 and 75', setup: { registers: { A: 100, B: 75 } }, expect: { registers: { A: 25 } } },
      { name: 'equal', setup: { registers: { A: 9, B: 9 } }, expect: { registers: { A: 9 } } },
      { name: '1 and 200', setup: { registers: { A: 1, B: 200 } }, expect: { registers: { A: 1 } } },
      { name: '255 and 255', setup: { registers: { A: 255, B: 255 } }, expect: { registers: { A: 255 } } },
    ],
  },
  {
    id: 'big-multiply',
    title: 'Big Multiply',
    difficulty: 'advanced',
    category: 'arithmetic',
    description: 'Multiplying two bytes can give an answer that needs sixteen bits.',
    task: ['B and C each hold a number from 0 to 255.', 'Leave B multiplied by C in the 16-bit register HL.'],
    explanation: 'The largest answer is 255 * 255 = 65025, which does not fit in a byte. The Z80 has no multiply instruction.',
    starterCode: '        ORG 0x8000\n\n        ; B and C contain numbers from 0 to 255\n\n        HALT\n',
    uses: ['sixteen-bit', 'djnz', 'guard-loops'],
    hints: [
      { title: 'Hint 1', body: 'Multiplication is repeated addition. Add C to a running 16-bit total, B times.' },
      { title: 'Hint 2', body: 'The running total must be 16 bits, so it lives in HL and C has to be widened into DE (with D = 0).' },
      { title: 'Hint 3', body: 'DJNZ with B = 0 would run 256 times. Check for zero before the loop. (A faster way adds shifted copies, but plain repetition passes the tests.)' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'A 16-bit total in HL, B additions of C.',
        code: `        ORG 0x8000
        LD HL,0         ; running total
        LD D,0
        LD E,C          ; DE = C as a 16-bit number
        INC B
        DEC B           ; is B zero?
        JR Z,done       ; 0 * anything = 0
loop:   ADD HL,DE       ; add C once
        DJNZ loop       ; ...B times
done:   HALT
`,
      },
    ],
    tests: [
      { name: '3 * 4', setup: { registers: { B: 3, C: 4 } }, expect: { registers: { HL: 12 } } },
      { name: '200 * 200', setup: { registers: { B: 200, C: 200 } }, expect: { registers: { HL: 40000 } } },
      { name: '255 * 255', setup: { registers: { B: 255, C: 255 } }, expect: { registers: { HL: 65025 } } },
      { name: 'zero multiplier', setup: { registers: { B: 0, C: 77 } }, expect: { registers: { HL: 0 } } },
      { name: 'zero multiplicand', setup: { registers: { B: 9, C: 0 } }, expect: { registers: { HL: 0 } } },
      { name: '1 * 255', setup: { registers: { B: 1, C: 255 } }, expect: { registers: { HL: 255 } } },
    ],
  },
  {
    id: 'popcount',
    title: 'Count the Ones',
    difficulty: 'intermediate',
    category: 'loops',
    description: 'Every byte is eight bits, each either 0 or 1. How many are 1?',
    task: ['Register A holds a byte.', 'Put the number of bits in A that are 1 into register B.'],
    explanation: 'This "population count" is used in parity checks and bitmaps.',
    starterCode: '        ORG 0x8000\n\n        ; A contains a byte\n\n        HALT\n',
    uses: ['doubling-halving', 'if-else', 'loop-counter'],
    hints: [
      { title: 'Hint 1', body: 'Look at each of the eight bits in turn. A shift moves a bit out of the register into the carry flag.' },
      { title: 'Hint 2', body: 'SRL A shifts right and leaves the old bit 0 in carry. JR NC skips the count when the bit was 0.' },
      { title: 'Hint 3', body: 'You need an eight-times loop. DJNZ owns B, but B is also your answer, so count the loop in C instead.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'Shift out each bit, and count those that land in carry.',
        code: `        ORG 0x8000
        LD B,0          ; number of ones
        LD C,8          ; bits to examine
loop:   SRL A           ; bit 0 goes into carry
        JR NC,skip      ; it was 0
        INC B           ; it was 1
skip:   DEC C
        JR NZ,loop
        HALT
`,
      },
    ],
    tests: [
      { name: '0', setup: { registers: { A: 0 } }, expect: { registers: { B: 0 } } },
      { name: '255', setup: { registers: { A: 255 } }, expect: { registers: { B: 8 } } },
      { name: '0xA5', setup: { registers: { A: 165 } }, expect: { registers: { B: 4 } } },
      { name: '0x80', setup: { registers: { A: 128 } }, expect: { registers: { B: 1 } } },
      { name: '0x7F', setup: { registers: { A: 127 } }, expect: { registers: { B: 7 } } },
      { name: '1', setup: { registers: { A: 1 } }, expect: { registers: { B: 1 } } },
    ],
  },
  {
    id: 'string-compare',
    title: 'Same Text?',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'Two pieces of text are the same only if every character matches and they end together.',
    task: ['Create two zero-terminated strings called first and second, each holding the text stone.', 'Put 1 in register B if the two strings are identical, otherwise 0.'],
    explanation: 'Strings in memory end with a zero byte. Equal strings have the same characters and the same length.',
    starterCode: '        ORG 0x8000\n\n        ; define first and second (each ends with 0) after HALT\n\n        HALT\n',
    uses: ['strings', 'pointers', 'if-equal'],
    hints: [
      { title: 'Hint 1', body: 'Walk along both strings at once, comparing one character at a time.' },
      { title: 'Hint 2', body: 'If a pair of characters differs, the strings are different. If they match and are both the terminating 0, they are the same.' },
      { title: 'Hint 3', body: 'CP (HL) compares A with the byte HL points at. Load the character from (DE) into A first.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'Compare character pairs until a difference or the terminator.',
        code: `        ORG 0x8000
        LD HL,first
        LD DE,second
        LD B,0          ; assume different
loop:   LD A,(DE)       ; character from the second string
        CP (HL)         ; same as the first?
        JR NZ,done      ; no: different
        OR A            ; both the 0 terminator?
        JR Z,same
        INC HL
        INC DE
        JR loop
same:   LD B,1
done:   HALT
first:  DB "stone",0
second: DB "stone",0
`,
      },
    ],
    tests: [
      { name: 'stone, stone', expect: { registers: { B: 1 } } },
      { name: 'stone, stove', setup: { memory: { second: [115, 116, 111, 118, 101, 0] } }, expect: { registers: { B: 0 } } },
      { name: 'stone, ston', setup: { memory: { second: [115, 116, 111, 110, 0] } }, expect: { registers: { B: 0 } } },
      { name: 'ston, stone', setup: { memory: { first: [115, 116, 111, 110, 0] } }, expect: { registers: { B: 0 } } },
      { name: 'both empty', setup: { memory: { first: [0], second: [0] } }, expect: { registers: { B: 1 } } },
    ],
  },
  {
    id: 'bubble-sort',
    title: 'Sort It Out',
    difficulty: 'advanced',
    category: 'memory',
    description: 'Put a list of numbers in order, smallest first.',
    task: ['HL points at an array of bytes and B holds how many there are (at least 2).', 'Sort the array in place so it is in ascending order.'],
    explanation: 'Sorting is a classic exercise, needed wherever data has to be put in order.',
    starterCode: '        ORG 0x8000\n\n        ; HL = start of the array, B = number of elements (>= 2)\n\n        HALT\n',
    uses: ['array-loop', 'if-else', 'nested-loops', 'stack'],
    hints: [
      { title: 'Hint 1', body: 'Compare each element with the one after it, and swap them if the first is larger. One sweep carries the biggest value to the end.' },
      { title: 'Hint 2', body: 'Repeat the sweep, each time over one fewer element, until only one is left. That is an outer loop around an inner loop.' },
      { title: 'Hint 3', body: 'Keep the outer count in C and the inner count in B. PUSH HL before a sweep and POP it afterwards to go back to the start.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'Bubble sort: n - 1 sweeps, each swapping out-of-order neighbours.',
        code: `        ORG 0x8000
        LD C,B
        DEC C           ; C = number of sweeps
outer:  PUSH HL         ; remember the start
        LD B,C          ; comparisons in this sweep
inner:  LD A,(HL)       ; element
        INC HL
        CP (HL)         ; compare with its neighbour
        JR C,ok         ; already in order
        JR Z,ok
        LD D,(HL)       ; swap the pair
        LD (HL),A
        DEC HL
        LD (HL),D
        INC HL
ok:     DJNZ inner
        POP HL          ; back to the start
        DEC C
        JR NZ,outer
        HALT
`,
      },
    ],
    tests: [
      { name: 'mixed six', setup: { registers: { HL: 36864, B: 6 }, memory: { '36864': [5, 3, 8, 1, 9, 2] } }, expect: { memory: { '36864': [1, 2, 3, 5, 8, 9] } } },
      { name: 'already sorted', setup: { registers: { HL: 37120, B: 3 }, memory: { '37120': [1, 2, 3] } }, expect: { memory: { '37120': [1, 2, 3] } } },
      { name: 'reversed', setup: { registers: { HL: 37376, B: 4 }, memory: { '37376': [9, 7, 4, 1] } }, expect: { memory: { '37376': [1, 4, 7, 9] } } },
      { name: 'duplicates and a neighbour', setup: { registers: { HL: 37632, B: 4 }, memory: { '37632': [7, 7, 0, 7, 55] } }, expect: { memory: { '37632': [0, 7, 7, 7, 55] } } },
      { name: 'two items', setup: { registers: { HL: 37888, B: 2 }, memory: { '37888': [2, 1] } }, expect: { memory: { '37888': [1, 2] } } },
    ],
  },
  {
    id: 'fibonacci',
    title: 'Rabbit Numbers',
    difficulty: 'intermediate',
    category: 'loops',
    description: 'Each number in the Fibonacci sequence is the sum of the two before it.',
    task: ['Print the first ten Fibonacci numbers, starting 1 1 2 3 5 and so on.', 'Separate them with single spaces, all on one line.'],
    explanation: 'The sequence goes 1, 1, 2, 3, 5, 8 ...',
    starterCode: '        ORG 0x8000\n        LD A,2\n        CALL 0x1601     ; open the main screen channel\n\n        ; RST 0x10 prints the character in A (13 = newline)\n        ; number: LD BC,n / CALL 0x2D2B / CALL 0x2DE3\n\n        HALT\n',
    uses: ['djnz', 'accumulate', 'print-number', 'print-char', 'stack'],
    hints: [
      { title: 'Hint 1', body: 'Keep the previous number in one register and the current one in another.' },
      { title: 'Hint 2', body: 'To step along: the new number is current + previous, the new previous is the old current.' },
      { title: 'Hint 3', body: 'Print the current number and a space on each pass of a ten-times loop. A trailing space is ignored.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'Two registers hold the last two values.',
        code: `        ORG 0x8000
        LD B,10         ; ten numbers
        LD D,0          ; previous
        LD E,1          ; current
loop:   LD A,E
        PUSH BC
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3
        POP BC     ; print the current number
        LD A,' '
        RST 0x10
        LD A,E
        ADD A,D         ; next = current + previous
        LD D,E          ; previous = current
        LD E,A          ; current = next
        DJNZ loop
        HALT
`,
      },
    ],
    tests: [
      { name: 'first ten', setup: {  }, expect: { output: '1 1 2 3 5 8 13 21 34 55' } },
    ],
  },
  {
    id: 'prime-check',
    title: 'Is It Prime?',
    difficulty: 'advanced',
    category: 'conditionals',
    description: 'A prime number has no divisors except one and itself.',
    task: ['Register A holds a number from 2 to 100.', 'Put 1 in register B if it is prime, otherwise 0.'],
    explanation: '2, 3, 5, 7, 11 are prime; 4, 9 and 91 (7 x 13) are not. The Z80 has no divide or remainder instruction.',
    starterCode: '        ORG 0x8000\n\n        ; A contains a number from 2 to 100\n\n        HALT\n',
    uses: ['while-loops', 'nested-loops', 'if-equal', 'if-else'],
    hints: [
      { title: 'Hint 1', body: 'Try each possible divisor d from 2 upwards. If d reaches the number itself without dividing it, the number is prime.' },
      { title: 'Hint 2', body: 'To test whether d divides n, keep taking d away from a copy of n while it is at least d, and look at what is left. A remainder of zero means d divides n.' },
      { title: 'Hint 3', body: 'You need three things at once: n in C, d in D, and the working copy in A. B is the answer.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'Trial division using repeated subtraction as the remainder.',
        code: `        ORG 0x8000
        LD B,1          ; assume prime
        LD C,A          ; n
        LD D,2          ; first divisor to try
try:    LD A,D
        CP C            ; reached n itself?
        JR Z,done       ; no divisor found: prime
        LD A,C          ; working copy of n
rem:    CP D
        JR C,remdone    ; copy < d: A is the remainder
        SUB D
        JR rem
remdone: OR A           ; remainder zero?
        JR Z,composite
        INC D           ; try the next divisor
        JR try
composite: LD B,0
done:   HALT
`,
      },
    ],
    tests: [
      { name: '2', setup: { registers: { A: 2 } }, expect: { registers: { B: 1 } } },
      { name: '3', setup: { registers: { A: 3 } }, expect: { registers: { B: 1 } } },
      { name: '4', setup: { registers: { A: 4 } }, expect: { registers: { B: 0 } } },
      { name: '17', setup: { registers: { A: 17 } }, expect: { registers: { B: 1 } } },
      { name: '25', setup: { registers: { A: 25 } }, expect: { registers: { B: 0 } } },
      { name: '91 = 7 x 13', setup: { registers: { A: 91 } }, expect: { registers: { B: 0 } } },
      { name: '97', setup: { registers: { A: 97 } }, expect: { registers: { B: 1 } } },
      { name: '100', setup: { registers: { A: 100 } }, expect: { registers: { B: 0 } } },
    ],
  },
  {
    id: 'bcd-total',
    title: 'Decimal Total',
    difficulty: 'intermediate',
    category: 'arithmetic',
    description: 'A till adds up prices stored with one decimal digit per half-byte.',
    task: ['HL points at an array of two-digit decimal (BCD) numbers and B holds how many there are (at least 1).', 'Add them up as decimal numbers, leaving the BCD total in A. The total is at most 99.'],
    explanation: 'In BCD the byte 0x47 means forty-seven. Plain binary addition of such bytes gives the wrong digits.',
    starterCode: '        ORG 0x8000\n\n        ; HL = array of BCD numbers, B = how many\n\n        HALT\n',
    uses: ['bcd', 'array-loop', 'accumulate'],
    hints: [
      { title: 'Hint 1', body: 'Start the total at zero and add the elements one at a time, like any array sum.' },
      { title: 'Hint 2', body: 'After each ADD, the total must be repaired before you add the next number.' },
      { title: 'Hint 3', body: 'The repair instruction is DAA, straight after the ADD.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'A running BCD sum: ADD then DAA, element by element.',
        code: `        ORG 0x8000
        XOR A           ; total = 0
loop:   ADD A,(HL)      ; add the next number
        DAA             ; repair it as decimal
        INC HL
        DJNZ loop
        HALT
`,
      },
    ],
    tests: [
      { name: '12 + 34 + 25', setup: { registers: { HL: 36864, B: 3 }, memory: { '36864': [18, 52, 37] } }, expect: { registers: { A: 113 } } },
      { name: '9 + 9 + 9', setup: { registers: { HL: 37120, B: 3 }, memory: { '37120': [9, 9, 9] } }, expect: { registers: { A: 39 } } },
      { name: 'one number', setup: { registers: { HL: 37376, B: 1 }, memory: { '37376': [153] } }, expect: { registers: { A: 153 } } },
      { name: '45 + 54', setup: { registers: { HL: 37632, B: 2 }, memory: { '37632': [69, 84] } }, expect: { registers: { A: 153 } } },
    ],
  },
  {
    id: 'record-total',
    title: 'Stock Take',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'A shop stores each item as three bytes: an id, a quantity and a price.',
    task: ['A shop has three stock records, each three bytes: an id, a quantity and a price. Create them in a block called stock: (1, 5, 100), (2, 7, 50) and (3, 0, 10).', 'Put the sum of all the quantities (the second byte of each record) into register A. The total fits in a byte.'],
    explanation: 'Records follow each other in memory, one after another.',
    starterCode: '        ORG 0x8000\n\n        ; define the block stock (id, quantity, price) after HALT\n\n        HALT\n',
    uses: ['index-registers', 'ix-stepping', 'array-loop', 'records'],
    hints: [
      { title: 'Hint 1', body: 'The quantity is the field at offset 1 of each record.' },
      { title: 'Hint 2', body: 'LD A,(IX+1) style addressing reads a field without moving IX. ADD A,(IX+1) adds it straight into the total.' },
      { title: 'Hint 3', body: 'ADD IX,DE moves IX on by the record size once DE holds 3.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'Add field (IX+1), then step IX on by three.',
        code: `        ORG 0x8000
        LD IX,stock     ; first record
        LD B,3          ; three records
        XOR A           ; total = 0
        LD DE,3         ; size of a record
loop:   ADD A,(IX+1)    ; add this record's quantity
        ADD IX,DE       ; on to the next record
        DJNZ loop
        HALT
stock:  DB 1,5,100
        DB 2,7,50
        DB 3,0,10
`,
      },
    ],
    tests: [
      { name: 'the shop stock', expect: { registers: { A: 12 } } },
      { name: 'one of each', setup: { memory: { stock: [1, 1, 9, 2, 1, 9, 3, 1, 9] } }, expect: { registers: { A: 3 } } },
      { name: 'empty shelves', setup: { memory: { stock: [1, 0, 9, 2, 0, 9, 3, 0, 9] } }, expect: { registers: { A: 0 } } },
      { name: 'total of 255', setup: { memory: { stock: [1, 100, 0, 2, 100, 0, 3, 55, 0] } }, expect: { registers: { A: 255 } } },
    ],
  },
  {
    id: 'insert-gap',
    title: 'Make Some Room',
    difficulty: 'intermediate',
    category: 'memory',
    description: 'Sometimes you need to open a gap at the start of a block of data.',
    task: ['HL points at the start of a block and BC holds its length in bytes (at least 1). The byte just after the block is free to use.', 'Move every byte of the block up one address, and put a 0 in the first position.'],
    explanation: 'The old and new positions of the data overlap.',
    starterCode: '        ORG 0x8000\n\n        ; HL = start of the block, BC = its length\n\n        HALT\n',
    uses: ['block-copy', 'sixteen-bit', 'pointers'],
    hints: [
      { title: 'Hint 1', body: 'Copy from the end of the block towards the start so nothing is overwritten before it has moved.' },
      { title: 'Hint 2', body: 'LDDR copies backwards. HL must start at the last byte of the block and DE one byte beyond it.' },
      { title: 'Hint 3', body: 'After LDDR, HL points one byte below the block start. Step it forward once to write the 0.' },
      {
        title: 'Spoiler: full solution',
        spoiler: true,
        body: 'LDDR from the last byte, then write a zero at the front.',
        code: `        ORG 0x8000
        ADD HL,BC
        DEC HL          ; HL = last byte of the block
        LD D,H
        LD E,L
        INC DE          ; DE = one past it
        LDDR            ; copy backwards, BC bytes
        INC HL          ; HL = the block start again
        LD (HL),0
        HALT
`,
      },
    ],
    tests: [
      { name: 'four bytes', setup: { registers: { HL: 36864, BC: 4 }, memory: { '36864': [1, 2, 3, 4, 9] } }, expect: { memory: { '36864': [0, 1, 2, 3, 4] } } },
      { name: 'one byte', setup: { registers: { HL: 37120, BC: 1 }, memory: { '37120': [7, 255] } }, expect: { memory: { '37120': [0, 7] } } },
      { name: 'ten bytes', setup: { registers: { HL: 37376, BC: 10 }, memory: { '37376': [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 77] } }, expect: { memory: { '37376': [0, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] } } },
    ],
  },
]

export default challenges
