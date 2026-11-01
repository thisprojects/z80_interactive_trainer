; Directives, constants and expressions. Only forms pasmo also accepts (0b numbers, ^, escapes in single quotes and a
; leading parenthesis are ours alone and are covered by the unit tests instead).
SIZE    EQU 4
BASE    EQU 0x8000
FLAG    EQU 3
        ORG BASE
        DS SIZE,0xAA
        LD A,SIZE*2+1
        LD B,1+(2-1)
        LD C,~1 & 0xFF
        LD A,0FFh
        LD A,$7F
        LD A,%1010
        LD A,1<<3
        LD A,0x80>>2
        LD A,5|2
        LD HL,$+3
        BIT FLAG,A
        SET FLAG,B
        RES FLAG,(HL)
here    EQU $
        LD HL,here
        JR $+2
        NOP
        HALT
        DB "semi;colon",0
        DB 'a','b',"q\"q"
