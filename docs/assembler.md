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
- One instruction per line. Indented lines need a colon on any label. An un-indented word that is not an instruction is read as a label, except that the name of an unsupported instruction on its own (`INI`, `DI`, `RETI`...) is an error so it is never silently ignored; `ini EQU 5` or `ini: NOP` is still a label.
- Labels cannot be named like a register or condition: `A B C D E H L AF BC DE HL SP IX IY NZ Z NC PO PE P M`.
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
| Load | `LD r,r'` `LD r,n` `LD r,(HL)` `LD (HL),r` `LD (HL),n` `LD rr,nn` `LD SP,HL` `LD A,(BC)` `LD A,(DE)` `LD (BC),A` `LD (DE),A` `LD A,(nn)` `LD (nn),A` `LD HL,(nn)` `LD (nn),HL` `LD (nn),BC/DE/SP` `LD BC/DE/SP,(nn)` |
| Stack | `PUSH` / `POP` with `BC DE HL AF` |
| Exchange | `EX DE,HL` `EX AF,AF'` `EXX` `EX (SP),HL` `EX (SP),IX` `EX (SP),IY` |
| 8-bit arithmetic and logic | `ADD ADC SUB SBC AND XOR OR CP` with `r`, `n` or `(HL)`; `ADD A,x` and the short form `SUB x` both work |
| 16-bit arithmetic | `ADD HL,rr` `ADC HL,rr` `SBC HL,rr` `INC rr` `DEC rr` (`rr` = `BC DE HL SP`) |
| Increment | `INC r` `DEC r` including `(HL)` |
| Accumulator | `RLCA RRCA RLA RRA CPL NEG SCF CCF DAA` |
| Rotate and shift | `RLC RRC RL RR SLA SRA SLL SRL` on `r` or `(HL)` |
| Bits | `BIT b,r` `SET b,r` `RES b,r` |
| Jumps | `JP nn` `JP cc,nn` `JP (HL)` `JR e` `JR cc,e` (cc = `NZ Z NC C`) `DJNZ e` |
| Calls | `CALL nn` `CALL cc,nn` `RET` `RET cc` `RST n` (n = 0, 8, ... 56) |
| Block and search | `LDI` `LDD` `LDIR` `LDDR` `CPI` `CPD` `CPIR` `CPDR` |
| Index registers | `IX` and `IY` with `(IX+d)` offsets (-128..127): `LD IX,nn` `LD IX,(nn)` `LD (nn),IX` `LD SP,IX` `INC IX` `DEC IX` `ADD IX,rr` (`rr` = `BC DE SP IX`) `PUSH IX` `POP IX` `JP (IX)`, and on `(IX+d)`: `LD r,(IX+d)` `LD (IX+d),r` `LD (IX+d),n` `INC` `DEC` the ALU group `ADD ADC SUB SBC AND XOR OR CP` the shifts `RLC RRC RL RR SLA SRA SLL SRL` and `BIT SET RES`. `IY` works the same way. |
| I/O | `OUT (n),A` `OUT (C),r` (see below) |
| Other | `NOP` `HALT` |

`r` is `A B C D E H L` (or `(HL)` where noted); `cc` for `JP`, `CALL` and `RET` is `NZ Z NC C PO PE P M`.

## Not supported (clear errors)

`LD A,I/R`, the other block I/O instructions (`INI`, `INIR`, `OTIR` and friends), `RLD`, `RRD`, `DI`, `EI`, `IM`, `RETI`, `RETN`, `IN r,(C)`, and the undocumented halves of the index registers (`IXH`, `IXL`, `IYH`, `IYL`). There are no interrupts. `IN A,(n)` assembles but stops the program when it runs, because the console is output-only.

## Running a program

- The machine has 64 KB of RAM. The stack pointer starts at `0xF000`. All registers start at 0 unless a challenge sets them.
- A program ends at `HALT`. After 200,000 instructions it is stopped with "Program did not finish".
- Screen output uses real ZX Spectrum ROM routines, the same ones the reference book uses. The emulator stands in for them (there is no ROM), so code at the addresses below is never run:
  - `CALL 0x1601` (CHAN-OPEN) opens the channel numbered in A. Only channel 2, the main screen, is supported. Every program that prints starts with `LD A,2` / `CALL 0x1601`. The emulator leaves all registers alone, because the trainer preloads a task's inputs before the program runs. On a real Spectrum, call it before loading your own values.
  - `RST 0x10` (PRINT-A-1) prints the character in A. Code 13 is a newline. Characters 32 to 126 print as themselves and other codes print `?`, because colour and cursor control codes are not emulated.
  - `CALL 0x2D2B` (STACK-BC) hands the number in BC to the ROM, then `CALL 0x2DE3` (PRINT-FP) prints it as decimal digits, 0 to 65535. The real routines use the registers freely, so the emulator zeroes BC and HL afterwards (A and the flags are left alone, but reload A rather than relying on it).
  - Output appears on a 40x12 text screen in the results pane and is capped at 20,000 characters.
- `OUT (n),A` is accepted for port 0xFE (border and speaker), which has no visible effect. Any other port stops the program with an error, because the Spectrum has no console port.
- Flags S, Z, H, P/V, N and C follow a real Z80 (checked against the Python `z80` package). The undocumented bits 3 and 5 are not modelled.

## Cheat sheet

The in-app **Cheat sheet** page (`src/data/cheatsheet.js`) lists the supported instructions and common patterns. When the supported instruction set changes, update it too; `npm test` assembles and runs every example on it.
