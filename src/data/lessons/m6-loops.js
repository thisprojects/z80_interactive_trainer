import { startWith, hints } from './helpers.js'

export default [
  {
    id: 'loop-counter',
    title: 'Loops with a counter',
    module: 'Loops',
    intro: 'Jump backwards to repeat code. A counter and a compare decide when to stop.',
    content: [
      { type: 'text', text: 'A loop is a conditional jump that goes backwards. Keep a counter in a register, do the work, change the counter, then compare it and jump back to the label if you are not finished.' },
      { type: 'compare', high: 'for i in range(5):\n    show("*")', z80: "        LD B,0\nloop:   LD A,'*'\n        OUT (0),A\n        INC B\n        LD A,B\n        CP 5\n        JR NZ,loop" },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD B,0          ; counter
loop:   LD A,'*'
        OUT (0),A       ; the body: print a star
        INC B
        LD A,B
        CP 5            ; done five?
        JR NZ,loop      ; no: go round again
        HALT`,
        prints: '*****',
      },
      { type: 'tip', text: 'Check your loop at both ends. This one runs the body for counter values 0 to 4, exactly 5 times. Starting at 1 or comparing with a different number would give a different count.' },
    ],
    task: ['Print the numbers 1 to 10, one per line.'],
    starterCode: startWith('port 1 = print a number, port 2 = newline'),
    hints: hints(
      ['Start a counter at 1. Print it, then print a newline, add 1, and decide whether to go round again.', 'You must stop after printing 10, so the loop must end when the counter reaches 11.'],
      'A counter from 1 to 10 with a compare against 11.',
      `        ORG 0x8000
        LD B,1          ; counter
loop:   LD A,B
        OUT (1),A       ; print the number
        OUT (2),A       ; then a newline
        INC B
        LD A,B
        CP 11           ; passed 10?
        JR NZ,loop
        HALT`,
    ),
    tests: [{ name: 'prints 1 to 10', expect: { output: '1\n2\n3\n4\n5\n6\n7\n8\n9\n10' } }],
  },
  {
    id: 'djnz',
    title: 'DJNZ: the built-in counter',
    module: 'Loops',
    intro: 'Counting a number of repeats is so common that the Z80 has one instruction for it.',
    content: [
      { type: 'text', text: '`DJNZ label` means "decrement B, and jump to the label if B is not zero". Load B with the number of repeats, put the body at the label, and finish with `DJNZ`. B counts down, so inside the loop it takes the values n, n-1, ... 1.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD B,5          ; repeat five times
loop:   LD A,'*'
        OUT (0),A       ; the body
        DJNZ loop       ; B = B - 1, repeat while B is not 0
        HALT`,
        caption: 'The same output as the previous loop, with no compare and no INC.',
        prints: '*****',
      },
      { type: 'text', text: '`DJNZ` is a relative jump, so the label must be close by.' },
      { type: 'tip', text: 'Beware B = 0 on entry. `DJNZ` subtracts first, so 0 becomes 255 and the loop runs 256 times. Make sure B is at least 1, or check for 0 first.' },
    ],
    task: ['Print twelve # characters on the first line.', 'Then print the numbers 3, 2, 1, one per line, using the counter B itself as the number to print.'],
    starterCode: startWith('port 0 = character, 1 = number, 2 = newline'),
    hints: hints(
      ['Two loops, one after the other. Each loads B with its own count.', 'In the second loop B takes the values 3, 2, 1, which is what you want to print. Copy it into A inside the loop.'],
      'One DJNZ loop for the hashes and one for the countdown.',
      `        ORG 0x8000
        LD B,12
hash:   LD A,'#'
        OUT (0),A
        DJNZ hash
        OUT (2),A       ; new line
        LD B,3
count:  LD A,B
        OUT (1),A       ; 3, 2, 1
        OUT (2),A
        DJNZ count
        HALT`,
    ),
    tests: [{ name: 'hashes then a countdown', expect: { output: '############\n3\n2\n1' } }],
  },
  {
    id: 'while-loops',
    title: 'While loops: test first',
    module: 'Loops',
    intro: 'Sometimes you do not know in advance how many times to repeat. Test at the top and stop when the test fails.',
    content: [
      { type: 'text', text: 'A `while` loop checks its condition before every pass, so the body may run zero times. Put the test at the top of the loop with a conditional jump out, and a plain `JR` back to the top at the bottom.' },
      { type: 'text', text: '`OR A` is the handy test for "is A zero?": it leaves A unchanged and sets the Zero flag if A is 0. Here is a loop that counts how many times a number can be halved before nothing is left:' },
      { type: 'compare', high: 'n = 20\ncount = 0\nwhile n != 0:\n    n = n // 2\n    count += 1', z80: 'while:  OR A\n        JR Z,done\n        SRL A\n        INC B\n        JR while\ndone:' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,20
        LD B,0          ; B counts the halvings
while:  OR A            ; is A zero?
        JR Z,done       ; yes: leave the loop
        SRL A           ; A = A / 2
        INC B
        JR while        ; test again
done:   LD A,B
        OUT (1),A       ; prints 5
        HALT`,
        prints: '5',
      },
    ],
    task: ['Divide A by 7 using repeated subtraction.', 'Put the whole-number answer (the quotient) in B and leave the remainder in A.'],
    starterCode: startWith('A contains a number to divide by 7'),
    hints: hints(
      ['There is no divide instruction. Keep taking 7 away while A is at least 7, and count how many times you did it.', 'Compare A with 7 at the top of the loop. CP 7 sets carry when A < 7, which is when you stop.'],
      'A while loop that subtracts 7 and counts.',
      `        ORG 0x8000
        LD B,0          ; quotient
loop:   CP 7
        JR C,done       ; A < 7: finished
        SUB 7
        INC B
        JR loop
done:   HALT`,
    ),
    tests: [
      { name: '50 / 7', setup: { registers: { A: 50 } }, expect: { registers: { A: 1, B: 7 } } },
      { name: '6 / 7', setup: { registers: { A: 6 } }, expect: { registers: { A: 6, B: 0 } } },
      { name: '7 / 7', setup: { registers: { A: 7 } }, expect: { registers: { A: 0, B: 1 } } },
      { name: '255 / 7', setup: { registers: { A: 255 } }, expect: { registers: { A: 3, B: 36 } } },
    ],
  },
  {
    id: 'accumulate',
    title: 'Building up a result in a loop',
    module: 'Loops',
    intro: 'Many loops exist to build one answer: a total, a product, a power.',
    content: [
      { type: 'text', text: 'Start a variable at its identity value (0 for a total, 1 for a product), then change it once on each pass. Powers are repeated multiplication, and doubling is a single `ADD A,A`:' },
      { type: 'compare', high: 'result = 1\nfor i in range(3):\n    result = result * 2', z80: '        LD A,1\n        LD B,3\nloop:   ADD A,A\n        DJNZ loop' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,1
        LD B,3          ; the exponent
loop:   ADD A,A         ; double
        DJNZ loop       ; ...B times
        OUT (1),A       ; 2 to the power 3 = 8
        HALT`,
        prints: '8',
      },
      { type: 'tip', text: 'Tripling is "double, then add the original once more", so you need a spare register to remember the original value.' },
    ],
    task: ['Register B holds an exponent from 1 to 5.', 'Put 3 to the power B in register A (3, 9, 27, 81 or 243).'],
    starterCode: startWith('B contains a number from 1 to 5'),
    hints: hints(
      ['Start A at 1 and multiply it by 3 once for every count in B.', 'To triple A, copy it to C, double A, then add C.'],
      'A loop of B passes, each one tripling A.',
      `        ORG 0x8000
        LD A,1
loop:   LD C,A          ; remember the old value
        ADD A,A         ; x2
        ADD A,C         ; x3
        DJNZ loop
        HALT`,
    ),
    tests: [
      { name: '3^1', setup: { registers: { B: 1 } }, expect: { registers: { A: 3 } } },
      { name: '3^2', setup: { registers: { B: 2 } }, expect: { registers: { A: 9 } } },
      { name: '3^4', setup: { registers: { B: 4 } }, expect: { registers: { A: 81 } } },
      { name: '3^5', setup: { registers: { B: 5 } }, expect: { registers: { A: 243 } } },
    ],
  },
  {
    id: 'nested-loops',
    title: 'Loops inside loops',
    module: 'Loops',
    intro: 'Put one loop in the body of another. Each needs its own counter register.',
    content: [
      { type: 'text', text: 'To draw a grid you repeat a row several times, and a row is itself a repeat of one character. The inner loop runs completely for every pass of the outer loop. `DJNZ` already owns `B`, so give the other loop a different register, such as `C`.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD C,2          ; 2 rows
row:    LD B,3          ; 3 stars in each row
col:    LD A,'*'
        OUT (0),A
        DJNZ col        ; inner loop
        OUT (2),A       ; end of the row
        DEC C
        JR NZ,row       ; outer loop
        HALT`,
        prints: '***\n***\n',
      },
      { type: 'tip', text: 'Reset the inner counter at the top of the outer loop (`LD B,3` is inside `row`), because DJNZ leaves it at 0 after each row.' },
    ],
    task: ['Print a triangle of stars with four rows.', 'The first row has one star, the second two, and so on up to four.'],
    starterCode: startWith('port 0 = character, 2 = newline'),
    hints: hints(
      ['The number of stars in a row is the number of that row, so the inner count changes every time.', 'Keep the row number in C, and copy it into B at the start of each row.'],
      'The outer loop counts rows 1 to 4; B takes the row number.',
      `        ORG 0x8000
        LD C,1          ; row number
row:    LD B,C          ; stars in this row = row number
col:    LD A,'*'
        OUT (0),A
        DJNZ col
        OUT (2),A       ; new line
        INC C
        LD A,C
        CP 5            ; after row 4?
        JR NZ,row
        HALT`,
    ),
    tests: [{ name: 'four-row triangle', expect: { output: '*\n**\n***\n****' } }],
  },
]
