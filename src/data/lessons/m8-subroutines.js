import { startWith, startWithScreen, hints } from './helpers.js'

export default [
  {
    id: 'subroutine',
    title: 'Subroutines: CALL and RET',
    module: 'Subroutines',
    intro: 'A subroutine is a named piece of code you can run from anywhere and return from, like a function.',
    content: [
      { type: 'text', text: 'Give a block of code a label and end it with `RET`. `CALL label` runs it, and when it reaches `RET` the processor comes back to the instruction after the `CALL`. Write each subroutine once and call it as often as you like.' },
      { type: 'compare', high: 'def bang():\n    show("!")\n\nbang()\nbang()', z80: '        CALL bang\n        CALL bang\n        HALT\nbang:   LD A,\'!\'\n        RST 0x10\n        RET' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        CALL bang
        CALL bang
        HALT            ; the main program ends here
bang:   LD A,'!'        ; a subroutine
        RST 0x10
        RET             ; back to just after the CALL`,
        prints: '!!',
      },
      { type: 'tip', text: 'Put subroutines after the `HALT`. If you put one in the middle of your main program, the processor will run into it by accident.' },
      { type: 'text', text: '`RET` can also be conditional, like a jump: `RET Z` returns only if the Zero flag is set, and `RET NZ`, `RET C` and `RET NC` work the same way. `CALL Z,label` and the rest are conditional too. A subroutine that can stop early often begins with a test and a `RET cc`.' },
    ],
    task: ['Write a subroutine called double that doubles the value in register A.', 'Your main program must use it three times on register A, so that A ends up eight times larger than it started.', 'A is at most 31.'],
    starterCode: '        ORG 0x8000\n\n        ; main program\n\n        HALT\n\n        ; subroutines go after HALT\n',
    requires: { call: { label: 'double', min: 3 } },
    hints: hints(
      ['Doubling is the same as adding a number to itself.', 'Define the subroutine after HALT, with a label named double and a RET at the end. Then CALL double from the main program.'],
      'Three CALLs and one two-instruction subroutine.',
      `        ORG 0x8000
        CALL double
        CALL double
        CALL double
        HALT

double: ADD A,A         ; A = A * 2
        RET`,
    ),
    tests: [
      { name: 'A = 1', setup: { registers: { A: 1 } }, expect: { registers: { A: 8 } } },
      { name: 'A = 3', setup: { registers: { A: 3 } }, expect: { registers: { A: 24 } } },
      { name: 'A = 31', setup: { registers: { A: 31 } }, expect: { registers: { A: 248 } } },
    ],
  },
  {
    id: 'parameters',
    title: 'Parameters and return values',
    module: 'Subroutines',
    intro: 'Subroutines take their inputs and give their answers in registers. Agree on which, and write it down.',
    content: [
      { type: 'text', text: 'The Z80 has no parameter lists. Instead you decide which registers carry the inputs and which carries the answer, and describe that in a comment above the subroutine. A common habit is inputs in `A` and `B`, answer in `A`.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,10
        LD B,3
        CALL add_twice  ; A = 10 + 3 + 3
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; prints 16
        HALT

; add_twice: A = A + B + B
add_twice:
        ADD A,B
        ADD A,B
        RET`,
        prints: '16',
      },
      { type: 'tip', text: 'To call a subroutine on a different pair of values, move them into the agreed registers first. If you need an earlier result later, park it in a register the subroutine does not use.' },
    ],
    task: ['A, B, C and D hold four numbers.', 'Write a subroutine called average that leaves the average of A and B, (A + B) / 2 rounded down, in A. A + B is at most 255.', 'Use it to find the average of (the average of A and B) and (the average of C and D), leaving the result in A. You must call average at least twice.'],
    starterCode: startWith('A, B, C and D contain numbers', 'subroutines go after HALT'),
    requires: { call: { label: 'average', min: 2 } },
    hints: hints(
      ['average is an add followed by a halve (a right shift).', 'Call it once for A and B, save the answer in E, then call it for C and D, and finally for the two answers.'],
      'average(A,B), average(C,D), then average of those.',
      `        ORG 0x8000
        CALL average    ; A = average of A and B
        LD E,A          ; keep it
        LD A,C
        LD B,D
        CALL average    ; A = average of C and D
        LD B,E
        CALL average    ; average of the two averages
        HALT

; average: A = (A + B) / 2
average:
        ADD A,B
        SRL A
        RET`,
    ),
    tests: [
      { name: '10, 20, 30, 40', setup: { registers: { A: 10, B: 20, C: 30, D: 40 } }, expect: { registers: { A: 25 } } },
      { name: 'all zero', setup: { registers: { A: 0, B: 0, C: 0, D: 0 } }, expect: { registers: { A: 0 } } },
      { name: '100, 100, 50, 50', setup: { registers: { A: 100, B: 100, C: 50, D: 50 } }, expect: { registers: { A: 75 } } },
      { name: 'rounding', setup: { registers: { A: 7, B: 8, C: 9, D: 10 } }, expect: { registers: { A: 8 } } },
    ],
  },
  {
    id: 'stack',
    title: 'The stack: PUSH and POP',
    module: 'Subroutines',
    intro: 'The stack is a pile of 16-bit values in memory. Push to save a register pair, pop to get it back.',
    content: [
      { type: 'text', text: 'The processor keeps a pile of 16-bit values in memory called the stack. `PUSH rr` puts a register pair on top and `POP rr` takes the top one off into a pair. It is last in, first out, like a stack of plates. `PUSH` and `POP` work on `BC`, `DE`, `HL` and `AF`.' },
      { type: 'text', text: '`CALL` uses the same stack to remember where to return to, and `RET` pops it. That is why your pushes and pops must balance inside a subroutine: a stray extra push makes `RET` jump to the wrong place.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD BC,0x1234
        PUSH BC         ; save it
        LD BC,0         ; BC is free to use for something else
        POP BC          ; BC is 0x1234 again
        HALT`,
      },
      { type: 'tip', text: 'Pop in the reverse order you pushed. Push BC then DE, and you must pop DE first, then BC.' },
    ],
    task: ['BC and DE hold 16-bit values. Swap them.', 'Registers A, H and L must end with the values they started with.'],
    starterCode: startWith('BC and DE hold 16-bit values'),
    hints: hints(
      ['The last pair pushed is the first pair popped. PUSH BC then POP DE moves a value between pairs.', 'Push both pairs, then pop them back in the opposite order.'],
      'Push BC and DE, then pop them into each other.',
      `        ORG 0x8000
        PUSH BC
        PUSH DE
        POP BC          ; BC gets the old DE
        POP DE          ; DE gets the old BC
        HALT`,
    ),
    tests: [
      { name: 'distinct values', setup: { registers: { BC: 0x1234, DE: 0xabcd, A: 9, HL: 0x5566 } }, expect: { registers: { BC: 0xabcd, DE: 0x1234, A: 9, HL: 0x5566 } } },
      { name: 'one is zero', setup: { registers: { BC: 0, DE: 0xffff, A: 1, HL: 0x0102 } }, expect: { registers: { BC: 0xffff, DE: 0, A: 1, HL: 0x0102 } } },
    ],
  },
  {
    id: 'preserving',
    title: 'Keeping the caller\'s registers safe',
    module: 'Subroutines',
    intro: 'A subroutine shares its registers with the program that called it. Save what you change, restore it before `RET`.',
    content: [
      { type: 'text', text: 'There are only a few registers, so a subroutine often needs the same ones its caller is using. If it changes one without saying so, the caller finds a different value afterwards and the bug is hard to see. The polite fix: `PUSH` the registers you will change at the top, and `POP` them (in reverse) just before `RET`.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD B,7
        CALL noisy      ; uses B as a counter inside
        LD A,B
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; still 7, because noisy saved it
        HALT

noisy:  PUSH BC         ; save the caller's B and C
        LD B,3
again:  LD A,'.'
        RST 0x10
        DJNZ again
        POP BC          ; give them back
        RET`,
        prints: '...7',
      },
      { type: 'tip', text: 'Decide a policy and document it in a comment: either the subroutine preserves everything except its answer, or it lists the registers it destroys. Either is fine if the caller knows.' },
    ],
    task: ['B holds a count from 1 to 5.', 'Write a subroutine called stars that prints that many * characters, using B as its loop counter.', 'After calling stars once, the main program prints the number in B as a decimal number, so the subroutine must give B back unchanged.'],
    starterCode: startWithScreen('B contains a count from 1 to 5', 'subroutines go after HALT'),
    requires: { call: { label: 'stars', min: 1 } },
    hints: hints(
      ['DJNZ will change B, but the main program needs the original value afterwards.', 'PUSH BC at the start of the subroutine and POP BC just before RET.'],
      'The subroutine saves BC around its loop.',
      `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        CALL stars
        LD A,B
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; B must still be the count
        HALT

stars:  PUSH BC         ; save the caller's B
more:   LD A,'*'
        RST 0x10
        DJNZ more       ; this changes B
        POP BC          ; restore it
        RET`,
    ),
    tests: [
      { name: 'B = 3', setup: { registers: { B: 3 } }, expect: { output: '***3' } },
      { name: 'B = 1', setup: { registers: { B: 1 } }, expect: { output: '*1' } },
      { name: 'B = 5', setup: { registers: { B: 5 } }, expect: { output: '*****5' } },
    ],
  },
  {
    id: 'shadow-registers',
    title: 'A spare set of registers: EXX',
    module: 'Subroutines',
    intro: 'The Z80 has a hidden second set of registers. `EXX` swaps to it in one instruction.',
    content: [
      { type: 'text', text: 'Besides `BC`, `DE` and `HL`, the Z80 has a second hidden set called the shadow registers, written `BC\'`, `DE\'` and `HL\'`. `EXX` swaps the visible three pairs with the shadow ones in a single instruction. The first `EXX` hands you a fresh set to work in; the second brings your originals back, untouched. `EX AF,AF\'` does the same for `A` and the flags.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD BC,1
        LD DE,2
        LD HL,3
        EXX             ; the spare set is now visible
        LD BC,100       ; use it freely: the first set is safe
        EXX             ; back to BC=1, DE=2, HL=3
        LD A,C
        ADD A,E
        ADD A,L
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; prints 6
        HALT`,
        prints: '6',
      },
      { type: 'tip', text: 'It is much quicker than pushing and popping three registers. The catch is that you only get one spare set, so use it for one job at a time.' },
    ],
    task: ['BC, DE and HL hold values that must still be there when the program ends.', 'Use the spare registers (EXX) to work out 7 + 8 and leave 15 in register A.'],
    starterCode: startWith('BC, DE and HL contain values to keep'),
    hints: hints(
      ['Switch to the spare set, do the sum there, and switch back.', 'A is not part of the swapped set, so the answer in A survives the second EXX.'],
      'EXX, do the sum in the spare set, EXX again.',
      `        ORG 0x8000
        EXX             ; use the spare registers
        LD B,7
        LD C,8
        LD A,B
        ADD A,C         ; A = 15
        EXX             ; bring BC, DE, HL back
        HALT`,
    ),
    tests: [
      { name: 'mixed values', setup: { registers: { BC: 0x1234, DE: 0x5678, HL: 0x9abc } }, expect: { registers: { A: 15, BC: 0x1234, DE: 0x5678, HL: 0x9abc } } },
      { name: 'all zero', setup: { registers: { BC: 0, DE: 0, HL: 0 } }, expect: { registers: { A: 15, BC: 0, DE: 0, HL: 0 } } },
    ],
  },
]
