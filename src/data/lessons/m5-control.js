import { startWith, hints } from './helpers.js'

export default [
  {
    id: 'jumps',
    title: 'Labels and jumps',
    module: 'Control flow',
    intro: 'Instructions normally run top to bottom. A jump sends the processor somewhere else.',
    content: [
      { type: 'text', text: 'A label is a name for a place in your program, written at the start of a line with a colon: `skip:`. A jump instruction moves the processor to a label instead of the next line. `JP label` can reach anywhere. `JR label` ("jump relative") is shorter and faster but only reaches about 128 bytes either way, which is plenty for most loops and decisions.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,1
        JR skip         ; jump over the next line
        LD A,99         ; never runs
skip:   LD B,2
        HALT`,
        caption: 'This finishes with A = 1 and B = 2.',
      },
      { type: 'tip', text: 'Every decision and every loop in assembly is built from labels and jumps. The next lessons add a condition to the jump, so it happens only sometimes.' },
    ],
    task: ['The starter program loads 99 into A on a line that must not run.', 'Add a jump so that line is skipped. A must end as 1 and B as 2.'],
    starterCode: '        ORG 0x8000\n        LD A,1\n        ; add a jump here so the next line is skipped\n        LD A,99\nafter:  LD B,2\n        HALT\n',
    hints: hints(
      ['The label you need is already in the starter code.', 'Put a jump to that label between the two loads.'],
      'JR after, placed before the LD A,99 line.',
      `        ORG 0x8000
        LD A,1
        JR after        ; skip the next line
        LD A,99
after:  LD B,2
        HALT`,
    ),
    tests: [{ name: 'A = 1 and B = 2', expect: { registers: { A: 1, B: 2 } } }],
  },
  {
    id: 'if-equal',
    title: 'Flags, compare and if',
    module: 'Control flow',
    intro: 'The flags record what the last instruction produced. `CP` sets them for a comparison and `JR Z` or `JR NZ` acts on them.',
    content: [
      { type: 'text', text: 'Most arithmetic instructions leave behind a few one-bit flags. The Zero flag (Z) is set when the result was 0. `CP x` ("compare") works out `A - x` only to set the flags, then throws the answer away, so A is not changed. After `CP`, Z is set if A equals x.' },
      { type: 'text', text: '`JR Z,label` jumps only if Z is set, and `JR NZ,label` jumps only if it is clear. To run some code only when a condition is true, jump over it when the condition is false:' },
      { type: 'compare', high: 'if a == 5:\n    b = 1', z80: 'CP 5\nJR NZ,skip\nLD B,1\nskip:' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,5
        CP 5            ; is A equal to 5?
        JR NZ,skip      ; no: jump over the body
        LD A,'='
        RST 0x10        ; the body: prints =
skip:   HALT`,
        prints: '=',
      },
      { type: 'text', text: '`CP` accepts the same operands as `ADD` and `SUB`: a number, a register, or `(HL)` to compare with the byte in memory that HL points at.' },
      { type: 'tip', text: 'Test for the opposite of what you want, then jump over the body. "If A is 5, do X" becomes "if A is not 5, skip X".' },
    ],
    task: ['Register B is 0 to start with.', 'If A equals 10, set B to 1. Otherwise leave B alone.'],
    starterCode: startWith('B starts at 0, A contains a number'),
    hints: hints(
      ['Compare A with 10, then jump over the instruction that sets B when they are not equal.', 'JR NZ,label jumps when the numbers differ.'],
      'Compare, skip on NZ, set B.',
      `        ORG 0x8000
        CP 10           ; is A equal to 10?
        JR NZ,done      ; no: leave B alone
        LD B,1
done:   HALT`,
    ),
    tests: [
      { name: 'A = 10', setup: { registers: { A: 10 } }, expect: { registers: { B: 1 } } },
      { name: 'A = 11', setup: { registers: { A: 11 } }, expect: { registers: { B: 0 } } },
      { name: 'A = 0', setup: { registers: { A: 0 } }, expect: { registers: { B: 0 } } },
      { name: 'A = 255', setup: { registers: { A: 255 } }, expect: { registers: { B: 0 } } },
    ],
  },
  {
    id: 'if-else',
    title: 'If / else and less-than',
    module: 'Control flow',
    intro: 'After `CP` the Carry flag says whether A was smaller. Use it for less-than and greater-than, and for two-way choices.',
    content: [
      { type: 'text', text: 'The Carry flag (C) is set by `CP x` when A is less than x. Put together with Zero, a compare answers every question:' },
      {
        type: 'table',
        head: ['After CP x', 'Z', 'C'],
        rows: [['A = x', 'set', 'clear'], ['A < x', 'clear', 'set'], ['A > x', 'clear', 'clear']],
      },
      { type: 'text', text: '`JR C,label` jumps if A was less, `JR NC,label` if it was not. For an if/else, jump over one branch to reach the other, and end the first branch with a `JR` that skips the second:' },
      { type: 'compare', high: 'if a < 50:\n    show("S")\nelse:\n    show("B")', z80: 'CP 50\nJR C,small\n; else branch\nJR done\nsmall: ; then branch\ndone:' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,20
        CP 50           ; compare with 50
        JR C,small      ; carry set: A < 50
        LD A,'B'        ; else: big
        JR show
small:  LD A,'S'        ; then: small
show:   RST 0x10        ; prints S
        HALT`,
        prints: 'S',
      },
    ],
    task: ['If A is less than 100, put 1 in register B.', 'Otherwise (100 or more) put 2 in B.'],
    starterCode: startWith('A contains a number'),
    hints: hints(
      ['Compare A with 100 and use the Carry flag to tell which branch to take.', 'One branch ends with a JR that jumps over the other branch.'],
      'CP 100, then a branch for each answer.',
      `        ORG 0x8000
        CP 100          ; carry set if A < 100
        JR C,less
        LD B,2          ; 100 or more
        JR done
less:   LD B,1          ; below 100
done:   HALT`,
    ),
    tests: [
      { name: 'A = 5', setup: { registers: { A: 5 } }, expect: { registers: { B: 1 } } },
      { name: 'A = 99', setup: { registers: { A: 99 } }, expect: { registers: { B: 1 } } },
      { name: 'A = 100', setup: { registers: { A: 100 } }, expect: { registers: { B: 2 } } },
      { name: 'A = 255', setup: { registers: { A: 255 } }, expect: { registers: { B: 2 } } },
    ],
  },
  {
    id: 'testing-bits',
    title: 'Testing a bit',
    module: 'Control flow',
    intro: '`BIT` tests one bit and sets the Zero flag, so a decision can depend on a single bit.',
    content: [
      { type: 'text', text: '`BIT b,r` looks at bit `b` of a register without changing it. If the bit is 0, the Zero flag is set; if the bit is 1, Zero is clear. So `JR Z` jumps when the bit is off. This is how programs read flags and switches stored in a byte.' },
      { type: 'text', text: 'Bit 7 is special for signed numbers: it is 1 exactly when the number is negative.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,-5
        BIT 7,A         ; is the top bit set?
        JR Z,done       ; zero flag set: bit 7 is 0, so skip
        LD A,'-'
        RST 0x10        ; prints -
done:   HALT`,
        prints: '-',
      },
      { type: 'tip', text: '`LD` does not change flags, so you can load a result into a register between the `BIT` and the jump if you need to.' },
    ],
    task: ['Register B is 0 to start with.', 'If bit 7 of A is set, put 1 in B. Otherwise leave B alone.'],
    starterCode: startWith('B starts at 0, A contains a byte'),
    hints: hints(
      ['BIT 7,A sets the Zero flag when the bit is clear.', 'Jump over the load when Zero is set.'],
      'Test the bit, skip when it is clear, set B.',
      `        ORG 0x8000
        BIT 7,A         ; Z is set if bit 7 is 0
        JR Z,done
        LD B,1
done:   HALT`,
    ),
    tests: [
      { name: 'A = 0x80', setup: { registers: { A: 0x80 } }, expect: { registers: { B: 1 } } },
      { name: 'A = 0x7F', setup: { registers: { A: 0x7f } }, expect: { registers: { B: 0 } } },
      { name: 'A = 0xFF', setup: { registers: { A: 0xff } }, expect: { registers: { B: 1 } } },
      { name: 'A = 0', setup: { registers: { A: 0 } }, expect: { registers: { B: 0 } } },
    ],
  },
  {
    id: 'ranges',
    title: 'Combining conditions: and, or',
    module: 'Control flow',
    intro: 'Chain several tests: all must pass for "and", any one is enough for "or".',
    content: [
      { type: 'text', text: '`CP` leaves A unchanged, so you can test the same value again straight away. For "and", every test is a gate that sends you past the body if it fails. For "or", any test that succeeds sends you straight to the body.' },
      { type: 'compare', high: 'if a == 3 or a == 5:\n    show("Y")', z80: 'CP 3\nJR Z,yes\nCP 5\nJR NZ,no\nyes: ; body\nno:' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,5
        CP 3
        JR Z,yes        ; 3 is good enough
        CP 5
        JR NZ,no        ; neither 3 nor 5
yes:    LD A,'Y'
        RST 0x10        ; prints Y
no:     HALT`,
        prints: 'Y',
      },
      { type: 'tip', text: 'An "and" such as `low <= A <= high` is two tests. Compare against low and bail out if A is smaller. Then compare against high + 1 and bail out if A is not smaller.' },
    ],
    task: ['Register B is 0 to start with.', 'If A is from 10 to 20 inclusive, put 1 in B. Otherwise leave B alone.'],
    starterCode: startWith('B starts at 0, A contains a number'),
    hints: hints(
      ['Two tests: A must not be below 10, and A must be below 21.', 'CP 10 sets carry when A < 10. CP 21 clears carry when A >= 21. Either failure should jump past the LD.'],
      'Reject below 10, reject 21 or more, otherwise set B.',
      `        ORG 0x8000
        CP 10
        JR C,done       ; A < 10: out of range
        CP 21
        JR NC,done      ; A >= 21: out of range
        LD B,1
done:   HALT`,
    ),
    tests: [
      { name: 'A = 9', setup: { registers: { A: 9 } }, expect: { registers: { B: 0 } } },
      { name: 'A = 10', setup: { registers: { A: 10 } }, expect: { registers: { B: 1 } } },
      { name: 'A = 15', setup: { registers: { A: 15 } }, expect: { registers: { B: 1 } } },
      { name: 'A = 20', setup: { registers: { A: 20 } }, expect: { registers: { B: 1 } } },
      { name: 'A = 21', setup: { registers: { A: 21 } }, expect: { registers: { B: 0 } } },
    ],
  },
]
