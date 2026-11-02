import { startWith, hints } from './helpers.js'

export default [
  {
    id: 'carry-errors',
    title: 'Reporting errors with the carry flag',
    module: 'Errors and debugging',
    intro: 'Assembly has no exceptions. A common convention is for a subroutine to return an error in the Carry flag.',
    content: [
      { type: 'text', text: 'What should a subroutine do if it cannot finish, for example when asked to divide by zero? Many Z80 programs use the Carry flag as a success/failure signal: carry clear means OK, carry set means error. The subroutine sets or clears carry just before `RET`, and the caller checks it with `JR C`.' },
      { type: 'text', text: '`SCF` sets the carry flag. To clear it, use `OR A` (or `AND A`), which also leaves A unchanged.' },
      { type: 'compare', high: 'try:\n    r = divide(a, b)\nexcept ZeroDivisionError:\n    show("E")', z80: '        CALL divide\n        JR C,error\n        ; use A\nerror:  ; handle it\ndivide: RET' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,0
        CALL check_not_zero
        JR C,failed     ; carry set means error
        LD A,'k'
        JR show
failed: LD A,'E'
show:   OUT (0),A       ; prints E
        HALT

; check_not_zero: carry set if A is zero
check_not_zero:
        OR A            ; Z set if A is 0 (and clears carry)
        RET NZ          ; fine: carry is clear
        SCF             ; it was zero: set carry
        RET`,
        prints: 'E',
      },
      { type: 'tip', text: 'Decide which flag value means error and use it everywhere. Document it above each subroutine so callers know to check.' },
    ],
    task: ['The starter program already calls a subroutine called divide and prints the answer, or the letter E if carry is set.', 'Write divide: it divides A by B (repeated subtraction), leaves the quotient in A and clears carry. If B is 0 it must set carry instead.'],
    starterCode: `        ORG 0x8000
        ; A and B hold the dividend and the divisor
        CALL divide
        JR C,error
        OUT (1),A       ; print the quotient
        HALT
error:  LD A,'E'
        OUT (0),A
        HALT

; divide: A = A / B, carry clear on success. Carry set if B is 0.
divide:
        RET
`,
    requires: { call: { label: 'divide', min: 1 } },
    hints: hints(
      ['Test B for zero first. INC B then DEC B leaves B alone but sets the Zero flag if B was 0.', 'Then divide by repeated subtraction, like the earlier divide-by-7 lesson. OR A before RET clears carry, and SCF sets it.'],
      'Zero check, a subtraction loop, and carry set or cleared before RET.',
      `        ORG 0x8000
        CALL divide
        JR C,error
        OUT (1),A
        HALT
error:  LD A,'E'
        OUT (0),A
        HALT

divide:
        INC B
        DEC B           ; is B zero? (B unchanged)
        JR Z,fail
        LD C,0          ; quotient
again:  CP B
        JR C,finished   ; A < B: done
        SUB B
        INC C
        JR again
finished:
        LD A,C
        OR A            ; clear carry
        RET
fail:   SCF             ; report the error
        RET`,
    ),
    tests: [
      { name: '20 / 4', setup: { registers: { A: 20, B: 4 } }, expect: { output: '5' } },
      { name: '9 / 2', setup: { registers: { A: 9, B: 2 } }, expect: { output: '4' } },
      { name: '0 / 5', setup: { registers: { A: 0, B: 5 } }, expect: { output: '0' } },
      { name: '255 / 1', setup: { registers: { A: 255, B: 1 } }, expect: { output: '255' } },
      { name: 'divide by zero', setup: { registers: { A: 7, B: 0 } }, expect: { output: 'E' } },
    ],
  },
  {
    id: 'guard-loops',
    title: 'Guarding against bad input',
    module: 'Errors and debugging',
    intro: 'Check for the awkward cases before the code can go wrong. The classic one: `DJNZ` with B = 0.',
    content: [
      { type: 'text', text: 'Most bugs live at the edges: an empty list, a count of zero, a value at its maximum. A `DJNZ` loop subtracts first, so entering it with B = 0 wraps to 255 and repeats 256 times instead of none. If a count might be zero, test it before the loop and jump past it.' },
      { type: 'compare', high: 'for i in range(n):\n    show("*")', z80: '        INC B\n        DEC B\n        JR Z,done\nloop:   LD A,\'*\'\n        OUT (0),A\n        DJNZ loop\ndone:' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD B,0          ; an empty count
        INC B
        DEC B           ; sets Z if B is 0, leaves B alone
        JR Z,done       ; nothing to do
loop:   LD A,'*'
        OUT (0),A
        DJNZ loop
done:   HALT`,
        prints: '',
      },
      { type: 'tip', text: '`INC B` then `DEC B` is a small trick to test B without changing it. `LD A,B` followed by `OR A` does the same job through A.' },
    ],
    task: ['Register B holds a count from 0 to 5.', 'Print that many * characters. For a count of 0 print nothing at all.'],
    starterCode: startWith('B contains a count from 0 to 5'),
    hints: hints(
      ['A DJNZ loop entered with B = 0 would print 256 stars. Check for zero first.', 'INC B / DEC B sets the Zero flag if B was 0 without changing B.'],
      'Skip the loop if B is zero.',
      `        ORG 0x8000
        INC B
        DEC B           ; Z set if B = 0
        JR Z,done       ; nothing to print
loop:   LD A,'*'
        OUT (0),A
        DJNZ loop
done:   HALT`,
    ),
    tests: [
      { name: 'zero stars', setup: { registers: { B: 0 } }, expect: { output: '' } },
      { name: 'one star', setup: { registers: { B: 1 } }, expect: { output: '*' } },
      { name: 'three stars', setup: { registers: { B: 3 } }, expect: { output: '***' } },
    ],
  },
  {
    id: 'debugging',
    title: 'Finding bugs',
    module: 'Errors and debugging',
    intro: 'Programs rarely work first time. Learn the usual suspects and how to see what the program is really doing.',
    content: [
      { type: 'text', text: 'The processor does exactly what you wrote, which is sometimes not what you meant. Most assembly bugs come from a short list:' },
      {
        type: 'table',
        head: ['Bug', 'Symptom'],
        rows: [
          ['Off by one', 'a loop runs one time too many or too few'],
          ['Value never initialised', 'a total starts from a leftover number'],
          ['Pointer not advanced', 'the same element is used again and again'],
          ['Register overwritten', 'a value you needed has changed'],
          ['Unbalanced PUSH/POP', 'RET jumps somewhere strange'],
          ['DJNZ entered with B = 0', 'the loop runs 256 times'],
        ],
      },
      { type: 'text', text: 'To see what is happening, print! Add `OUT (1),A` inside the loop to show the changing value, run it, and compare with what you expected. Remove the extra prints once it works.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD B,3
        XOR A
loop:   ADD A,B
        OUT (1),A       ; debug: show the running total
        OUT (2),A
        DJNZ loop
        HALT`,
        caption: 'The totals printed are 3, 5 and 6. If you expected something else, you have found where it goes wrong.',
        prints: '3\n5\n6\n',
      },
    ],
    task: ['This program should print the sum of the four numbers in data (10) but it prints something else.', 'Find the two bugs and fix them. Edit the starter code; do not rewrite it from scratch.'],
    starterCode: `        ORG 0x8000
        ; should print the sum of the four numbers in data
        LD HL,data
        LD B,3
        LD A,10
sum:    ADD A,(HL)
        INC HL
        DJNZ sum
        OUT (1),A
        HALT
data:   DB 1,2,3,4
`,
    hints: hints(
      ['Add OUT (1),A inside the loop to watch the total. What does it look like before the first number is added?', 'Count the numbers in data. Does the loop go round that many times?'],
      'The total must start at 0 and the loop must run four times.',
      `        ORG 0x8000
        LD HL,data
        LD B,4          ; bug 1: there are four numbers, not three
        XOR A           ; bug 2: the total must start at 0, not 10
sum:    ADD A,(HL)
        INC HL
        DJNZ sum
        OUT (1),A
        HALT
data:   DB 1,2,3,4`,
    ),
    tests: [{ name: 'prints 10', expect: { output: '10' } }],
  },
  {
    id: 'bcd',
    title: 'Decimal arithmetic with DAA',
    module: 'Errors and debugging',
    intro: 'Binary-coded decimal keeps one decimal digit in each half of a byte. `DAA` repairs the result of adding two of them.',
    content: [
      { type: 'text', text: 'Scores, clocks and money are decimal. In binary-coded decimal (BCD) each nibble (4 bits) holds one digit 0-9, so 47 is stored as the byte `0x47`. Plain `ADD` knows nothing about this: `0x19 + 0x28` gives `0x41`, not `0x47`. `DAA` ("decimal adjust accumulator") straight after the `ADD` (or `SUB`) fixes the answer up.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,0x19       ; the number 19 in BCD
        ADD A,0x28      ; binary result 0x41
        DAA             ; adjusted to 0x47, which is 47 in BCD
        HALT`,
      },
      { type: 'tip', text: 'DAA also sets the Carry flag when the decimal result passes 99, so you can chain it across bytes with `ADC` just like binary arithmetic.' },
    ],
    task: ['A and B each hold a two-digit BCD number.', 'Add them as decimal numbers, leaving the BCD result in A. The sum is at most 99.'],
    starterCode: startWith('A and B hold BCD numbers, e.g. 0x25 means 25'),
    hints: hints(
      ['Add as normal.', 'Then run the adjustment instruction straight away, before anything changes the flags.'],
      'ADD then DAA.',
      `        ORG 0x8000
        ADD A,B         ; binary add
        DAA             ; fix it up as decimal
        HALT`,
    ),
    tests: [
      { name: '19 + 28', setup: { registers: { A: 0x19, B: 0x28 } }, expect: { registers: { A: 0x47 } } },
      { name: '45 + 37', setup: { registers: { A: 0x45, B: 0x37 } }, expect: { registers: { A: 0x82 } } },
      { name: '09 + 01', setup: { registers: { A: 0x09, B: 0x01 } }, expect: { registers: { A: 0x10 } } },
      { name: '50 + 49', setup: { registers: { A: 0x50, B: 0x49 } }, expect: { registers: { A: 0x99 } } },
    ],
  },
]
