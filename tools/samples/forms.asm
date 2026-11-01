; One of nearly every instruction form the assembler supports.
        ORG 0x8000
        NOP
        LD A,B
        LD A,(HL)
        LD (HL),C
        LD (HL),0x5A
        LD D,200
        LD BC,0x1234
        LD DE,label
        LD HL,label
        LD SP,0xF000
        LD SP,HL
        LD A,(BC)
        LD A,(DE)
        LD (BC),A
        LD (DE),A
        LD A,(0x9000)
        LD (0x9000),A
        LD HL,(0x9000)
        LD (0x9000),HL
        INC A
        INC (HL)
        DEC B
        INC BC
        DEC SP
        ADD A,B
        ADD A,(HL)
        ADD A,5
        ADC A,C
        SUB D
        SUB 3
        SBC A,E
        AND 0x0F
        XOR A
        OR (HL)
        CP 10
        CP B
        ADD HL,BC
        ADD HL,SP
        RLCA
        RRCA
        RLA
        RRA
        CPL
        SCF
        CCF
        NEG
        RLC B
        RRC (HL)
        RL C
        RR D
        SLA E
        SRA H
        SLL L
        SRL A
        BIT 0,A
        BIT 7,(HL)
        RES 3,B
        SET 5,(HL)
label:  JP label
        JP NZ,label
        JP PE,label
        JP (HL)
        JR label
        JR NZ,label
        JR C,label
        DJNZ label
        CALL label
        CALL Z,label
        RET
        RET NC
        RET M
        PUSH BC
        PUSH AF
        POP HL
        POP AF
        RST 0x38
        RST 8
        OUT (0),A
        IN A,(1)
        EX DE,HL
        LDIR
        LDDR
        HALT
        DB 1,2,"text",0,'x',-1,255
        DW 0x1234,label,-1
        DS 3,0xAA
