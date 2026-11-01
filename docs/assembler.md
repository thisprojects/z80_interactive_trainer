# Assembler and emulator reference

The trainer assembles your code in the browser (`src/z80/assembler.js`) and runs it on a built-in Z80 core (`src/z80/cpu.js`). Output is real Z80 machine code; the test suite compares it byte-for-byte with `pasmo` (`npm run check:assembler`).

## Source format

```
        ORG 0x8000          ; comments start with a semicolon
start:  LD A,5              ; a label ends with ':' (the colon is optional in column 0)
        ADD A,B
        JR NZ,start
        HALT
msg:    DB "Hi",0
```

- Mnemonics, registers, labels and directives are not case-sensitive.
- One instruction per line. Indented lines need a colon on any label. An un-indented word that is not an instruction is read as a label, except that the name of an unsupported instruction on its own (`LDI`, `DI`, `EXX`...) is an error so it is never silently ignored; `ldi EQU 5` or `ldi: NOP` is still a label.
- Labels cannot be named like a register or condition: `A B C D E H L AF BC DE HL SP NZ Z NC PO PE P M`.
- A label can only be defined once. `EQU` constants share the same namespace.

## Numbers, characters and expressions

| Form | Examples |
| --- | --- |
| Decimal | `42` |
| Hexadecimal | `0x2A`, `$2A`, `2Ah` (a leading digit is required: `0FFh`) |
| Binary | `0b101010`, `%101010` |
| Character | `'A'`, `"A"` (one character; escapes `\n \r \t \0 \\ \' \"`) |
| Current address | `$` |

Operators, lowest to highest precedence: `|`, `^`, `&`, `<<` `>>`, `+` `-`, `*` `/`, then unary `- + ~` and parentheses. Division truncates. Shift counts must be 0-31 and dividing by zero is an error. There is no modulo operator (`%` introduces a binary number).

An operand that is wholly in parentheses is a memory address: `LD A,(0x9000)` reads memory, but `LD A,(1+2)*3` is the number 9.

## Directives

| Directive | Meaning |
| --- | --- |
| `ORG n` | Set the address of the following bytes (0-65535). The default is `0x8000`. |
| `label EQU expr` | Define a constant. Resolved immediately when possible. |
| `DB a,b,...` / `DEFB` | Bytes (-128..255) and `"strings"`. |
| `DW a,b,...` / `DEFW` | 16-bit words (-32768..65535), stored little-endian. |
| `DS n[,fill]` / `DEFS` | `n` bytes (0-65536) of `fill` (default 0). |
| `END [label]` | Set the start address explicitly. |

Rules worth knowing:
- The program starts at its **first instruction**, not at data that comes before it. `END label` overrides this.
- Blocks that overlap in memory (for example two `ORG` ranges) are an error, as is running past address 65535.
- `DS` and `ORG` need their value straight away, so they can use an `EQU` only if it was defined earlier and does not depend on a later definition (the error message says so). `BIT` and `RST` accept constants defined later.
- Relative jumps (`JR`, `DJNZ`) must reach their target within -128..127 bytes.

## Supported instructions

| Group | Forms |
| --- | --- |
| Load | `LD r,r'` `LD r,n` `LD r,(HL)` `LD (HL),r` `LD (HL),n` `LD rr,nn` `LD SP,HL` `LD A,(BC)` `LD A,(DE)` `LD (BC),A` `LD (DE),A` `LD A,(nn)` `LD (nn),A` `LD HL,(nn)` `LD (nn),HL` |
| Stack | `PUSH` / `POP` with `BC DE HL AF` |
| Exchange | `EX DE,HL` |
| 8-bit arithmetic and logic | `ADD ADC SUB SBC AND XOR OR CP` with `r`, `n` or `(HL)`; `ADD A,x` and the short form `SUB x` both work |
| 16-bit arithmetic | `ADD HL,rr` `INC rr` `DEC rr` (`rr` = `BC DE HL SP`) |
| Increment | `INC r` `DEC r` including `(HL)` |
| Accumulator | `RLCA RRCA RLA RRA CPL NEG SCF CCF` |
| Rotate and shift | `RLC RRC RL RR SLA SRA SLL SRL` on `r` or `(HL)` |
| Bits | `BIT b,r` `SET b,r` `RES b,r` |
| Jumps | `JP nn` `JP cc,nn` `JP (HL)` `JR e` `JR cc,e` (cc = `NZ Z NC C`) `DJNZ e` |
| Calls | `CALL nn` `CALL cc,nn` `RET` `RET cc` `RST n` (n = 0, 8, ... 56) |
| Block | `LDIR` `LDDR` |
| I/O | `OUT (n),A` (see below) |
| Other | `NOP` `HALT` |

`r` is `A B C D E H L` (or `(HL)` where noted); `cc` for `JP`, `CALL` and `RET` is `NZ Z NC C PO PE P M`.

## Not supported (clear errors)

`DAA`, `EXX`, `EX AF,AF'`, `EX (SP),HL`, the IX/IY registers, `ADC HL,rr`, `SBC HL,rr`, `LD (nn),BC/DE/SP`, `LD A,I/R`, `LDI`, `LDD`, `CPI`, `CPD`, `CPIR`, `CPDR`, the other block I/O instructions, `RLD`, `RRD`, `DI`, `EI`, `IM`, `RETI`, `RETN`, `OUT (C),r` and `IN r,(C)`. There are no interrupts. `IN A,(n)` assembles but stops the program when it runs, because the console is output-only.

## Running a program

- The machine has 64 KB of RAM. The stack pointer starts at `0xF000`. All registers start at 0 unless a challenge sets them.
- A program ends at `HALT`. After 200,000 instructions it is stopped with "Program did not finish".
- Console ports: `OUT (0),A` prints a character, `OUT (1),A` prints A as a decimal number, `OUT (2),A` prints a newline. `RST 0x10` also prints A. Any other port stops the program with an error. Output is capped at 20,000 characters.
- Flags S, Z, H, P/V, N and C follow a real Z80 (checked against the Python `z80` package). The undocumented bits 3 and 5 are not modelled.
