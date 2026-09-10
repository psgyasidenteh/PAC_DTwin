# Process Engineering & Digital Twin Development Rules

1. **Dual-Twin Entity Invariant:** Every unit operation in the digital twin must maintain a distinct separation between physical asset parameters (Equipment Digital Twin) and chemical stream transformations (Product-in-Process Digital Twin).
2. **ISA-5.1 Tagging & Control Standards:** All interactive control loops, transmitters, and valves must conform strictly to ISA-5.1 naming standards (e.g., `TIC`, `PIC`, `LIC`, `FIC`, `FFIC`, `DIC`, `AIT`, `PDIC`). Alarm thresholds must comply with ISA-18.2 priority bands (Normal, Low, High, High-High/Trip).
3. **Mass & Energy Balance Conservation:** Any surrogate, client-side differential solver, or WebAssembly kinetic model must satisfy steady-state nodal mass balance closure within $\pm 0.25\%$ of rigorous Aspen Plus benchmarks.
4. **Encoding & Extraction Hygiene on Windows:** Python scripts and data parsers handling engineering documentation, formulas, or streams on Windows must enforce UTF-8 character encoding and extract Office Math ML (`<m:oMath>`) nodes from Word tables.
