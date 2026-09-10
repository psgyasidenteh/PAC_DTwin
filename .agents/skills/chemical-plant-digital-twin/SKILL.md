---
name: chemical-plant-digital-twin
description: Architecture, modeling, and implementation workflows for industrial chemical process digital twins. Covers the IIC Dual-Twin (Equipment + Product PiP) paradigm, DEXPI P&ID graph ingestion, first-principles kinetics (shrinking core, CSTR, rotary kiln), soft sensors, and zero-cost online hosting on GitHub Pages.
---

# Chemical Plant Digital Twin Engineering Skill

## 1. Architectural Foundation & Framework Synthesis
When designing or implementing an industrial chemical/process digital twin:
1. **Synthesize Top-Down Operations with Bottom-Up Topology:**
   - Use the **Industrial Internet Reference Architecture (IIRA / Lin et al., IIC 2021)** for platform layering: 
     - **IoT Framework:** Edge Gateways (OPC UA / MQTT / MODBUS), data collection, preprocessing, and streaming.
     - **Digital Twin Framework:** Standard APIs, analytical models, and relational data mappings.
     - **Application Framework:** DevOps, CI/CD, web data visualization, and quality optimization.
   - Use **DEXPI / ISO 15926 (Azangoo et al., IEEE 2022)** for ingesting P&ID and PFD topology as a **Directed Acyclic Graph (DAG)** where nodes represent unit operations and edges represent piping streams and signal lines.

2. **Enforce the Dual-Twin Paradigm:**
   - **Equipment Digital Twins (EDTs):** Model physical machinery integrity, power draw, mechanical vibrations, refractory lining thermal gradients, pump cavitation indices ($NPSHa$), and filter fabric resistance.
   - **Product-in-Process (PiP) Digital Twins:** Model material streams traversing the equipment train. Track mass/energy balances, conversion extents, reaction kinetics, speciation (e.g., $Al_{13}$ Keggin polycations), basicity index ($B\%$), and quality pedigree.

---

## 2. In-Browser & Online Web Implementation (Zero-Server Cost)
- **Deployment Platform:** GitHub Pages (static Single Page Application compiled via Vite + React 19 + TypeScript).
- **Client-Side Physics Solver:** Execute heavy differential equations (Heterogeneous Shrinking Core Model, CSTR RTD, Rotary Kiln 1D BVP, Darcy cake filtration) in **Web Workers** or **WebAssembly (WASM)**. This maintains a steady 60 FPS user interface without requiring dedicated cloud server instances.
- **Dynamic Vector Flowsheet Engine:** Use dynamic Scalable Vector Graphics (SVG) with hardware-accelerated pan-zoom, animated flow velocities tied to mass flow rates, and interactive ISA-5.1 instrument bubbles.

---

## 3. Engineering Document Ingestion Standards (Python on Windows)
When analyzing chemical plant design packages and CAD drawings on Windows:
1. **OMML Math Formula Extraction in Word (`.docx`):**
   - In technical engineering reports, chemical formulas (e.g., $Al(OH)_3$, $Fe_2O_3$, $SiO_2$, $AlCl_3$) and algebraic expressions are encoded as Office Math Markup Language (`<m:oMath>`).
   - Standard `paragraph.text` and `cell.text` in `python-docx` return empty strings.
   - **Rule:** Always inspect `<w:tc>` elements and pull text from `<m:t>` nodes under `<m:oMath>`.

2. **Windows Terminal Character Encoding (UTF-8):**
   - The default Windows console encoding (`cp1252`) fails with `UnicodeEncodeError` on chemical subscripts ($\text{Al}_2\text{O}_3$), Greek letters ($\mu\text{m}$, $\Delta H$), or typographic ligatures.
   - **Rule:** Always include `sys.stdout.reconfigure(encoding='utf-8')` at the beginning of Python analysis scripts.

3. **Vectorized CAD and Literature PDFs:**
   - When technical drawings or papers convert text to vector drawing paths (`fonts=0`), text extractors (`page.get_text()`) return empty strings.
   - **Rule:** Detect `len(fonts) == 0` and fall back to rendering high-DPI pixmaps via PyMuPDF (`page.get_pixmap(dpi=150)`) for visual diagram inspection and OCR.
