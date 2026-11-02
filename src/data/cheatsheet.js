// Content for the Cheat sheet page. Every instruction listed here is supported by the
// built-in assembler (docs/assembler.md), and every example is assembled and run by
// src/data/cheatsheet.test.js, so the page cannot drift from what the trainer accepts.

export const REGISTERS = [
  ['A', 'Accumulator. Most arithmetic and logic works on A.'],
  ['B C D E H L', '8-bit general registers.'],
  ['BC DE HL', 'The same registers as 16-bit pairs. HL is the usual memory pointer.'],
  ['AF', 'A plus the flags. Only used with PUSH and POP.'],
  ['IX IY', '16-bit index registers. (IX+d) is the byte d bytes past the address in IX (d from -128 to 127).'],
  ["AF' BC' DE' HL'", 'A shadow copy of the registers, swapped in with EX AF,AF\' and EXX.'],
  ['SP', 'Stack pointer (starts at 0xF000).'],
  ['(HL)', 'The byte in memory at the address held in HL.'],
]

export const FLAGS = [
  ['Z', 'Zero. Set when the result was 0 (or a CP found the values equal).'],
  ['C', 'Carry. Set on unsigned overflow or borrow (after CP: A < operand).'],
  ['S', 'Sign. Copy of bit 7 of the result (negative when treated as signed).'],
  ['P/V', 'Parity (even number of 1 bits) or signed overflow, depending on the instruction.'],
  ['H, N', 'Half-carry and subtract. Internal; you will rarely test them.'],
]

export const CONDITIONS = [
  ['NZ / Z', 'Zero flag clear / set.'],
  ['NC / C', 'Carry flag clear / set.'],
  ['PO / PE', 'Parity odd / even (JP, CALL, RET only).'],
  ['P / M', 'Result positive / negative (JP, CALL, RET only).'],
]

// Each group: title, intro, rows of [instruction, meaning].
export const MNEMONICS = [
  {
    title: 'Load and store',
    rows: [
      ['LD r,r\'', 'Copy one register into another.'],
      ['LD r,n', 'Load a constant into a register.'],
      ['LD rr,nn', 'Load a 16-bit constant or address into BC, DE, HL or SP.'],
      ['LD r,(HL)', 'Read the byte at the address in HL.'],
      ['LD (HL),r / LD (HL),n', 'Write a register or constant to the address in HL.'],
      ['LD A,(BC) / LD A,(DE)', 'Read the byte at the address in BC or DE into A.'],
      ['LD (BC),A / LD (DE),A', 'Write A to the address in BC or DE.'],
      ['LD A,(nn) / LD (nn),A', 'Read or write A at a fixed address or label.'],
      ['LD HL,(nn) / LD (nn),HL', 'Read or write a 16-bit value (low byte first) at a fixed address.'],
      ['LD SP,HL', 'Point the stack at the address in HL.'],
      ['EX DE,HL', 'Swap the contents of DE and HL.'],
      ['LD (nn),rr / LD rr,(nn)', 'Store or load BC, DE or SP at a fixed address (little-endian).'],
      ['LD r,(IX+d) / LD (IX+d),r / LD (IX+d),n', 'Read or write the byte d past the address in IX (or IY).'],
      ['LD IX,nn / LD IX,(nn) / LD (nn),IX', 'Load or store an index register.'],
      ["EX AF,AF' / EXX", 'Swap A and the flags, or BC DE HL, with their shadow copies in one instruction.'],
      ['EX (SP),HL', 'Swap HL with the 16-bit value on top of the stack.'],
    ],
  },
  {
    title: 'Stack',
    rows: [
      ['PUSH rr', 'Save BC, DE, HL, AF, IX or IY on the stack.'],
      ['POP rr', 'Restore BC, DE, HL, AF, IX or IY from the stack (last in, first out).'],
    ],
  },
  {
    title: '8-bit arithmetic',
    rows: [
      ['ADD A,x', 'A = A + x. x is a register, a constant or (HL).'],
      ['ADC A,x', 'A = A + x + carry. Chains additions across bytes.'],
      ['SUB x', 'A = A - x.'],
      ['SBC A,x', 'A = A - x - carry.'],
      ['CP x', 'Compare: do A - x, set flags, throw the result away. A is unchanged.'],
      ['INC r / DEC r', 'Add or subtract 1 (also on (HL)). Carry is not affected.'],
      ['NEG', 'A = 0 - A (two\'s complement negate).'],
      ['ADC HL,rr / SBC HL,rr', '16-bit add / subtract including the carry flag. Chains 16-bit values into 32 bits.'],
      ['DAA', 'Fix A after adding or subtracting two BCD (one digit per nibble) numbers.'],
      ['ADD IX,rr / INC IX / DEC IX', 'Index register maths: rr is BC, DE, SP or IX itself.'],
      ['INC (IX+d) / ADD A,(IX+d) ...', 'INC, DEC and the whole ADD..CP group also work on (IX+d).'],
    ],
  },
  {
    title: '16-bit arithmetic',
    rows: [
      ['ADD HL,rr', 'HL = HL + BC, DE, HL or SP.'],
      ['INC rr / DEC rr', 'Add or subtract 1. Flags are not affected, so test BC with LD A,B then OR C.'],
    ],
  },
  {
    title: 'Logic and bits',
    rows: [
      ['AND x / OR x / XOR x', 'Bitwise AND, OR, exclusive OR with A. XOR A clears A; OR A tests A for zero.'],
      ['CPL', 'Flip every bit of A.'],
      ['SCF / CCF', 'Set carry / flip carry.'],
      ['BIT b,r', 'Test bit b (0-7). Z is set when the bit is 0.'],
      ['SET b,r / RES b,r', 'Set the bit to 1 / clear it to 0.'],
    ],
  },
  {
    title: 'Shifts and rotates',
    rows: [
      ['SLA r', 'Shift left, 0 enters on the right. Multiplies by 2.'],
      ['SRL r', 'Shift right, 0 enters on the left. Unsigned divide by 2.'],
      ['SRA r', 'Shift right keeping the sign bit. Signed divide by 2.'],
      ['RL r / RR r', 'Rotate left / right through the carry flag.'],
      ['RLC r / RRC r', 'Rotate left / right; the bit that falls off also goes into carry.'],
      ['RLA RRA RLCA RRCA', 'Short, faster versions of the above for A.'],
    ],
  },
  {
    title: 'Jumps, calls and loops',
    rows: [
      ['JP nn / JP cc,nn', 'Jump to an address, optionally if a condition holds. Reaches anywhere.'],
      ['JP (HL) / JP (IX)', 'Jump to the address held in HL (or IX / IY).'],
      ['JR e / JR cc,e', 'Relative jump, within about 128 bytes. cc is NZ, Z, NC or C only. Smaller than JP.'],
      ['DJNZ e', 'Decrement B; jump if B is not zero. The built-in counted loop.'],
      ['CALL nn / CALL cc,nn', 'Call a subroutine (pushes the return address).'],
      ['RET / RET cc', 'Return from a subroutine, optionally if a condition holds.'],
      ['RST n', 'One-byte call to address 0, 8, 16 ... 56.'],
    ],
  },
  {
    title: 'Block and I/O',
    rows: [
      ['LDIR', 'Copy BC bytes from (HL) to (DE), moving forward. Leaves BC = 0.'],
      ['LDDR', 'Same, but moving backward (start HL and DE at the last byte).'],
      ['LDI / LDD', 'Copy a single byte and step HL, DE forward / backward; BC counts down. Loop them yourself to do extra work per byte.'],
      ['CPIR / CPDR', 'Search forward / backward from HL for the value in A, for at most BC bytes. Z is set if it was found (HL is just past it).'],
      ['CPI / CPD', 'One step of that search: compare A with (HL), step HL, count BC down.'],
      ['OUT (C),r', 'Write r to the port number held in C.'],
      ['OUT (n),A', 'Write A to port n. Here: 0 = character, 1 = number, 2 = newline.'],
      ['NOP / HALT', 'Do nothing / stop the program. Always end with HALT.'],
    ],
  },
  {
    title: 'Assembler directives',
    rows: [
      ['ORG n', 'Set the address for the code that follows (default 0x8000).'],
      ['label EQU expr', 'Name a constant.'],
      ['DB / DW', 'Store bytes (including "text") / 16-bit words.'],
      ['DS n[,fill]', 'Reserve n bytes, filled with 0 unless told otherwise.'],
    ],
  },
]

// Each paradigm: id, title, blurb, code. Programs are complete and end in HALT.
export const PARADIGMS = [
  {
    id: 'counted-loop',
    title: 'Counted loop with DJNZ',
    blurb: 'Put the repeat count in B. DJNZ subtracts 1 and loops while B is not zero, so the body runs exactly B times (B counts down 5, 4, 3, 2, 1).',
    code: `        LD B,5          ; repeat 5 times
loop:   LD A,B
        OUT (1),A       ; body: print the counter
        DJNZ loop       ; B = B - 1, jump if B != 0
        HALT`,
  },
  {
    id: 'count-up',
    title: 'Counting up to a limit',
    blurb: 'Use INC with CP and a conditional jump when you need the counter to go upwards or to stop at a value other than zero.',
    code: `        LD C,1          ; counter starts at 1
loop:   LD A,C
        OUT (1),A
        INC C
        LD A,C
        CP 6            ; reached 6?
        JR NZ,loop      ; no: go round again
        HALT`,
  },
  {
    id: 'while',
    title: 'While loop (test first)',
    blurb: 'Test at the top so the body may run zero times. OR A sets Z when A is 0 without changing A.',
    code: `        LD A,20
        LD B,0          ; B counts the halvings
while:  OR A            ; is A zero?
        JR Z,done       ; yes: leave the loop
        SRL A           ; A = A / 2
        INC B
        JR while
done:   LD A,B
        OUT (1),A       ; prints 5
        HALT`,
  },
  {
    id: 'nested',
    title: 'Nested loops',
    blurb: 'Use a different register for each loop. DJNZ owns B, so give the outer loop C (or another register).',
    code: `        LD C,3          ; 3 rows
outer:  LD B,4          ; 4 stars per row
inner:  LD A,'*'
        OUT (0),A
        DJNZ inner
        OUT (2),A       ; newline
        DEC C
        JR NZ,outer
        HALT`,
  },
  {
    id: 'loop-16',
    title: '16-bit loop counter',
    blurb: 'DEC BC does not set the flags, so test whether BC is zero by OR-ing its two halves together.',
    code: `        LD BC,300       ; loop 300 times
        LD HL,0
loop:   INC HL          ; body
        DEC BC
        LD A,B
        OR C            ; Z only if B and C are both 0
        JR NZ,loop
        HALT            ; HL = 300`,
  },
  {
    id: 'if-else',
    title: 'If / else',
    blurb: 'CP sets the flags, then branch. Z means equal; C means A is less than the operand (unsigned); NC means greater or equal. Jump over the branch you do not want.',
    code: `        LD A,7
        CP 10           ; compare A with 10
        JR C,less       ; carry set: A < 10
        LD A,'H'        ; else branch: A >= 10
        JR show
less:   LD A,'L'        ; then branch: A < 10
show:   OUT (0),A       ; prints L
        HALT`,
  },
  {
    id: 'equal',
    title: 'Test for equal / zero',
    blurb: 'Z is set when two values are equal. To test a register against zero use OR A (or AND A); there is no need for CP 0.',
    code: `        LD A,5
        CP 5
        JR NZ,skip      ; skip the next line unless equal
        LD A,'='
        OUT (0),A
skip:   HALT`,
  },
  {
    id: 'max',
    title: 'Maximum of two values',
    blurb: 'CP B computes A - B. If there is no carry, A >= B, so keep A; otherwise copy B in.',
    code: `        LD A,5
        LD B,9
        CP B
        JR NC,keep      ; A >= B: A is already the max
        LD A,B
keep:   OUT (1),A       ; prints 9
        HALT`,
  },
  {
    id: 'bit-test',
    title: 'Testing a bit',
    blurb: 'BIT sets Z when the tested bit is 0. Handy for flags, parity (bit 0) and sign (bit 7).',
    code: `        LD A,0b00000100
        BIT 2,A         ; is bit 2 set?
        JR Z,clear
        LD A,'1'
        JR show
clear:  LD A,'0'
show:   OUT (0),A       ; prints 1
        HALT`,
  },
  {
    id: 'array',
    title: 'Looping over an array',
    blurb: 'HL points at the data, B holds the length. Read with (HL), step with INC HL, and let DJNZ end the loop.',
    code: `        LD HL,data
        LD B,4          ; number of elements
        XOR A           ; A = 0, the running total
sum:    ADD A,(HL)
        INC HL
        DJNZ sum
        OUT (1),A       ; prints 10
        HALT
data:   DB 1,2,3,4`,
  },
  {
    id: 'string',
    title: 'Printing a zero-terminated string',
    blurb: 'End the text with a 0 byte and loop until you read it. This is the usual way to handle strings.',
    code: `        LD HL,msg
print:  LD A,(HL)
        OR A            ; reached the 0 terminator?
        JR Z,done
        OUT (0),A
        INC HL
        JR print
done:   HALT
msg:    DB "Hello",0`,
  },
  {
    id: 'subroutine',
    title: 'Subroutines',
    blurb: 'CALL pushes the return address and jumps; RET pops it. Pass values in registers. Do not leave extra PUSHes on the stack when you RET.',
    code: `        LD A,3
        CALL double
        OUT (1),A       ; prints 6
        HALT

double: ADD A,A         ; A = A * 2
        RET`,
  },
  {
    id: 'stack',
    title: 'Saving registers with the stack',
    blurb: 'PUSH before you reuse a register and POP afterwards, in the reverse order.',
    code: `        LD BC,0x0509
        PUSH BC         ; save BC
        LD BC,0         ; free to use BC for something else
        POP BC          ; BC is 0x0509 again
        HALT`,
  },
  {
    id: 'search',
    title: 'Searching a block with CPIR',
    blurb: 'Put the value in A, the start in HL and the maximum length in BC. CPIR stops at the first match (Z set, HL just past it) or when BC reaches 0.',
    code: `        LD HL,data
        LD BC,5         ; look at up to 5 bytes
        LD A,30
        CPIR
        JR NZ,missing   ; no match
        LD A,'Y'
        JR show
missing: LD A,'N'
show:   OUT (0),A       ; prints Y
        HALT
data:   DB 10,20,30,40,50`,
  },
  {
    id: 'record',
    title: 'Records with IX',
    blurb: 'Point IX at the start of a record and give each field a named offset with EQU. (IX+d) then reads a field without moving the pointer.',
    code: `AGE     EQU 0
SCORE   EQU 1
        LD IX,player
        LD A,(IX+SCORE)
        ADD A,5
        LD (IX+SCORE),A ; score = 15
        LD A,(IX+SCORE)
        OUT (1),A       ; prints 15
        HALT
player: DB 30,10        ; age, score`,
  },
  {
    id: 'bcd',
    title: 'Decimal (BCD) addition',
    blurb: 'Store one decimal digit per nibble (0x19 means nineteen). ADD followed by DAA keeps the answer in BCD.',
    code: `        LD A,0x19
        ADD A,0x28      ; binary result 0x41
        DAA             ; corrected to 0x47
        HALT            ; A = 0x47`,
  },
  {
    id: 'copy',
    title: 'Copying memory with LDIR',
    blurb: 'Set HL = source, DE = destination, BC = byte count, then LDIR does the whole copy.',
    code: `        LD HL,src
        LD DE,dst
        LD BC,3
        LDIR            ; copy 3 bytes
        LD A,(dst)
        OUT (0),A       ; prints H
        HALT
src:    DB "Hi!"
dst:    DS 3`,
  },
  {
    id: 'multiply',
    title: 'Multiplying',
    blurb: 'There is no multiply instruction. Use repeated addition for any factor, or shifts for powers of two.',
    code: `        LD A,0          ; 6 * 7 by repeated addition
        LD B,7
add:    ADD A,6
        DJNZ add
        OUT (1),A       ; prints 42
        SLA A           ; shift left = times 2
        OUT (1),A       ; prints 84
        HALT`,
  },
]
