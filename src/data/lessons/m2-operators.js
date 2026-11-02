import { startWith, hints } from './helpers.js'

export default [
  {
    id: 'adding',
    title: 'Adding numbers',
    module: 'Arithmetic and bits',
    intro: 'Arithmetic is done in the accumulator, register A, with `ADD`.',
    content: [
      { type: 'text', text: 'Most arithmetic works on register A, the accumulator. `ADD A,x` adds `x` to A and leaves the answer in A. The `x` can be another register or a plain number.' },
      { type: 'compare', high: 'a = a + b', z80: 'ADD A,B' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,20
        LD B,22
        ADD A,B         ; A = 20 + 22 = 42
        ADD A,8         ; A = 42 + 8 = 50
        HALT`,
      },
      { type: 'tip', text: 'A is both an input and the place the answer lands, so the old value of A is gone after an ADD. Copy it elsewhere first if you still need it.' },
    ],
    task: ['Registers A and B hold numbers. Add B to A, then add 10 more.', 'Leave the total in A. You may assume it is no more than 255.'],
    starterCode: startWith('A and B contain numbers'),
    hints: hints(
      ['ADD A,B adds B to A.', 'A second ADD can add a plain number.'],
      'One ADD with a register, one with a number.',
      `        ORG 0x8000
        ADD A,B         ; A = A + B
        ADD A,10        ; A = A + 10
        HALT`,
    ),
    tests: [
      { name: '3 + 4 + 10', setup: { registers: { A: 3, B: 4 } }, expect: { registers: { A: 17 } } },
      { name: '100 + 55 + 10', setup: { registers: { A: 100, B: 55 } }, expect: { registers: { A: 165 } } },
      { name: '0 + 0 + 10', setup: { registers: { A: 0, B: 0 } }, expect: { registers: { A: 10 } } },
    ],
  },
  {
    id: 'subtracting',
    title: 'Subtracting numbers',
    module: 'Arithmetic and bits',
    intro: '`SUB` takes a value away from A.',
    content: [
      { type: 'text', text: 'Subtraction also works on A. `SUB x` takes `x` away from A. Unlike ADD there is no `A,` in front: the accumulator is understood.' },
      { type: 'compare', high: 'a = a - b', z80: 'SUB B' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,50
        LD B,8
        SUB B           ; A = 50 - 8 = 42
        SUB 2           ; A = 42 - 2 = 40
        HALT`,
      },
      { type: 'tip', text: 'The order matters: `SUB B` means A minus B, never B minus A. If the answer would be below zero, the byte wraps around to the top of the range.' },
    ],
    task: ['Subtract B from A, then subtract 1 more, leaving the answer in A.', 'A is always at least B + 1.'],
    starterCode: startWith('A and B contain numbers, A > B'),
    hints: hints(
      ['SUB B subtracts register B from A.', 'A second SUB takes away the extra 1.'],
      'One SUB with a register and one with a number.',
      `        ORG 0x8000
        SUB B           ; A = A - B
        SUB 1           ; A = A - 1
        HALT`,
    ),
    tests: [
      { name: '10 - 3 - 1', setup: { registers: { A: 10, B: 3 } }, expect: { registers: { A: 6 } } },
      { name: '50 - 49 - 1', setup: { registers: { A: 50, B: 49 } }, expect: { registers: { A: 0 } } },
      { name: '200 - 100 - 1', setup: { registers: { A: 200, B: 100 } }, expect: { registers: { A: 99 } } },
    ],
  },
  {
    id: 'inc-dec',
    title: 'Adding and taking away one',
    module: 'Arithmetic and bits',
    intro: '`INC` and `DEC` add or take away exactly one, on any register.',
    content: [
      { type: 'text', text: 'Adding or removing one is so common that it has its own instructions. Unlike ADD and SUB they work on any register, not just A, and they change the register in place.' },
      { type: 'compare', high: 'b = b + 1\nb = b - 1', z80: 'INC B\nDEC B' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD B,5
        INC B           ; B = 6
        INC B           ; B = 7
        DEC B           ; B = 6
        HALT`,
      },
      { type: 'tip', text: 'INC and DEC change the register itself, so copy it first (with LD) if you need the original value as well.' },
    ],
    task: ['Register B holds a number from 1 to 254.', 'Put B + 1 into register C and B - 1 into register D.', 'Register B must keep its original value.'],
    starterCode: startWith('B contains a number from 1 to 254'),
    hints: hints(
      ['INC and DEC change the register in place, so copy B first.', 'Copy B into C and into D, then change the copies.'],
      'Copy first, then adjust each copy.',
      `        ORG 0x8000
        LD C,B
        INC C           ; C = B + 1
        LD D,B
        DEC D           ; D = B - 1
        HALT`,
    ),
    tests: [
      { name: 'B = 5', setup: { registers: { B: 5 } }, expect: { registers: { B: 5, C: 6, D: 4 } } },
      { name: 'B = 100', setup: { registers: { B: 100 } }, expect: { registers: { B: 100, C: 101, D: 99 } } },
    ],
  },
  {
    id: 'doubling-halving',
    title: 'Doubling and halving: shifts',
    module: 'Arithmetic and bits',
    intro: 'There is no multiply instruction. Shifting the bits left or right doubles or halves a number.',
    content: [
      { type: 'text', text: 'Binary works like decimal: shift every digit one place left and the number grows by its base. In decimal that is times 10; in binary it is times 2. `SLA r` ("shift left") doubles a register, and `SRL r` ("shift right") halves it, dropping the remainder.' },
      { type: 'compare', high: 'x = x * 2\nx = x // 2', z80: 'SLA A\nSRL A' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,5
        SLA A           ; 10
        SLA A           ; 20
        SRL A           ; 10
        HALT`,
      },
      { type: 'text', text: 'Because every shift is a doubling, a multiply by 2, 4, 8 and so on is just that many shifts. Any other multiply needs a loop, which you will meet later.' },
      { type: 'tip', text: 'A shift that pushes a 1 out of the top (or bottom) leaves it in the Carry flag. You will use that in the next lessons.' },
    ],
    task: ['Register A holds a number from 0 to 31.', 'Put A divided by 4 (rounded down) into register B.', 'Then multiply A by 8, leaving the answer in A.'],
    starterCode: startWith('A contains a number from 0 to 31'),
    hints: hints(
      ['Divide first, while A still holds the original number: copy A to B, then shift B.', 'Dividing by 4 is two right shifts; multiplying by 8 is three left shifts.'],
      'Copy to B and halve it twice, then double A three times.',
      `        ORG 0x8000
        LD B,A
        SRL B           ; B = A / 2
        SRL B           ; B = A / 4
        SLA A           ; A * 2
        SLA A           ; A * 4
        SLA A           ; A * 8
        HALT`,
    ),
    tests: [
      { name: 'A = 5', setup: { registers: { A: 5 } }, expect: { registers: { A: 40, B: 1 } } },
      { name: 'A = 31', setup: { registers: { A: 31 } }, expect: { registers: { A: 248, B: 7 } } },
      { name: 'A = 0', setup: { registers: { A: 0 } }, expect: { registers: { A: 0, B: 0 } } },
    ],
  },
  {
    id: 'masks',
    title: 'AND, OR, XOR and flipping bits',
    module: 'Arithmetic and bits',
    intro: 'Bitwise instructions change individual bits of A. They are the tool for flags, masks and switches.',
    content: [
      { type: 'text', text: 'These instructions combine A with another value one bit at a time. Pair them with a "mask": a value whose 1 bits pick out the bits you care about.' },
      {
        type: 'table',
        head: ['Instruction', 'Effect', 'Use it to'],
        rows: [['AND x', '1 only where both are 1', 'keep some bits, clear the rest'], ['OR x', '1 where either is 1', 'switch bits on'], ['XOR x', '1 where they differ', 'toggle bits'], ['CPL', 'flips every bit of A', 'invert']],
      },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,%11001010
        AND %00001111   ; keep the low 4 bits:  00001010
        OR  %10000000   ; switch bit 7 on:      10001010
        XOR %00000010   ; toggle bit 1:         10001000
        CPL             ; flip everything:      01110111
        HALT`,
      },
      { type: 'tip', text: '`XOR A` makes A zero (every bit differs from itself), which is the usual quick way to clear it. `AND x`, `OR x` and `XOR x` only ever work on A.' },
    ],
    task: ['Register A holds a byte.', 'Keep only its low four bits (clear the high four).', 'Then switch bit 7 on, and finally flip every bit. Leave the result in A.'],
    starterCode: startWith('A contains a byte'),
    hints: hints(
      ['A mask of %00001111 with AND keeps the low four bits.', 'OR with %10000000 switches bit 7 on. CPL flips all the bits.'],
      'AND, then OR, then CPL.',
      `        ORG 0x8000
        AND %00001111   ; keep the low four bits
        OR  %10000000   ; bit 7 on
        CPL             ; flip every bit
        HALT`,
    ),
    tests: [
      { name: 'A = 0xA5', setup: { registers: { A: 0xa5 } }, expect: { registers: { A: 0x7a } } },
      { name: 'A = 0xFF', setup: { registers: { A: 0xff } }, expect: { registers: { A: 0x70 } } },
      { name: 'A = 0', setup: { registers: { A: 0 } }, expect: { registers: { A: 0x7f } } },
    ],
  },
  {
    id: 'bit-twiddle',
    title: 'Setting and clearing single bits',
    module: 'Arithmetic and bits',
    intro: '`SET`, `RES` and `BIT` work on one named bit of any register.',
    content: [
      { type: 'text', text: 'A byte is eight bits, numbered 0 (the right-hand, least significant bit) to 7. When you only want one bit you do not need a mask: `SET b,r` turns bit `b` on, `RES b,r` turns it off, and `BIT b,r` tests it. They work on any register.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD C,0
        SET 3,C         ; C = %00001000 = 8
        SET 0,C         ; C = %00001001 = 9
        RES 3,C         ; C = %00000001 = 1
        HALT`,
      },
      { type: 'text', text: '`BIT b,r` changes nothing in the register. It sets the Zero flag if the bit is 0, and you will use that to make decisions in the control flow lessons.' },
    ],
    task: ['Register A holds a byte.', 'Set bit 7 of A to 1 and clear bit 0 to 0.', 'Leave all other bits as they were.'],
    starterCode: startWith('A contains a byte'),
    hints: hints(
      ['SET b,r turns a bit on. RES b,r turns it off.', 'You need one of each.'],
      'One SET and one RES.',
      `        ORG 0x8000
        SET 7,A         ; bit 7 on
        RES 0,A         ; bit 0 off
        HALT`,
    ),
    tests: [
      { name: 'A = 0', setup: { registers: { A: 0 } }, expect: { registers: { A: 0x80 } } },
      { name: 'A = 255', setup: { registers: { A: 0xff } }, expect: { registers: { A: 0xfe } } },
      { name: 'A = 0x55', setup: { registers: { A: 0x55 } }, expect: { registers: { A: 0xd4 } } },
    ],
  },
  {
    id: 'sixteen-bit',
    title: '16-bit numbers: register pairs',
    module: 'Arithmetic and bits',
    intro: 'Pair up registers to hold numbers up to 65535: `BC`, `DE` and `HL`.',
    content: [
      { type: 'text', text: 'Eight bits is not always enough. `B` and `C` together form a 16-bit register `BC`, and likewise `D` and `E` make `DE` and `H` and `L` make `HL`. A pair holds 0 to 65535. You load it with `LD HL,1000`, and `INC` and `DEC` work on pairs too.' },
      { type: 'text', text: 'Adding is more limited: `ADD HL,rr` adds BC, DE or HL to HL, and HL is the only pair that can receive the answer.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD HL,1000
        LD DE,234
        ADD HL,DE       ; HL = 1234
        INC HL          ; HL = 1235
        LD B,H          ; copy HL into BC, one half at a time
        LD C,L
        HALT`,
      },
      { type: 'tip', text: 'Changing `B` changes `BC` and vice versa: they are the same storage. There is no `LD BC,HL`, so copy a pair as two 8-bit loads.' },
    ],
    task: ['Registers BC and DE hold 16-bit numbers.', 'Put BC + DE + 1000 into register HL. The total fits in 16 bits.'],
    starterCode: startWith('BC and DE contain 16-bit numbers'),
    hints: hints(
      ['Only HL can receive the result of ADD HL,rr.', 'Start HL at 1000 with LD HL,1000, then add BC and DE to it.'],
      'Load 1000 into HL, then add the two pairs.',
      `        ORG 0x8000
        LD HL,1000
        ADD HL,BC
        ADD HL,DE
        HALT`,
    ),
    tests: [
      { name: '0 + 0 + 1000', setup: { registers: { BC: 0, DE: 0 } }, expect: { registers: { HL: 1000 } } },
      { name: '1234 + 4321 + 1000', setup: { registers: { BC: 1234, DE: 4321 } }, expect: { registers: { HL: 6555 } } },
      { name: '30000 + 2000 + 1000', setup: { registers: { BC: 30000, DE: 2000 } }, expect: { registers: { HL: 33000 } } },
    ],
  },
  {
    id: 'carry',
    title: 'The carry flag and bigger sums',
    module: 'Arithmetic and bits',
    intro: 'When a sum does not fit in a byte, the Carry flag remembers the overflow. `ADC` adds it into the next byte.',
    content: [
      { type: 'text', text: 'The processor keeps a few one-bit flags. After `ADD`, the Carry flag (C) is set if the answer went past 255 and wrapped. `200 + 100` leaves 44 in A and Carry set; `20 + 30` leaves Carry clear.' },
      { type: 'text', text: '`ADC A,x` ("add with carry") adds x and the carry from the last step. So you can add numbers that are several bytes long, one byte at a time, lowest byte first. Here is `0x01F0 + 0x0120`:' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,0xF0       ; low byte of 0x01F0
        ADD A,0x20      ; + low byte of 0x0120 = 0x10, carry set
        LD C,A
        LD A,0x01       ; high byte of 0x01F0
        ADC A,0x01      ; + high byte + carry = 0x03
        LD B,A          ; BC = 0x0310
        HALT`,
      },
      { type: 'tip', text: '`LD` never touches the flags, so the carry survives the `LD C,A` and `LD A,0x01` in between. Instructions like `ADD`, `SUB`, `CP`, `AND` and `OR` do change them.' },
    ],
    task: ['BC and DE hold 16-bit numbers (B and D are the high bytes).', 'Add DE to BC using 8-bit instructions, so that the carry passes from the low byte to the high byte.', 'Leave the sum in BC.'],
    starterCode: startWith('BC and DE contain 16-bit numbers', 'use ADD and ADC on A, not ADD HL'),
    hints: hints(
      ['Add the low bytes first: C and E.', 'Add the high bytes second with ADC, which includes the carry from the low bytes. A is the only register that can do the sum.'],
      'Low bytes with ADD, high bytes with ADC.',
      `        ORG 0x8000
        LD A,C
        ADD A,E         ; low bytes, may set carry
        LD C,A
        LD A,B
        ADC A,D         ; high bytes plus the carry
        LD B,A
        HALT`,
    ),
    tests: [
      { name: '0x01F0 + 0x0120', setup: { registers: { BC: 0x01f0, DE: 0x0120 } }, expect: { registers: { BC: 0x0310 } } },
      { name: '0x00FF + 0x0001', setup: { registers: { BC: 0x00ff, DE: 0x0001 } }, expect: { registers: { BC: 0x0100 } } },
      { name: '0x1234 + 0x1111', setup: { registers: { BC: 0x1234, DE: 0x1111 } }, expect: { registers: { BC: 0x2345 } } },
    ],
  },
  {
    id: 'adc-sbc-hl',
    title: '16-bit subtraction with SBC',
    module: 'Arithmetic and bits',
    intro: 'There is no 16-bit `SUB`. `SBC HL,rr` subtracts including the carry, so you clear the carry first.',
    content: [
      { type: 'text', text: 'For 16-bit numbers the Z80 has `ADC HL,rr` and `SBC HL,rr`: add or subtract a pair, plus or minus the carry flag. There is no plain 16-bit subtract, so to do `HL = HL - DE` you make sure the carry is clear first and then use `SBC`.' },
      { type: 'text', text: '`OR A` is the usual way to clear the carry: it leaves A unchanged but resets Carry. `SCF` sets it again.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD HL,5000
        LD DE,1234
        OR A            ; clear the carry flag
        SBC HL,DE       ; HL = 5000 - 1234 = 3766
        HALT`,
      },
      { type: 'tip', text: 'If you forget `OR A`, a carry left over from some earlier instruction will make the answer one too small.' },
    ],
    task: ['HL and DE hold 16-bit numbers, and HL is at least as large as DE.', 'Subtract DE from HL, leaving the answer in HL.'],
    starterCode: startWith('HL >= DE, both are 16-bit numbers'),
    hints: hints(
      ['SBC HL,DE subtracts DE and the carry flag.', 'Clear the carry first so that a leftover carry does not take one extra away. It may be set when your program starts.'],
      'Clear the carry, then SBC.',
      `        ORG 0x8000
        OR A            ; clear carry
        SBC HL,DE       ; HL = HL - DE
        HALT`,
    ),
    tests: [
      { name: '1000 - 1 with a stray carry', setup: { registers: { HL: 1000, DE: 1, F: 1 } }, expect: { registers: { HL: 999 } } },
      { name: '0x1000 - 0x0001 with a stray carry', setup: { registers: { HL: 0x1000, DE: 1, F: 1 } }, expect: { registers: { HL: 0x0fff } } },
      { name: '5 - 5', setup: { registers: { HL: 5, DE: 5 } }, expect: { registers: { HL: 0 } } },
    ],
  },
]
