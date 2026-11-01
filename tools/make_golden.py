"""Regenerate src/z80/cpu.golden.json: boundary-value CPU results taken from the reference `z80` package.

    pip install -r tools/requirements.txt
    python -I tools/make_golden.py

The unit tests (`npm test`) replay these cases, so CPU flag regressions are caught without Python.
Each case: [name, code bytes, initial A, initial F, initial B, expected A, expected F, expected B].
"""
import json
from pathlib import Path
import z80

VALS = [0x00, 0x01, 0x0F, 0x10, 0x7F, 0x80, 0xFF]   # edges: nibble carry, sign, wrap
FLAGS = [0x00, 0xFF]                                 # carry clear/no flags, and carry set/every flag set
ALU = ['ADD', 'ADC', 'SUB', 'SBC', 'AND', 'XOR', 'OR', 'CP']
SHIFTS = ['RLC', 'RRC', 'RL', 'RR', 'SLA', 'SRA', 'SLL', 'SRL']
cases = []

def run(code, a, f, b):
    m = z80.Z80Machine()
    m.set_memory_block(0x8000, bytes(code + [0x76]))
    m.a, m.f, m.b, m.sp, m.pc = a, f, b, 0xF000, 0x8000
    m.ticks_to_stop = 10000
    m.run()
    return m.a, m.f, m.b

def add(name, code, a, f, b):
    ra, rf, rb = run(code, a, f, b)
    cases.append([name, code, a, f, b, ra, rf, rb])

for i, op in enumerate(ALU):
    for a in VALS:
        for v in VALS:
            for f in FLAGS:
                add(f'{op} A,B a={a:02X} b={v:02X} f={f:02X}', [0x80 | i << 3 | 0], a, f, v)
for v in VALS:
    for f in FLAGS:
        add(f'INC B b={v:02X} f={f:02X}', [0x04], 0, f, v)
        add(f'DEC B b={v:02X} f={f:02X}', [0x05], 0, f, v)
        add(f'NEG a={v:02X} f={f:02X}', [0xED, 0x44], v, f, 0)
        for k, nm in enumerate(SHIFTS):
            add(f'{nm} B b={v:02X} f={f:02X}', [0xCB, k << 3], 0, f, v)
        for bit in range(8):
            add(f'BIT {bit},B b={v:02X} f={f:02X}', [0xCB, 0x40 | bit << 3], 0, f, v)

out = Path(__file__).resolve().parent.parent / 'src' / 'z80' / 'cpu.golden.json'
out.write_text(json.dumps(cases, separators=(',', ':')))
print(f'{len(cases)} golden cases written to {out} ({out.stat().st_size // 1024} KB)')
