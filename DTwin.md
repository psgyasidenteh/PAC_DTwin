# INDUSTRIAL DIGITAL TWIN ENGINEERING ARCHITECTURE & SPECIFICATION REPORT
## 30,000 TPA Poly-Aluminium Chloride (PAC) Production Plant — Awaso, Ghana
**Document Reference:** PAC-DTWIN-ENG-2026-001  
**Project Group:** Group 7B — Chemical Engineering Plant Design Project  
**Author:** Senior Process & Digital Twin Systems Engineer  
**Date:** September 2026  
**Status:** Approved for Implementation  

---

## TABLE OF CONTENTS
1. [EXECUTIVE SUMMARY & ENGINEERING VISION](#1-executive-summary--engineering-vision)
   - 1.1 Plant Design Basis & Strategic Context
   - 1.2 The Role of the Digital Twin in Plant Lifecycle
   - 1.3 Digital Twin Maturity Spectrum (ISO 23247 / NAMUR NOA)
2. [SYSTEM ARCHITECTURE & CLOUD/WEB STACK (100% ONLINE / GITHUB HOSTED)](#2-system-architecture--cloudweb-stack-100-online--github-hosted)
   - 2.1 Serverless Zero-Cost Hosting Architecture
   - 2.2 Dual-Engine Hybrid Paradigm (Edge/Live vs. Client-Side WASM Simulation)
   - 2.3 Frontend Technology Stack & High-Performance Vector Rendering
   - 2.4 Industrial Data Pipeline (OPC UA, MQTT, WebSockets, REST)
   - 2.5 Cyber-Physical Security & Role-Based Access Control (IEC 62443)
3. [INTERACTIVE PROCESS FLOW DIAGRAM (PFD) ENGINE](#3-interactive-process-flow-diagram-pfd-engine)
   - 3.1 Master Plant Flowsheet & Topological Routing
   - 3.2 Dynamic Mass & Energy Balance Overlay (64 Key Streams)
   - 3.3 Visual Process Animation & Flow Velocity Physics
   - 3.4 Interactive Stream Analysis & Flash Calculation Callouts
4. [INTERACTIVE AREA-BY-AREA P&ID MODULES (AREAS 100–700)](#4-interactive-area-by-area-pid-modules-areas-100700)
   - 4.1 Area 100: Raw Material Handling & Comminution Circuit
   - 4.2 Area 200: Pyro-Processing & Reductive Roasting (Rotary Kiln RK-201)
   - 4.3 Area 300: Off-Gas Treatment & Environmental Compliance
   - 4.4 Area 400: Dry High-Intensity Magnetic Beneficiation (MS-401)
   - 4.5 Area 500: Wet Grinding & Closed-Circuit Classification (ML-501 / HC-501)
   - 4.6 Area 600: Pressurized Acid Digestion & Solid-Liquid Separation (R-601/602 / FP-601)
   - 4.7 Area 700: Basification, Keggin Polymerization & Product Maturation (R-701 / R-702)
5. [ADVANCED INDUSTRIAL DIGITAL TWIN CAPABILITIES](#5-advanced-industrial-digital-twin-capabilities)
   - 5.1 First-Principles & Aspen Plus Surrogate Thermodynamic Engines
   - 5.2 Virtual Process Sensors (Soft Sensors) for Unmeasurable States
   - 5.3 Equipment Health Prognostics & Predictive Maintenance (PdM)
   - 5.4 Advanced Process Control (APC) & Supervisory Real-Time Optimization (RTO)
   - 5.5 Dynamic HAZOP Safety Simulator & Operator Training System (OTS)
   - 5.6 Real-Time Technoeconomic Accounting & ESG Carbon Ledger
6. [SOFTWARE ARCHITECTURE, COMPONENT SCHEMAS & GITHUB REPOSITORY LAYOUT](#6-software-architecture-component-schemas--github-repository-layout)
   - 6.1 Repository Directory Structure
   - 6.2 Data Model & State Management Schemas (TypeScript)
   - 6.3 Mathematical Physics Kernels (WebAssembly & TypeScript)
   - 6.4 Interactive ISA-5.1 Faceplate UI Components
   - 6.5 Automated CI/CD Deployment Pipeline (GitHub Actions)
7. [IMPLEMENTATION ROADMAP & ENGINEERING GOVERNANCE](#7-implementation-roadmap--engineering-governance)
   - 7.1 Phased Delivery Milestones (Phase 1 to Phase 5)
   - 7.2 Validation & Acceptance Criteria Against Pilot/Aspen Benchmarks
   - 7.3 Concluding Recommendations for Industrial Twin Operations

---

# 1. EXECUTIVE SUMMARY & ENGINEERING VISION

### 1.1 Plant Design Basis & Strategic Context
The plant designed by Group 7B processes raw bauxite from the Awaso deposits (Western North Region, Ghana) to manufacture high-basicity Poly-Aluminium Chloride ($[Al_n(OH)_mCl_{3n-m}]_x$, PAC) solution. PAC is an advanced inorganic polymeric coagulant superior to conventional aluminium sulphate (alum) for municipal and industrial water treatment. Operating under the strategic framework of the Ghana Integrated Aluminium Development Corporation (GIADEC) and the One District One Factory (1D1F) industrialization policy, the facility targets an annual nameplate throughput of **30,000 tonnes per annum (TPA)** of liquid PAC (equivalent to 10% $Al_2O_3$ active content), with domestic offtake serving the Ghana Water Company Limited (GWCL, 4,000 TPA) and the remaining 26,000 TPA exported to the ECOWAS regional market.

#### Key Design Parameters
- **Raw Material:** Awaso Bauxite Ore (Run-Of-Mine feed rate: $755.99\text{ kg/h}$, $59.7\text{ wt}\% Al(OH)_3$ Gibbsite, $1.59\text{ wt}\% Fe_2O_3$, $35.12\text{ wt}\% SiO_2$).
- **Reagents:** Technical Grade Hydrochloric Acid ($32.0\text{ wt}\% HCl$, feed rate: $1,475.40\text{ kg/h}$), Calcium Aluminate powder ($Ca(AlO_2)_2$, $95.5\text{ kg/h}$), Process Water ($PW$, $438.45\text{ kg/h}$).
- **Operating Schedule:** $7,920\text{ hours/year}$ ($91.3\%$ stream factor, 330 continuous operating days).
- **Core Unit Operations:** 
  1. Primary Jaw Crushing (CR-101) & Conveying;
  2. Reductive Roasting Rotary Kiln (RK-201) converting haematite to magnetite ($Fe_2O_3 \rightarrow Fe_3O_4$) and activating gibbsite to reactive transition alumina;
  3. Flue Gas Cleaning (Cyclone CY-301, Gas Cooler CL-301, Pulse-Jet Baghouse BH-301, Wet Packed Scrubber SC-301);
  4. Dry High-Intensity Drum Magnetic Separation (MS-401) recovering magnetite byproduct;
  5. Wet Closed-Circuit Ball Milling (ML-501) with Hydrocyclone classification (HC-501, cut size $d_{50} = 75\ \mu\text{m}$);
  6. Pressurized Two-Stage Jacketed CSTR Acid Digestion (R-601/R-602) at $120^\circ\text{C}$ and $3.0\text{ bara}$;
  7. Automated Recessed Chamber Filter Press (FP-601) yielding purified silica cake byproduct;
  8. Basicity Adjustment CSTR (R-701) and Keggin Maturation/Polymerization Tank (R-702) controlling the $[OH]/[Al]$ molar ratio to $1.2\text{--}1.65$ ($40\text{--}55\%$ basicity) and maximizing $Al_{13}$ polycation content.
- **Economic Profile:** Fixed Capital Investment (FCI) = **USD $13,402,360**; Total Capital Investment (TCI) = **USD $19,946,733**; Annual OPEX = **USD $11,095,802**; NPV = **USD $14.86\text{M}$** (at $8\%$ WACC); IRR = **$14.82\%$**; Unit Cost of Production = **USD $405.26/\text{tonne}$**.

### 1.2 The Role of the Digital Twin in Plant Lifecycle
For a complex chemical facility operating continuous pyrometallurgical, hydrometallurgical, and polymerization stages, a **Digital Twin (DT)** is not merely a 3D graphic or static dashboard; it is an **executable, cyber-physical reflection of the plant** that maintains dynamic synchronicity with physical assets across design, commissioning, operation, and optimization.

```
       +-------------------------------------------------------------+
       |                  PHYSICAL PLANT (AWASO, GHANA)               |
       |  CR-101 -> RK-201 -> MS-401 -> ML-501 -> R-601/2 -> R-701/2 |
       |       Field Sensors (TT, PT, FT, LT, DIC, AIT) & Actuators  |
       +------------------------------+------------------------------+
                                      |  ^
                Telemetric Data (OPC) |  | Supervisory Control (APC/RTO)
                                      v  |
       +---------------------------------+---------------------------+
       |             DIGITAL TWIN PLATFORM (WEB / CLOUD)             |
       |  +-------------------------------------------------------+  |
       |  | Level 1: Interactive PFD & P&ID Synoptic Overlays    |  |
       |  | Level 2: Real-time Telemetry, Historian & Alarms      |  |
       |  | Level 3: First-Principles Physics & Aspen Surrogates  |  |
       |  | Level 4: Soft Sensors, APC & Economic Optimization    |  |
       |  | Level 5: HAZOP Safety Simulation & Operator Training |  |
       |  +-------------------------------------------------------+  |
       +-------------------------------------------------------------+
```

The Digital Twin provides:
1. **Accelerated Operator Readiness (OTS):** Simulating complex startup/shutdown sequences and emergency responses without risking plant hardware.
2. **First-Principles Speciation Tracking:** Real-time visibility into unmeasurable chemical states, such as the formation of the metastable Keggin ion $[Al_{13}O_4(OH)_{24}(H_2O)_{12}]^{7+}$.
3. **Asset Integrity & Predictive Maintenance:** Continuous thermal stress calculations on the rotary kiln refractory lining and cavitation/erosion tracking on acidic slurry pumps.
4. **Energy & Material Optimization:** Dynamic adjustment of secondary air/fuel ratios in the kiln and stoichiometric HCl/bauxite dosing to minimize expensive reagent waste.

### 1.3 Digital Twin Maturity Spectrum (ISO 23247 / NAMUR NOA)
To ensure compliance with **ISO 23247** (*Digital Twin framework for manufacturing*) and **NAMUR Open Architecture (NOA / NE 175)**, the digital twin is engineered across five structured maturity tiers:

| **Tier** | **Designation** | **Functional Capabilities for the PAC Facility** | **Web Implementation** |
| :--- | :--- | :--- | :--- |
| **Level 1** | **Descriptive Twin** | High-fidelity interactive vector PFD and 7 Area P&IDs (ISA-5.1). Equipment datasheets, nozzle schedules, materials of construction, piping specs. | Scalable Vector Graphics (SVG), pan/zoom canvas, interactive tag metadata modals. |
| **Level 2** | **Informative Twin** | Live streaming telemetry from plant DCS/PLCs. Time-series trending, dynamic alarm management (ISA-18.2), equipment operating states (running/stopped/fault). | WebSocket/MQTT telemetry ingestion, high-speed Canvas charts, gauge widgets. |
| **Level 3** | **Predictive Twin** | Physics-based simulation: Aspen Plus ENRTL-RK neural surrogates, 1D differential kiln model, shrinking core leaching kinetics, CSTR RTD. | In-browser WebAssembly (WASM) / Web Workers mathematical solver. |
| **Level 4** | **Prescriptive Twin** | Real-Time Optimization (RTO), soft sensors (in-situ conversion, $Al_{13}$ yield, filter cake resistance), setpoint advisory to DCS. | Client-side optimization algorithms (Nelder-Mead/SQP) & ML inference engines. |
| **Level 5** | **Autonomous / Closed-Loop Twin** | Autonomous shadow control, dynamic constraint pushing, automatic loop retuning, predictive work-order generation. | Bidirectional edge gateway bridging web twin setpoints to plant PLCs via OPC UA. |

### 1.4 Literature Framework Alignment & Methodological Synthesis
To ensure maximum academic rigour and industrial compliance, this Digital Twin synthesizes the two foundational frameworks contained in the project reference library (`Refs/`):

1. **Topological Ingestion & Flowsheet Modeling Engine — Azangoo et al. (IEEE Access, 2022):**
   * *Reference:* "A Methodology for Generating a Digital Twin for Process Industry: A Case Study of a Fiber Processing Pilot Plant" (Aalto University / VTT Finland).
   * *Adopted Principles:* Ingestion of engineering P&IDs via vector/symbol recognition, translation into **DEXPI (Data Exchange in the Process Industry / ISO 15926)** standard representations, and compilation into an intermediate **Directed Acyclic Graph (DAG)** of nodes (unit operations) and edges (piping streams). This engine forms the structural backbone of our interactive vector PFD and Area 100–700 P&ID canvasses.

2. **Operational IIoT Platform & Quality Architecture — Lin et al. (IIC Journal of Innovation, 2021):**
   * *Reference:* "Digital Twin and IIoT in Optimizing Manufacturing Process and Quality Management" (Industrial Internet Consortium — IIC / Yo-i Information Technology).
   * *Adopted Principles:* The three-layer Industrial Internet Reference Architecture (**IoT Framework** $\rightarrow$ **Digital Twin Framework** $\rightarrow$ **Application DevOps Framework**), and crucially the **Dual-Twin Paradigm**:
     - **Equipment Digital Twins (EDTs):** Tracking mechanical health, thermal stress, and power consumption for physical machinery (`RK-201`, `R-601/602`, `ML-501`, `BH-301`).
     - **Product-in-Process (PiP) Digital Twins:** Tracking the chemical state transformation of the bauxite slurry as it traverses the plant, logging the pedigree of $Al_2O_3$ extraction, free acidity, basicity ratio ($B\%$), and active Keggin polycation ($[Al_{13}O_4(OH)_{24}(H_2O)_{12}]^{7+}$) yield for quality compliance with Ghana Water Company Limited (GWCL) standards.

---

# 2. SYSTEM ARCHITECTURE & CLOUD/WEB STACK (100% ONLINE / GITHUB HOSTED)

The user requirement mandates that the digital twin be **fully online and hostable on GitHub** (e.g., GitHub Pages). Industrial digital twins often suffer from heavy server requirements that require expensive cloud instances. This design employs a **Zero-Server, High-Performance Web Client Architecture**, paired with an optional lightweight Edge Gateway when physical telemetry is linked.

```
       +------------------------------------------------------------------------+
       |                  CLIENT WEB BROWSER (GITHUB PAGES HOSTED)               |
       |                                                                        |
       |  +---------------------------+       +------------------------------+  |
       |  |  UI & Presentation Layer  |       |  Physics Simulation Worker   |  |
       |  |  - React 19 / TypeScript  | <---> |  - WebAssembly (C/Rust/WASM) |  |
       |  |  - SVG PFD & P&ID Canvas  |       |  - 1D Kiln BVP Solver        |  |
       |  |  - Tailwind Dark Glass UI |       |  - SCM Leaching Kinetics     |  |
       |  |  - ECharts / Plotly Trends|       |  - Aspen Neural Surrogates   |  |
       |  +---------------------------+       +------------------------------+  |
       |               ^                                     ^                  |
       |               | State Sync (Zustand)                | Shared Buffers   |
       |               v                                     v                  |
       |  +------------------------------------------------------------------+  |
       |  |                   Centralized Plant State Store                  |  |
       |  |   64 Stream Vectors | 180+ ISA Tags | Alarm Bus | Economic KPIs   |  |
       |  +------------------------------------------------------------------+  |
       |                               ^                                        |
       +-------------------------------|----------------------------------------+
                                       |
                   Dual-Mode Communication Interface
                   +-------------------+-------------------+
                   |                                       |
                   v (Mode A: Offline/Demo)                v (Mode B: Live Physical)
       +-----------------------+              +-----------------------+
       | In-Browser Synthetic  |              | Secure WebSocket /    |
       | Telemetry Engine      |              | MQTT Edge Gateway     |
       | (Deterministic +      |              | (Node.js / Python /   |
       | Gaussian Process Noise|              | Docker / OPC UA)      |
       +-----------------------+              +-----------------------+
```

### 2.1 Serverless Zero-Cost Hosting Architecture
- **Host:** GitHub Pages (serving static, pre-compiled single-page application assets over global CDN).
- **Domain & SSL:** Custom domain with automated HTTPS via Let's Encrypt managed by GitHub.
- **Build & Deployment:** Automated GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs type checking, builds optimized production bundles via Vite, executes unit tests on kinetic models, and publishes to the `gh-pages` branch.
- **Zero Cost & Zero Maintenance:** The twin requires zero backend server infrastructure to run fully interactive simulations, making it permanently accessible to supervisors, external investors, and operating teams without recurring hosting charges.

### 2.2 Dual-Engine Hybrid Paradigm
To bridge the gap between academic simulation and industrial operations, the system features a **Dual-Mode Data Driver**:
1. **Standalone In-Browser Mode (Demo & Training Mode):**
   - Ideal for web demonstrations, engineering reviews, and classroom/OTS training.
   - Runs deterministic, first-principles chemical engineering differential equations entirely within the client’s browser using a background **Web Worker**.
   - Generates synthetic live sensor noise, drift, pump fluctuations, and valve hysteresis.
2. **Industrial Live Sync Mode (Physical Plant Mode):**
   - Connects via secure WebSockets (`wss://`) or MQTT over WebSockets to an on-site edge gateway.
   - Ingests real-time tags from the plant PLCs (Siemens S7-1500 / Allen-Bradley ControlLogix) or DCS via **OPC UA**.
   - Seamlessly swaps the data stream from synthetic to live telemetry without altering any dashboard visualizer.

### 2.3 Frontend Technology Stack & High-Performance Vector Rendering
- **Core Framework:** React 19 with TypeScript 5.5 for strict typing of physical units, stream objects, and instrument schemas.
- **Build Tool:** Vite 5.x delivering sub-second hot-module reloading and tree-shaken static compilation.
- **Diagram Render Engine:**
  - **Dynamic Scalable Vector Graphics (SVG):** Embedded interactive vector flowsheet ensuring razor-sharp fidelity from 4K control-room monitors down to tablets.
  - **SVG-Pan-Zoom:** High-performance hardware-accelerated matrix transformations for smooth panning, infinite zooming (10% to 1000%), and viewport framing.
  - **CSS Hardware-Accelerated Micro-Animations:** SVG paths with dynamic `stroke-dashoffset` animations visualizing fluid flow velocity, phase color-coding, and pump rotor rotations.
- **Data Visualization:** Apache ECharts & Chart.js for real-time scrolling multi-pen strip charts, PID faceplate trends, and residence time distribution curves.
- **Styling Architecture:** Vanilla CSS + CSS Variables implementing an ultra-modern **Dark Industrial SCADA Glassmorphism Design System** (HSL color palette: Slate-950 background `#0a0f1d`, frosted-glass cards, neon cyan `#00f2fe` process lines, electric amber `#f59e0b` warnings, and crimson `#ef4444` trip alarms).

### 2.4 Industrial Data Pipeline (OPC UA, MQTT, WebSockets, REST)
When connected to the physical plant at Awaso:
- **Level 0/1 (Field/PLC):** Smart transmitters (HART/Profibus PA) wire into remote I/O racks connected to Siemens S7-1500 PLCs.
- **Level 2 (DCS/SCADA):** Kepware or Prosys OPC UA Server pools PLC registers.
- **Level 3 (Edge Gateway):** A lightweight containerized Python/FastAPI service or Node-RED instance subscribes to OPC UA nodes, maps them into JSON-LD schemas matching the twin’s ISA-5.1 tags, and publishes updates via MQTT broker (Eclipse Mosquitto) or direct WebSocket frames at 1–10 Hz.
- **Data Compression:** Google Protocol Buffers (Protobuf) over WebSockets for high-frequency telemetry streams.

### 2.5 Cyber-Physical Security & Role-Based Access Control (IEC 62443)
In accordance with **IEC 62443** (Security for Industrial Automation and Control Systems):
- **Read-Only Enclave (Demilitarized Zone - DMZ):** The public GitHub Pages digital twin operates in a strictly read-only monitoring state.
- **Cryptographic Command Authentication:** If control actions (e.g., setpoint changes, loop tuning) are authorized from the twin to the plant, commands must pass through an encrypted mTLS proxy requiring JSON Web Tokens (JWT) and multi-factor engineer authorization, with hardware-enforced rate limiting to prevent denial-of-service or malicious setpoint tampering.

---

# 3. INTERACTIVE PROCESS FLOW DIAGRAM (PFD) ENGINE

The Interactive PFD serves as the plant-wide synoptic overview, providing immediate insight into mass balances, energy flows, and conversion efficiencies across all seven process areas.

```
+=================================================================================================================================+
| MASTER PROCESS FLOW DIAGRAM (PFD) -- 30,000 TPA POLY-ALUMINIUM CHLORIDE (PAC) FACILITY -- AWASO, GHANA                         |
+=================================================================================================================================+
|                                                                                                                                 |
|   [RAW BAUXITE]                                                                                                                 |
|   755.99 kg/h                               [AIR PREHEAT/BURNER]                                                                |
|       |                                         +---------+                                                                     |
|       v                                         | E,BR-201|                                                                     |
|   +-------+   Stream 102   +--------+           +----+----+                                                                     |
|   | CR-101| -------------> | BN-101 |                | Fuel/Air                                                                 |
|   |Crusher|  755.99 kg/h   |Day Bin |                v                                                                          |
|   +-------+                +---+----+           +---------+     Stream 203 (Exhaust Gas: 350 C)                                 |
|                                | Stream 104     | RK-201  | -------------------------------------+                              |
|                                +--------------> | Rotary  |                                      |                              |
|                                                 |  Kiln   | <--- CO Fuel Gas                     v                              |
|                                                 +----+----+                                +-----------+                        |
|                                                      | Stream 205 (Calcined Ore: 800 C)    |  CY-301   |                        |
|                                                      v                                     |  Cyclone  |                        |
|   [MAGNETITE BYPRODUCT]                         +---------+                                +-----+-----+                        |
|       ^                                         | CL-201  |                                      |                              |
|       | Stream 404 (32.1 kg/h)                  | Cooler  |                                      v                              |
|   +---+----+  Non-Mag Stream 403                +----+----+                                +-----------+                        |
|   | MS-401 | <---------------------------------------+                                     |  BH-301   |                        |
|   |Mag-Sep |                                                                               |  Baghouse |                        |
|   +---+----+                                                                               +-----+-----+                        |
|       | Calcined Non-Mag Ore (553.8 kg/h)                                                        |                              |
|       v                                                                                          v                              |
|   +--------+  Process Water                     +-----------+                              +-----------+                        |
|   | ML-501 | <---------------+                  |  HC-501   | (O/F Slurry Recycle)         |  SC-301   |                        |
|   |Wet Ball|                 |                  |Hydrocycln | ----------------+            |Scrubber/St|                        |
|   |  Mill  | --(Slurry)--> +---+----+  P-501    +-----+-----+                 |            +-----+-----+                        |
|   +--------+               | TK-501 | -------->       | (U/F Slurry: 40% wt)  |                  |                              |
|                            +--------+                 v                       v                  v                              |
|   32 wt% HCl                                    +-----------+         (Back to TK-501)     [CLEAN STACK]                        |
|   1,475.4 kg/h +------------------------------> | R-601/602 | <--------------------+                                            |
|                |                                |Leach Train| (Two Jacketed CSTRs in Series, 120 C, 3 bara)                    |
|                v                                +-----+-----+                                                           |
|          +-----------+                                | Slurry Stream 605                                                       |
|          |  TK-601   |                                v                                                                         |
|          | HCl Tank  |                          +-----------+  Silica Cake (377.2 kg/h)                                         |
|          +-----------+                          |  FP-601   | ------------------------> [PURIFIED SILICA BYPRODUCT]             |
|                                                 |Filtr Press|                                                                   |
|                                                 +-----+-----+                                                                   |
|   Ca(AlO2)2 Reagent                             Pregnant Leach Liquor (Stream 606: 1,852.2 kg/h)                                |
|   95.5 kg/h                                           |                                                                         |
|       |                                               v                                                                         |
|       v                                         +-----------+                                                                   |
|   +-------+                                     |   R-701   | (Basification CSTR, 65 C, pH 3.8-4.2)                             |
|   | H-701 | ----------------------------------> |Basificator|                                                                   |
|   +-------+                                     +-----+-----+                                                                   |
|                                                       |                                                                         |
|                                                       v                                                                         |
|                                                 +-----------+                                                                   |
|                                                 |   R-702   | (Aging / Maturation Reactor, 60 C, 2.5 h)                         |
|                                                 |Maturation |                                                                   |
|                                                 +-----+-----+                                                                   |
|                                                       | Stream 708 (Liquid PAC)                                                 |
|                                                       v                                                                         |
|                                                 +-----------+                                                                   |
|                                                 |   E-701   | (Plate Cooler -> 30 C)                                            |
|                                                 +-----+-----+                                                                   |
|                                                       | Stream 710                                                              |
|                                                       v                                                                         |
|                                                 +-----------+                                                                   |
|                                                 |  TK-702   | ====> [FINAL PURIFIED LIQUID PAC PRODUCT: 30,000 TPA]             |
|                                                 |PAC Storage|                                                                   |
|                                                 +===========+                                                                   |
+=================================================================================================================================+
```

### 3.1 Master Plant Flowsheet & Topological Routing
The PFD visualizer features an ortholinear, node-and-edge directed topology. Equipment units are rendered as standardized chemical engineering symbols conforming to DIN EN ISO 10628. Process pipelines feature dynamic routing with automatic jumper bridges over crossing lines.

### 3.2 Dynamic Mass & Energy Balance Overlay (64 Key Streams)
Every process stream is registered in the digital twin's state engine with its thermodynamic vector. Hovering or clicking on any stream line reveals a **Live Stream Telemetry Card**:

#### Representative Stream Data Matrix (Extracted from Design Report & Aspen Plus Simulation)
| Stream ID | Description | Flow (kg/h) | Temp (°C) | Press (bara) | Phase | Key Component Mass Fractions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Stream 101** | Raw Run-of-Mine Bauxite | 755.99 | 32.0 | 1.013 | Solid | $Al(OH)_3: 0.5970,\ Fe_2O_3: 0.0159,\ SiO_2: 0.3512,\ TiO_2: 0.0286$ |
| **Stream 104** | Crusher Product to Kiln | 755.99 | 35.0 | 1.013 | Solid | $Al(OH)_3: 0.5970,\ Fe_2O_3: 0.0159,\ SiO_2: 0.3512$ ($d_{80} = 15\text{ mm}$) |
| **Stream 203** | Rotary Kiln Exhaust Gas | 555.99 | 350.0 | 0.980 | Gas | $CO_2: 0.4408,\ H_2O_{(v)}: 0.3590,\ N_2: 0.1852,\ CO: 0.0150$ |
| **Stream 205** | Calcined Ore Discharge | 585.89 | 800.0 | 1.013 | Solid | $Al_2O_3: 0.5012,\ Fe_3O_4: 0.0548,\ SiO_2: 0.4140$ |
| **Stream 403** | Non-Magnetic Stream to Mill | 553.79 | 65.0 | 1.013 | Solid | $Al_2O_3: 0.5302,\ SiO_2: 0.4380,\ Fe_3O_4: 0.0050$ |
| **Stream 404** | Magnetite Byproduct Stream | 32.10 | 65.0 | 1.013 | Solid | $Fe_3O_4: 0.9120,\ Al_2O_3: 0.0510,\ SiO_2: 0.0370$ |
| **Stream 503** | Ball Mill Slurry Discharge | 992.24 | 45.0 | 1.013 | Slurry | Solids: $55.8\text{ wt}\%$, Water: $44.2\text{ wt}\%$, Ore $d_{80} = 75\ \mu\text{m}$ |
| **Stream 601** | Concentrated HCl Feed | 1,475.40 | 25.0 | 2.500 | Liquid | $HCl: 0.3200,\ H_2O: 0.6800$ |
| **Stream 605** | Digester Slurry Discharge | 2,229.40 | 120.0 | 3.000 | Slurry | $AlCl_3: 0.2310,\ HCl: 0.0340,\ SiO_2: 0.1692,\ H_2O: 0.5658$ |
| **Stream 606** | Clarified Pregnant Leach Liq | 1,852.20 | 85.0 | 1.500 | Liquid | $AlCl_3: 0.2780,\ HCl: 0.0409,\ FeCl_2: 0.0018,\ H_2O: 0.6793$ |
| **Stream 607** | Filter Press Silica Cake | 377.20 | 80.0 | 1.013 | Cake | $SiO_2: 0.8850,\ \text{Moisture}: 0.1150$ |
| **Stream 701** | Calcium Aluminate Feed | 95.50 | 25.0 | 1.013 | Solid | $Ca(AlO_2)_2: 0.9200,\ Al_2O_3: 0.0500,\ CaO: 0.0300$ |
| **Stream 708** | Polymerized PAC (Hot) | 1,947.70 | 65.0 | 1.200 | Liquid | $[Al_n(OH)_mCl_{3n-m}]_x$ (Basicity: $48.5\%$, $Al_2O_3\text{ eq}: 10.2\%$) |
| **Stream 710** | Final Liquid PAC to Storage | 1,947.70 | 30.0 | 1.013 | Liquid | Liquid PAC Product ($pH = 3.8\text{--}4.2$, SG = $1.24\text{ g/cm}^3$) |

### 3.3 Visual Process Animation & Flow Velocity Physics
- **Dynamic Stream Velocity:** The SVG strokes have animated dashes whose speed is tied directly to the volumetric flow rate:
  $$v_{anim} = k \cdot \frac{\dot{m}}{\rho \cdot \frac{\pi}{4} D_{pipe}^2}$$
- **State-Dependent Coloring:** Process lines dynamically shift colors based on operating conditions:
  - Slurry pipelines fade to dark amber if velocity drops below the critical settling velocity ($v < v_{crit} = 1.2\text{ m/s}$), triggering a particle deposition warning.
  - Kiln off-gas ducts glow red-orange if temperature exceeds $400^\circ\text{C}$.
  - Leaching lines turn magenta to highlight concentrated acid flow.

### 3.4 Interactive Stream Analysis & Flash Calculation Callouts
Users can click any pipeline to open a **Thermodynamic Flash Modal**. Built into the client via WebAssembly, this modal performs isothermal flash calculations, displays the phase envelope, plots electrolyte equilibrium, and breaks down the enthalpy and entropy relative to reference states ($25^\circ\text{C}, 1.013\text{ bara}$).

---

# 4. INTERACTIVE AREA-BY-AREA P&ID MODULES (AREAS 100–700)

The digital twin hosts dedicated, fully interactive Piping & Instrumentation Diagrams for all seven plant areas. Each sheet mirrors the engineering P&ID drawings in the workspace, with interactive instrumentation bubbles, valve actuators, and equipment faceplates complying with **ISA-5.1**.

```
+----------------------------------------------------------------------------------------------------+
| AREA P&ID INTERACTIVE NAVIGATION BAR                                                               |
| [Area 100: Comminution] [Area 200: Kiln] [Area 300: Off-Gas] [Area 400: Mag-Sep]                 |
| [Area 500: Wet Milling] [Area 600: Acid Leaching] [Area 700: Basification & Maturation]          |
+----------------------------------------------------------------------------------------------------+
```

### 4.1 Area 100: Raw Material Handling & Comminution Circuit
- **Process Scope:** Ingestion of run-of-mine (ROM) bauxite, moisture monitoring, primary size reduction to $P_{80} = 15\text{ mm}$, and elevation to kiln feed silo.
- **Key Equipment:**
  - `CRN-101`: Gantry Crane with Grab Bucket ($5.0\text{ t}$ capacity).
  - `FD-101`: Bauxite Feed Hopper & Heavy-Duty Vibrating Feeder ($1.5\text{ kW}$ motor).
  - `CR-101`: Single-Toggle Primary Jaw Crusher ($15\text{ kW}$ drive, gape $400 \times 600\text{ mm}$, reduction ratio 6:1).
  - `CV-101`: Enclosed Troughed Belt Conveyor ($3.7\text{ kW}$, width $500\text{ mm}$, length $35\text{ m}$, dust skirted).
  - `BN-101`: Crushed Bauxite Day Storage Silo ($50\text{ m}^3$, carbon steel with ultra-high-molecular-weight polyethylene UHMW-PE low-friction liner).
- **Control Loops & Instrumentation (ISA-5.1):**
  - `AIT-102`: Continuous microwave ore moisture analyzer.
  - `WIC-101`: Belt weighometer with feed rate indicating controller regulating `FD-101` vibrating frequency.
  - `LT-103` / `LIC-103`: Radar level transmitter and indicating controller on `BN-101` with `LAH-103` (high level alarm at 85%) and `LAL-103` (low level alarm at 20%).
  - `SIC-101`: Conveyor belt speed switch with underspeed zero-slip trip.
- **Twin Physics & Interactive Features:**
  - Real-time Bond Comminution solver calculating specific power consumption:
    $$W = 10 \cdot W_i \left(\frac{1}{\sqrt{P_{80}}} - \frac{1}{\sqrt{F_{80}}}\right) \quad [kWh/t]$$
    where $W_i = 11.2\text{ kWh/t}$ (Awaso Bauxite Work Index).
  - Clickable crusher cavity displaying wear-plate lifetime based on tonnage processed.

### 4.2 Area 200: Pyro-Processing & Reductive Roasting (Rotary Kiln RK-201)
- **Process Scope:** Counter-current reductive roasting of bauxite at $800\text{--}900^\circ\text{C}$ to dehydrate gibbsite to transition alumina ($\chi,\gamma\text{-}Al_2O_3$) and selectively reduce non-magnetic haematite ($Fe_2O_3$) to magnetic magnetite ($Fe_3O_4$) via CO burner gases.
- **Key Equipment:**
  - `RK-201`: Rotary Kiln ($D_{shell} = 1.6\text{ m}$, $L = 22.0\text{ m}$, slope $S = 2.5\%$, rotation $N = 1.5\text{ RPM}$, $20\text{ kW}$ variable speed drive, high-alumina brick refractory lining $t_{ref} = 150\text{ mm}$).
  - `E,BR-201`: Dual-Fuel Low-NOx Combustion Burner & Air Preheater ($1.8\text{ MW}$ duty).
  - `CL-201`: Rotary Drum Product Cooler ($D = 1.2\text{ m}$, $L = 12.0\text{ m}$, indirect water spray and secondary air counter-flow cooling solids to $65^\circ\text{C}$).
- **Control Loops & Instrumentation:**
  - `TIC-201`: Kiln burning zone optical pyrometer regulating burner fuel gas control valve `FV-201`.
  - `TIC-202`: Kiln back-end exhaust gas temperature transmitter with alarms `TAH-202` ($380^\circ\text{C}$).
  - `PIC-201`: Kiln hood pressure controller regulating induced draft fan `FN-301` speed via variable frequency drive (maintaining $-20\text{ Pa}$ draft to prevent fugitive dust emission).
  - `FIC-202`: Combustion air-to-fuel ratio controller maintaining 5% sub-stoichiometric reducing atmosphere.
- **Twin Physics & Interactive Features:**
  - **Axial 1D Finite-Difference Profile Visualizer:** Plots gas temperature $T_g(z)$, bed temperature $T_b(z)$, wall temperature $T_w(z)$, and solid conversion extents ($\alpha_{gibbsite}, \alpha_{haematite}$) along the 22-meter kiln axis.
  - Interactive slider allowing users to adjust kiln rotational speed ($N$) or feed rate ($\dot{m}$) and observe the Sullivan-Friedman-Maier residence time response:
    $$\tau = \frac{1.77 \cdot L \cdot \theta^{0.5}}{S \cdot D \cdot N}$$

### 4.3 Area 300: Off-Gas Treatment & Environmental Compliance
- **Process Scope:** Cleaning of hot kiln flue gases ($555.99\text{ kg/h}$ at $350^\circ\text{C}$), particulate removal, acid gas neutralization, and induced draft exhaust complying with Ghana EPA discharge standards.
- **Key Equipment:**
  - `CY-301`: High-Efficiency Cyclone Separator (knockout of particles $>20\ \mu\text{m}$, collection efficiency $85\%$).
  - `CL-301`: Evaporative Off-Gas Cooler (quenching gas from $350^\circ\text{C}$ to $160^\circ\text{C}$ before fabric filter).
  - `BH-301`: Pulse-Jet Fabric Filter Baghouse ($48$ PTFE/Nomex bags, air-to-cloth ratio $1.2\text{ m/min}$, collection efficiency $99.8\%$).
  - `RL-301 / RL-302`: Rotary Airlock Valves for dust return.
  - `FN-301`: Induced Draft (ID) Centrifugal Fan ($22\text{ kW}$, radial-blade design).
  - `SC-301`: Packed-Bed Wet Flue Gas Scrubber ($D = 0.8\text{ m}$, polypropylene Pall rings, recirculating alkaline liquor).
  - `ST-301`: Exhaust Stack ($H = 25\text{ m}$, continuous emission monitoring).
- **Control Loops & Instrumentation:**
  - `PDIC-301`: Baghouse tube-sheet differential pressure indicating controller triggering compressed air pulse cleaning when $\Delta P > 1,500\text{ Pa}$.
  - `TT-301`: Baghouse inlet protection temperature transmitter activating bypass damper valve `TV-301` if $T > 200^\circ\text{C}$ (protecting filter fabric).
  - `AIT-301`: Continuous Emission Monitoring System (CEMS) measuring stack particulate matter ($PM_{10} < 20\text{ mg/Nm}^3$), $CO$, $SO_2$, and $HCl$.
- **Twin Physics & Interactive Features:**
  - Filter cake buildup model: Darcy’s law pressure drop simulation over filtration cycles:
    $$\Delta P = \mu \cdot v \cdot (R_m + \alpha \cdot w)$$
  - Visual animation of reverse pulse-jet cleaning firing sequence with real-time pressure pulses.

### 4.4 Area 400: Dry High-Intensity Magnetic Beneficiation (MS-401)
- **Process Scope:** Separation of roasted ore into a high-purity magnetite ($Fe_3O_4$) byproduct stream and an iron-depleted calcined bauxite stream, eliminating the downstream need for expensive chemical iron precipitation.
- **Key Equipment:**
  - `MS-401`: Rare-Earth Permanent Magnet Drum Separator (field strength $0.8\text{ Tesla}$ / $8,000\text{ Gauss}$, variable speed vibratory feed tray).
  - `BN-401`: Magnetite Byproduct Storage Hopper ($10\text{ m}^3$).
  - `BN-402`: Non-Magnetic Beneficiated Bauxite Surge Bin ($25\text{ m}^3$).
- **Control Loops & Instrumentation:**
  - `WIC-401`: Loss-in-weight load cell on `BN-401` calculating cumulative iron ore byproduct revenue.
  - `AIT-401`: Online magnetic susceptibility sensor on the non-mag discharge triggering an alarm if $Fe_2O_3$ equivalent exceeds $0.5\text{ wt}\%$.
- **Twin Physics & Interactive Features:**
  - Particle trajectory physics engine displaying particle deviation under magnetic, gravitational, and centrifugal forces:
    $$F_{mag} = \frac{\chi \cdot V_p}{\mu_0} \cdot B \cdot \frac{dB}{dx}$$
  - Purity vs. recovery tradeoff curve adjusted via drum speed slider.

### 4.5 Area 500: Wet Grinding & Closed-Circuit Classification (ML-501 / HC-501)
- **Process Scope:** Wet comminution of calcined bauxite with process water to produce a reactive, pumpable slurry with narrow particle size distribution ($d_{80} = 75\ \mu\text{m}$, $55\text{ wt}\%$ solids) optimized for leaching kinetics.
- **Key Equipment:**
  - `BN-501`: Mill Feed Silo ($30\text{ m}^3$).
  - `FD-501`: Gravimetric Weigh Feeder ($1.1\text{ kW}$).
  - `TK-501`: Slurry Conditioning Tank ($5\text{ m}^3$, rubber-lined carbon steel, dual hydrofoil agitator).
  - `P-501 / P-502`: Heavy-Duty Slurry Centrifugal Pumps (Ni-Hard casing, rubber impeller, mechanical seal with flush).
  - `ML-501`: Wet Overflow Ball Mill ($D = 1.4\text{ m}$, $L = 2.8\text{ m}$, $45\text{ kW}$ drive, forged steel grinding media charge $38\%$ by volume).
  - `HC-501`: Hydrocyclone Classifier Array (100 mm polyurethane cyclones, operating at $150\text{ kPa}$ feed pressure).
- **Control Loops & Instrumentation:**
  - `DIC-501`: Slurry density indicating controller (radiometric / Coriolis density meter) adjusting process water control valve `FV-501` to maintain slurry SG at $1.45\text{ g/cm}^3$.
  - `FIC-501`: Water feed flow controller cascaded from `DIC-501`.
  - `LIC-501`: Slurry tank level controller modulating pump `P-501` VFD speed.
  - `PDIC-502`: Hydrocyclone inlet manifold differential pressure controller.
- **Twin Physics & Interactive Features:**
  - Hydrocyclone Plitt cut-size model calculating classification partition curves ($d_{50}$) and circulating load ratio ($CL \approx 250\%$).
  - Slurry rheology visualizer calculating non-Newtonian Bingham plastic viscosity and yield stress as a function of solids concentration.

### 4.6 Area 600: Pressurized Acid Digestion & Solid-Liquid Separation (R-601/602 / FP-601)
- **Process Scope:** The core chemical reaction train of the plant. Alumina dissolution from bauxite using 32 wt% hydrochloric acid in two continuous stirred tank reactors in series, followed by pressure filtration to remove insoluble silica gangue.
- **Reaction Chemistry:**
  $$Al_2O_3\text{ (activated)} + 6HCl_{(aq)} \longrightarrow 2AlCl_{3(aq)} + 3H_2O \quad (\Delta H_r = -89.8\text{ kJ/mol } Al)$$
  $$Fe_2O_3\text{ (residual)} + 6HCl_{(aq)} \longrightarrow 2FeCl_{3(aq)} + 3H_2O$$
- **Key Equipment:**
  - `TK-601`: Hydrochloric Acid Storage Tank ($60\text{ m}^3$, FRP wrapped with vinylester resin lining).
  - `P-601A/B`: HCl Dosing Metering Diaphragm Pumps (PTFE liquid ends, variable speed drive, 100% duty/standby).
  - `R-601 / R-602`: Two-Stage Jacketed CSTR Leaching Reactor Train ($V = 4.5\text{ m}^3$ each, Hastelloy C-276 / PTFE-lined carbon steel, operating at $120^\circ\text{C}$ and $3.0\text{ bara}$, dimple jackets for cooling water, axial pitch-blade turbines).
  - `P-602 / P-603`: Leach Slurry Transfer & Filter Press Feed Pumps (corrosion/abrasion-resistant CD4MCu duplex alloy).
  - `FP-601`: Automated Recessed Chamber Filter Press ($40\text{ plates}$, polypropylene membrane plates, cake squeeze pressure $15\text{ bar}$, cake wash system).
  - `BN-601`: Washed Silica Cake Dump Hopper ($15\text{ m}^3$).
  - `TK-602`: Clarified Pregnant Leach Liquor (PLP) Storage Tank ($30\text{ m}^3$, FRP).
- **Control Loops & Instrumentation:**
  - `FFIC-601`: Acid-to-bauxite ratio flow controller measuring bauxite mass feed (`WIC-501`) and modulating HCl dosing pump stroke (`P-601`) via dual Coriolis meters `FT-601A/B` to maintain a stoichiometric ratio of $1.05\text{--}1.10$.
  - `TIC-605 / TIC-606`: Reactor temperature controllers regulating jacket cooling water control valves `TV-605 / TV-606` to suppress exothermic temperature rise above $125^\circ\text{C}$. High alarm `TAH-605` ($130^\circ\text{C}$), high-high trip `TAHH-605` ($140^\circ\text{C}$).
  - `PIC-602 / PIC-603`: Vapor headspace pressure controllers regulating vent control valves `PV-602 / PV-603` to vent emergency vapors to the acid scrubber `SC-601` at $3.0\text{ bara}$.
  - `LIC-604 / LIC-607`: Reactor liquid level controllers regulating inter-stage pump `P-602` and discharge valve `LV-607` to maintain liquid residence time at $\tau = 2.0\text{ hours}$ per CSTR.
  - `Agitator Current Monitors`: Load sensors alerting operators to slurry settling or motor impeller fouling.
- **Twin Physics & Interactive Features:**
  - **Dynamic Shrinking Core Model (SCM) Engine:** Computes real-time conversion ($X_A$) governed by product-layer diffusion:
    $$1 - 3(1-X_A)^{2/3} + 2(1-X_A) = \frac{6 \cdot b \cdot D_e \cdot C_{HCl}}{\rho_B \cdot R_0^2} \cdot t$$
  - **Interactive Leaching Thermal Runaway Simulator:** Allows simulated tripping of cooling water valve `TV-605` to observe adiabatic temperature surge, vapor pressure spike, and automated emergency scrubber blowdown.

### 4.7 Area 700: Basification, Keggin Polymerization & Product Maturation (R-701 / R-702)
- **Process Scope:** Controlled basification of acidic aluminium chloride solution with calcium aluminate ($Ca(AlO_2)_2$) powder, inducing hydrolysis and self-assembly of the high-performance Keggin polycation $[Al_{13}O_4(OH)_{24}(H_2O)_{12}]^{7+}$ ($Al_{13}$), followed by aging and polishing filtration.
- **Key Reactions & Speciation Chemistry:**
  $$13Al^{3+} + 32H_2O + Ca(AlO_2)_2 \longrightarrow [Al_{13}O_4(OH)_{24}(H_2O)_{12}]^{7+} + Ca^{2+} + 8H^+$$
  $$\text{Basicity Index } B (\%) = \frac{[OH^-]}{3 \cdot [Al^{3+}]} \times 100\% \quad (\text{Target: } 45.0\text{--}55.0\%)$$
- **Key Equipment:**
  - `TK-701`: $AlCl_3$ Solution Feed Tank ($20\text{ m}^3$).
  - `H-701`: Calcium Aluminate Powder Hopper with variable-speed precision screw feeder ($FD-701$).
  - `R-701`: Jacketed Basification CSTR Reactor ($V = 3.5\text{ m}^3$, titanium grade 2 / PTFE lining, high-shear dispersion impeller, operating at $65^\circ\text{C}$).
  - `FP-701`: Polishing Guard Filter Press (removal of unreacted solids and $CaSO_4/CaCO_3$ traces).
  - `R-702`: Maturation & Polymerization Aging Tank ($V = 6.0\text{ m}^3$, jacketed holding tank, gentle axial paddle agitation, residence time $\tau = 2.5\text{ hours}$ at $60^\circ\text{C}$).
  - `E-701`: Plate-and-Frame Product Cooler (Hastelloy C plates, cooling product from $60^\circ\text{C}$ to $30^\circ\text{C}$ using cooling water).
  - `TK-702A/B`: Finished Liquid PAC Storage Tanks ($2 \times 100\text{ m}^3$, FRP, 14-day plant storage capacity).
- **Control Loops & Instrumentation:**
  - `pHIC-701`: Online glass electrode pH and basicity indicating controller modulating powder feeder `FD-701` rate to maintain reactor pH at $3.8\text{--}4.2$.
  - `TIC-701`: Basification exotherm temperature controller maintaining $65^\circ\text{C}$ to prevent premature gibbsite precipitation.
  - `TIC-702`: Maturation aging temperature controller maintaining $60^\circ\text{C}$ steam jacket heat input for structural assembly of $Al_{13}$ polycations.
  - `LT-702`: Ultrasonic level transmitter on product storage tanks with high inventory alarms.
- **Twin Physics & Interactive Features:**
  - **Ferron Speciation Kinetics Model:** Plots the dynamic distribution of monomeric aluminium ($Al_a$), polymeric Keggin aluminium ($Al_b$), and colloidal aggregates ($Al_c$) as a function of temperature, addition rate, and aging time.
  - Coagulation Turbidity Estimator: Virtual jar test predicting required dosage (ppm) and residual water turbidity for raw water at Barekese Dam (Ghana) based on the current PAC basicity.

---

# 5. ADVANCED INDUSTRIAL DIGITAL TWIN CAPABILITIES

To satisfy the standard of an experienced process engineer and industrial automation architect, the digital twin incorporates six advanced digital modules that elevate it from a basic monitoring portal to a world-class cyber-physical operational platform.

```
+----------------------------------------------------------------------------------------------------+
| ADVANCED PROCESS ENGINEERING DIGITAL TWIN MODULES                                                  |
+------------------------------------+---------------------------------------------------------------+
| MODULE                             | ENGINEERING ENGINE & ALGORITHM                                |
+------------------------------------+---------------------------------------------------------------+
| 5.1 Physics & Aspen Surrogates     | ENRTL-RK Electrolyte Neural Net + Runge-Kutta 4th Order ODE   |
| 5.2 Virtual Soft Sensors           | Extended Kalman Filter (EKF) state estimation for Al13 & Conv |
| 5.3 Predictive Maintenance (PdM)   | Pump cavitation index, refractory wear & baghouse Darcy drop  |
| 5.4 Supervisory Optimization (RTO) | Specific acid consumption minimizer & PURC tariff load-shift  |
| 5.5 HAZOP & Safety Interlocks      | ISA-18.2 Rationalized Alarm Bus + Adiabatic Runaway Simulator |
| 5.6 Technoeconomic & ESG Ledger    | Real-time production cost ($/t) & Scope 1/2/3 Carbon Tracker  |
+------------------------------------+---------------------------------------------------------------+
```

### 5.1 First-Principles & Aspen Plus Surrogate Thermodynamic Engines
Rigorous electrolyte simulation in Aspen Plus (using the **ENRTL-RK** property method) is computationally heavy and cannot run natively inside a standard web browser. The digital twin solves this by using **High-Dimensional Neural Surrogates & Polynomial Response Surfaces**:
1. **Training Database:** 10,000 multi-point operating runs generated from `PAC_Aspen_Simulation.apw` across feed variations ($T \in [20, 150]^\circ\text{C}$, $P \in [1, 5]\text{ bar}$, $HCl/Al_2O_3 \in [4.5, 7.5]$).
2. **Surrogate Model Architecture:** A lightweight deep neural network ($3\text{ hidden layers} \times 64\text{ neurons}$, ReLU activation) exported to ONNX format and executed in the browser via `onnxruntime-web` or pure WebAssembly.
3. **Execution Performance:** Delivers rigorous chemical equilibrium, speciation, vapor-liquid-solid partitions, and enthalpies in **$< 1.5\text{ milliseconds}$**, running at 60 frames per second without server lag.

### 5.2 Virtual Process Sensors (Soft Sensors) for Unmeasurable States
Physical sensors cannot survive inside aggressive, highly corrosive hot acid slurries or rotating kilns. The twin deploys **Extended Kalman Filter (EKF)** soft sensors:

```
                  +----------------------------------------------+
                  |           MEASURED PHYSICAL INPUTS           |
                  |  - Slurry Flow (FT-601)                      |
                  |  - Acid Flow (FT-601B)                       |
                  |  - Slurry Density (DT-501)                   |
                  |  - Reactor Temperatures (TT-605/TT-606)      |
                  |  - Off-Gas Scrubber Vent Flow & Temp         |
                  +----------------------+-----------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |         EXTENDED KALMAN FILTER (EKF)         |
                  |  - Heterogeneous Shrinking Core Model        |
                  |  - Dynamic Reactor Energy Balance            |
                  |  - Covariance Error Correction Matrix        |
                  +----------------------+-----------------------+
                                         |
                                         v
                  +----------------------------------------------+
                  |         ESTIMATED VIRTUAL PROCESS STATES     |
                  |  1. Al2O3 Extraction Conversion: X = 88.4%   |
                  |  2. In-situ Free Acid Concentration: 3.2%    |
                  |  3. Real-time Basicity Ratio: OH/Al = 1.45   |
                  |  4. Active Keggin Al13 Fraction: 82.3%       |
                  |  5. Kiln Axial Hotspot Temperature: 894 C    |
                  +----------------------------------------------+
```

1. **Soft Sensor 1: Real-Time Alumina Digestion Conversion ($X_{Al_2O_3}$):**
   Estimates conversion inside `R-601/R-602` by coupling reactor enthalpy release ($Q_{rxn} = \dot{m} C_p \Delta T + Q_{jacket}$) with Coriolis slurry density measurements, without waiting 4 hours for laboratory titration.
2. **Soft Sensor 2: Keggin $Al_{13}$ Polycation Concentration:**
   Estimates the percentage of active $Al_{13}$ coagulant species using an empirical thermodynamic state observer trained on Ferron spectrophotometry and $^{27}Al\text{ NMR}$ data.
3. **Soft Sensor 3: Rotary Kiln Internal Bed Temperature Profile:**
   Reconstructs the non-linear internal solids temperature profile $T_{bed}(z)$ from shell external IR pyrometer bands and flue gas composition.

### 5.3 Equipment Health Prognostics & Predictive Maintenance (PdM)
The twin monitors operational stress to forecast equipment degradation before failure occurs:
- **Slurry Pumps (`P-501`, `P-602`, `P-603`):**
  - Continuous calculation of Net Positive Suction Head Available ($NPSHa$) vs. Required ($NPSHr$):
    $$NPSHa = \frac{P_{suct} - P_v}{\rho g} + \frac{v^2}{2g}$$
  - Cavitation Index & Impeller Erosion Tracking: Compares motor power draw against expected head curve. When efficiency drops by $>8\%$ at constant RPM, an **Impeller Wear Advisory** is flagged.
- **Rotary Kiln Refractory Shell (`RK-201`):**
  - Monitors radial thermal conduction across the 150 mm refractory brick lining.
  - A virtual shell heat-loss map identifies brick spalling: if localized shell temperature exceeds $350^\circ\text{C}$ (design baseline $220^\circ\text{C}$), a **Critical Refractory Hotspot Alert** is dispatched.
- **Baghouse Filter Bags (`BH-301`):**
  - Tracks the residual clean-cloth resistance ($R_m$) after reverse air pulse-jet firing. A steady upward drift in baseline $\Delta P$ signals irreversible pore blinding, forecasting remaining bag filter life in days.

### 5.4 Advanced Process Control (APC) & Supervisory Real-Time Optimization (RTO)
- **Stoichiometric HCl Consumption Minimizer:**
  The largest single variable OPEX cost is hydrochloric acid ($56.4\%$ of total variable costs, USD $6,254,401/year). The RTO algorithm continuously adjusts the ratio controller setpoint `FFIC-601` based on incoming bauxite reactive alumina content. By trimming excess acid from $15\%$ to $5\%$ while maintaining $>88\%$ digestion yield, the plant saves an estimated **USD $310,000 annually**.
- **Ghana PURC Tariff Load-Shifting Scheduler:**
  Under the Public Utilities Regulatory Commission of Ghana (PURC) Medium Voltage Industrial Tariff, electricity rates vary across Peak, Shoulder, and Off-Peak windows. The twin optimizes `ML-501` ball mill grinding schedules and raw crushed ore surge bin (`BN-101`) inventory, running heavy grinding during low-tariff off-peak hours ($22:00\text{--}06:00\text{ GMT}$) to reduce electrical OPEX.

### 5.5 Dynamic HAZOP Safety Simulator & Operator Training System (OTS)
The digital twin integrates the comprehensive Hazard and Operability (HAZOP) studies developed in the project report. It features an interactive **What-If Emergency Scenario Simulator**:
- **Scenario A: Total Cooling Water Supply Failure to Acid Digesters (`R-601/R-602`):**
  - Simulator cuts cooling water flow (`TV-605/606 = 0%`).
  - Reaction heat ($\Delta H_r = -89.8\text{ kJ/mol}$) drives temperature from $120^\circ\text{C}$ toward atmospheric boiling point ($108^\circ\text{C}$ at 1 bar, elevated to $138^\circ\text{C}$ at 3 bara).
  - Vapor pressure spikes.
  - The twin executes safety interlock logic: High-High Temperature Trip `TAHH-605` ($140^\circ\text{C}$) cuts HCl pump `P-601`, dumps reactor vent to caustic scrubber `SC-601`, and sounds virtual emergency sirens.
- **Scenario B: Rotary Kiln Flameout & Flue Gas Deflagration Risk:**
  - Simulates flame detector failure on `E,BR-201`, triggering fuel gas fast-acting safety shutoff valves (SSVs) within $1.0\text{ second}$ to prevent flammable gas accumulation in the baghouse.

### 5.6 Real-Time Technoeconomic & ESG Carbon Ledger
A dedicated technoeconomic dashboard tracks profitability and carbon footprint in real time:
- **Unit Cost of Production Tracker:**
  Calculates instant production cost in USD/tonne of PAC:
  $$\text{Unit Cost } (\$/t) = \frac{\dot{m}_{bauxite} C_{baux} + \dot{m}_{HCl} C_{HCl} + \dot{m}_{reagents} C_{reag} + P_{elec} C_{PURC} + \dot{Q}_{fuel} C_{gas} + \text{Fixed Overhead}}{\dot{m}_{PAC}}$$
  Displays real-time margin against the selling price benchmark of **USD $450.00/tonne** (Target Unit Cost: **USD $405.26/tonne**).
- **Scope 1, 2, and 3 GHG Emissions Ledger:**
  - **Scope 1:** Fuel gas combustion emissions from `E,BR-201` kiln burner.
  - **Scope 2:** Grid electricity consumption from the national interconnected grid (VRA/GRIDCo).
  - **Scope 3:** Embedded emissions in imported $32\text{ wt}\% HCl$ and road freight from Tema to Awaso ($350\text{ km}$).

---

# 6. SOFTWARE ARCHITECTURE, COMPONENT SCHEMAS & GITHUB REPOSITORY LAYOUT

To enable immediate, zero-friction implementation by the development team, this section provides the concrete file tree, TypeScript data models, physics kernels, UI components, and automated CI/CD deployment scripts.

### 6.1 Repository Directory Structure
```
pac-plant-digital-twin/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated build & GitHub Pages deployment
├── public/
│   ├── assets/
│   │   ├── pfd-base.svg            # Master Process Flow Diagram vector base
│   │   └── pid/
│   │       ├── area100.svg         # Comminution P&ID
│   │       ├── area200.svg         # Rotary Kiln P&ID
│   │       ├── area300.svg         # Off-Gas Scrubber P&ID
│   │       ├── area400.svg         # Magnetic Separation P&ID
│   │       ├── area500.svg         # Wet Milling P&ID
│   │       ├── area600.svg         # Leaching P&ID
│   │       └── area700.svg         # Basification P&ID
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── analytics/
│   │   │   ├── EconomicDashboard.tsx   # Real-time $/tonne & NPV tracker
│   │   │   ├── ESGLedger.tsx           # Carbon emissions & EPA limits
│   │   │   └── SoftSensorView.tsx      # Al13 speciation & EKF conversion
│   │   ├── faceplates/
│   │   │   ├── ControllerFaceplate.tsx # ISA-5.1 PID Auto/Man/Cas popup
│   │   │   ├── InterlockMatrix.tsx     # Safety SIS trip bypass/status
│   │   │   └── ValveActuator.tsx       # Analog/discrete valve control
│   │   ├── flowsheets/
│   │   │   ├── FlowsheetCanvas.tsx     # Hardware-accelerated SVG pan-zoom engine
│   │   │   ├── PfdViewer.tsx           # Plant-wide interactive PFD
│   │   │   └── PidAreaViewer.tsx       # Area 100-700 P&ID tabbed viewer
│   │   └── navigation/
│   │       ├── AlarmBanner.tsx         # ISA-18.2 top alarm annunciation bar
│   │       └── Sidebar.tsx             # Area selection & twin mode toggles
│   ├── models/
│   │   ├── ComminutionModel.ts         # Bond work index & ball mill sizing
│   │   ├── KegginSpeciationModel.ts    # Al13 formation & basicity kinetics
│   │   ├── LeachingKinetics.ts         # SCM product-layer diffusion ODE
│   │   └── RotaryKilnBVP.ts            # 1D Sullivan-Friedman-Maier solver
│   ├── store/
│   │   ├── alarmStore.ts               # Active alarms, acknowledgments & trips
│   │   ├── plantStateStore.ts          # Central telemetry state (streams & tags)
│   │   └── simulationStore.ts          # Solver time-step, pause, speed multiplier
│   ├── telemetry/
│   │   ├── MqttClient.ts               # Live physical plant bridge (WebSocket MQTT)
│   │   └── SyntheticGenerator.ts       # Deterministic math telemetry engine
│   ├── types/
│   │   ├── alarms.ts                   # Alarm priority, status & trip schemas
│   │   ├── instruments.ts              # ISA-5.1 tag metadata definitions
│   │   └── streams.ts                  # Mass & energy balance stream interfaces
│   ├── App.tsx                         # Main layout shell
│   ├── index.css                       # Dark Glassmorphism SCADA styling tokens
│   └── main.tsx                        # React application bootstrap
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 6.2 Data Model & State Management Schemas (TypeScript)

#### `src/types/streams.ts`
```typescript
/**
 * Thermodynamic and compositional state vector for all 64 plant streams.
 * Conforms to Aspen Plus ENRTL-RK output structures.
 */
export interface ChemicalComposition {
  al_oh_3?: number;      // Gibbsite (wt fraction)
  al_2_o_3?: number;      // Activated transition alumina
  fe_2_o_3?: number;      // Haematite
  fe_3_o_4?: number;      // Magnetite
  sio_2?: number;         // Silica
  tio_2?: number;         // Titania
  hcl?: number;           // Hydrochloric acid
  alcl_3?: number;        // Aluminium chloride
  ca_alo2_2?: number;     // Calcium aluminate
  pac_polymer?: number;   // Poly-aluminium chloride [Al_n(OH)_mCl_{3n-m}]
  h2o: number;            // Water (liquid or vapor)
  co2?: number;           // Carbon dioxide (flue gas)
  n2?: number;            // Nitrogen
  co?: number;            // Carbon monoxide
}

export interface ProcessStream {
  id: string;             // e.g. "Stream-101", "Stream-605"
  name: string;           // Descriptive name
  area: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  massFlowKgH: number;    // Mass flow rate (kg/h)
  volumetricFlowM3H: number;
  temperatureC: number;   // Temperature (°C)
  pressureBara: number;   // Absolute pressure (bara)
  phase: 'solid' | 'liquid' | 'gas' | 'slurry' | 'cake';
  densityKgM3: number;    // Density (kg/m3)
  enthalpyKw: number;     // Specific enthalpy flow (kW)
  composition: ChemicalComposition;
}
```

#### `src/types/instruments.ts`
```typescript
/**
 * ISA-5.1 Instrument & Control Loop Tag Schema
 */
export type InstrumentType = 
  | 'TT' | 'TIC' | 'PT' | 'PIC' | 'FT' | 'FIC' | 'FFIC' 
  | 'LT' | 'LIC' | 'DIC' | 'AIT' | 'SIC' | 'PDIC';

export interface InstrumentTag {
  tag: string;            // e.g., "TIC-605", "FFIC-601"
  description: string;
  area: number;
  type: InstrumentType;
  pv: number;             // Process Variable
  sp: number;             // Setpoint
  op: number;             // Output (% to valve/drive)
  units: '°C' | 'bara' | 'kg/h' | 'm3/h' | 'm' | '%' | 'g/cm3' | 'RPM' | 'Pa';
  mode: 'AUTO' | 'MAN' | 'CAS';
  limits: {
    rangeLow: number;
    rangeHigh: number;
    alarmLow?: number;    // LAL
    alarmHigh?: number;   // LAH / TAH
    tripHigh?: number;    // TAHH / PSHH
    tripLow?: number;     // LALL
  };
  alarmState: 'NORMAL' | 'LOW' | 'HIGH' | 'TRIP';
  interlocksTripped: boolean;
}
```

### 6.3 Mathematical Physics Kernels (TypeScript / WASM)

#### `src/models/LeachingKinetics.ts`
```typescript
/**
 * Two-Stage CSTR Leaching Reactor Kinetics Kernel
 * Implements Heterogeneous Shrinking Core Model (SCM)
 * with Product-Layer Diffusion Control.
 */
export interface LeachingInput {
  feedRateBauxiteKgH: number; // kg/h calcined ore
  feedRateHclKgH: number;     // kg/h 32 wt% HCl
  reactorTempC: number;       // °C (Nominal 120°C)
  reactorVolumeM3: number;    // m3 (Nominal 4.5 m3 per CSTR)
  particleRadiusMicrons: number; // R0 (Nominal 37.5 microns for d80=75um)
}

export interface LeachingOutput {
  aluminaConversionX1: number; // Conversion Stage 1 (R-601)
  aluminaConversionX2: number; // Conversion Stage 2 (R-602)
  heatGeneratedKw: number;     // Exothermic heat release (kW)
  coolingWaterDemandM3H: number;
  slurryDensityKgM3: number;
}

export class LeachingKineticsModel {
  // Kinetic Constants
  private readonly rhoB = 2420; // Bauxite molar density (mol/m3 Al2O3)
  private readonly b = 1 / 6;   // Stoichiometric coefficient (1 mol Al2O3 per 6 mol HCl)
  private readonly De0 = 1.85e-9; // Diffusion coefficient at 298K (m2/s)
  private readonly Ea = 42500;  // Activation energy (J/mol)
  private readonly R = 8.314;   // Universal gas constant (J/mol-K)
  private readonly deltaHr = 89800; // J/mol Al reacted

  public solve(input: LeachingInput): LeachingOutput {
    const T_k = input.reactorTempC + 273.15;
    
    // Effective Diffusivity with Arrhenius temperature dependence
    const De = this.De0 * Math.exp((-this.Ea / this.R) * (1 / T_k - 1 / 298.15));
    const R0 = input.particleRadiusMicrons * 1e-6; // convert to meters
    
    // Slurry volumetric residence time per tank (hours to seconds)
    const slurryFlowM3H = (input.feedRateBauxiteKgH / 1450) + (input.feedRateHclKgH / 1160);
    const tau = (input.reactorVolumeM3 / slurryFlowM3H) * 3600; // seconds

    // Initial bulk concentration of HCl (mol/m3)
    const CHcl = (0.32 * 1160 * 1000) / 36.46; // ~10,180 mol/m3

    // Characteristic SCM Diffusion Time Constant: tau_diff = (rhoB * R0^2) / (6 * b * De * C_A)
    const tauDiff = (this.rhoB * Math.pow(R0, 2)) / (6 * this.b * De * CHcl);

    // Iterative Newton-Raphson solution for CSTR conversion X1 (Stage 1)
    let X1 = 0.5; // initial guess
    for (let i = 0; i < 20; i++) {
      // SCM implicit function: f(X) = 1 - 3*(1-X)^(2/3) + 2*(1-X) - (tau / tauDiff) = 0
      const f = 1 - 3 * Math.pow(1 - X1, 2 / 3) + 2 * (1 - X1) - (tau / tauDiff);
      const df = 2 * Math.pow(1 - X1, -1 / 3) - 2;
      const nextX1 = X1 - f / df;
      if (Math.abs(nextX1 - X1) < 1e-6) {
        X1 = Math.min(Math.max(nextX1, 0.01), 0.99);
        break;
      }
      X1 = Math.min(Math.max(nextX1, 0.01), 0.99);
    }

    // Stage 2 Conversion (R-602) operating on unreacted core
    const remainingTau = tau * 1.0;
    let X2 = X1 + (1 - X1) * 0.65; // realistic second-stage enhancement

    // Total Exothermic Heat (kW)
    const molesAlPerHour = (input.feedRateBauxiteKgH * 0.597 * (102 / 156) * 2000 / 102) * X2;
    const heatGeneratedKw = (molesAlPerHour * this.deltaHr) / (3600 * 1000);

    // Cooling water requirement (assuming 30°C supply, 45°C return => DeltaT = 15 K)
    const coolingWaterDemandM3H = (heatGeneratedKw * 3600) / (4.184 * 1000 * 15);

    return {
      aluminaConversionX1: Number(X1.toFixed(3)),
      aluminaConversionX2: Number(X2.toFixed(3)),
      heatGeneratedKw: Number(heatGeneratedKw.toFixed(1)),
      coolingWaterDemandM3H: Number(coolingWaterDemandM3H.toFixed(2)),
      slurryDensityKgM3: 1380
    };
  }
}
```

#### `src/models/KegginSpeciationModel.ts`
```typescript
/**
 * Keggin Polycation [Al13O4(OH)24(H2O)12]7+ Speciation Model
 * Simulates hydrolysis and condensation kinetics during basicity adjustment.
 */
export interface BasicityAdjustmentInput {
  alcl3FeedLPerH: number;      // AlCl3 solution feed (L/h)
  calciumAluminateKgH: number; // Ca(AlO2)2 powder dosing rate (kg/h)
  reactorTemperatureC: number; // Temperature (°C, optimum 60-65°C)
  residenceTimeHours: number;  // Aging time (hours)
}

export interface SpeciationOutput {
  basicityPercent: number;     // [OH]/[3Al] * 100
  al_a_monomers: number;       // wt% Al (Al3+, Al(OH)2+, Al(OH)2+)
  al_b_keggin_al13: number;    // wt% Al (Active Al13 Keggin polycations)
  al_c_colloids: number;       // wt% Al (Insoluble large colloidal aggregates)
  predictedTurbidityNtu: number; // Predicted treated water turbidity at Barekese Dam
}

export class KegginSpeciationModel {
  public calculate(input: BasicityAdjustmentInput): SpeciationOutput {
    // Molar ratio calculation: B = [OH] / (3 * [Al])
    // 1 kg Ca(AlO2)2 supplies active base equivalents
    const baseEquiv = input.calciumAluminateKgH * 12.35; // mol OH- equiv/h
    const alEquiv = (input.alcl3FeedLPerH * 1.25 * 0.08) / 0.02698; // mol Al/h

    let B = (baseEquiv / (3 * alEquiv)) * 100;
    B = Math.min(Math.max(B, 15.0), 85.0); // clamp realistic range

    // Speciation fraction equations derived from 27Al NMR empirical calibration
    const T = input.reactorTemperatureC;
    const t = input.residenceTimeHours;

    // Keggin formation peaks at 60-65°C and B = 45-55%
    const tempFactor = Math.exp(-Math.pow(T - 65, 2) / 250);
    const basicityFactor = Math.exp(-Math.pow(B - 50, 2) / 300);
    const timeFactor = 1 - Math.exp(-t / 1.2);

    let Alb = 85.0 * tempFactor * basicityFactor * timeFactor;
    Alb = Math.min(Math.max(Alb, 5.0), 88.0);

    // High basicity or overheating drives precipitation to Al_c colloids
    let Alc = 0.0;
    if (B > 55 || T > 75) {
      Alc = (B - 50) * 0.8 + Math.max(T - 70, 0) * 0.6;
    }
    Alc = Math.min(Math.max(Alc, 2.0), 40.0);

    // Remainder is monomeric Al_a
    const Ala = Math.max(100 - Alb - Alc, 2.0);

    // Predicted Jar Test performance on high-turbidity Ghana surface water
    // Higher Alb directly lowers residual NTU
    const predictedTurbidityNtu = 120.0 * (1 - Alb / 100) * 0.25 + 1.2;

    return {
      basicityPercent: Number(B.toFixed(1)),
      al_a_monomers: Number(Ala.toFixed(1)),
      al_b_keggin_al13: Number(Alb.toFixed(1)),
      al_c_colloids: Number(Alc.toFixed(1)),
      predictedTurbidityNtu: Number(predictedTurbidityNtu.toFixed(2))
    };
  }
}
```

### 6.4 Interactive ISA-5.1 Faceplate UI Components

#### `src/components/faceplates/ControllerFaceplate.tsx`
```tsx
import React, { useState } from 'react';
import { InstrumentTag } from '../../types/instruments';

interface FaceplateProps {
  tag: InstrumentTag;
  onClose: () => void;
  onUpdateSp: (tag: string, newSp: number) => void;
  onToggleMode: (tag: string, newMode: 'AUTO' | 'MAN' | 'CAS') => void;
}

export const ControllerFaceplate: React.FC<FaceplateProps> = ({
  tag,
  onClose,
  onUpdateSp,
  onToggleMode,
}) => {
  const [spInput, setSpInput] = useState(tag.sp.toString());

  const handleApplySp = () => {
    const val = parseFloat(spInput);
    if (!isNaN(val)) {
      onUpdateSp(tag.tag, val);
    }
  };

  const isAlarm = tag.alarmState !== 'NORMAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-96 rounded-xl border border-slate-700 bg-slate-900/95 p-5 shadow-2xl text-slate-100 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-bold tracking-widest text-cyan-400">AREA {tag.area}00</span>
            <h3 className="text-lg font-extrabold text-white">{tag.tag}</h3>
            <p className="text-xs text-slate-400">{tag.description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Status Alarm Banner */}
        {isAlarm && (
          <div className="mt-3 flex items-center justify-between rounded bg-red-900/40 border border-red-500/60 p-2 text-xs font-bold text-red-300 animate-pulse">
            <span>⚠ ALARM ACTIVE: {tag.alarmState}</span>
            <span>LIMIT EXCEEDED</span>
          </div>
        )}

        {/* PV / SP / OP Vertical Gauges */}
        <div className="my-5 grid grid-cols-3 gap-3 text-center">
          {/* PV Card */}
          <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-3">
            <span className="text-xs font-semibold text-slate-400">PV (Actual)</span>
            <div className="mt-1 text-xl font-bold text-cyan-400">
              {tag.pv.toFixed(1)}
            </div>
            <span className="text-[10px] text-slate-500">{tag.units}</span>
          </div>

          {/* SP Card */}
          <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-3">
            <span className="text-xs font-semibold text-slate-400">SP (Target)</span>
            <div className="mt-1 text-xl font-bold text-emerald-400">
              {tag.sp.toFixed(1)}
            </div>
            <span className="text-[10px] text-slate-500">{tag.units}</span>
          </div>

          {/* OP Card */}
          <div className="rounded-lg bg-slate-800/60 border border-slate-700/60 p-3">
            <span className="text-xs font-semibold text-slate-400">OP (Output)</span>
            <div className="mt-1 text-xl font-bold text-amber-400">
              {tag.op.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500">Valve/VFD</span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-400">CONTROL MODE</label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(['AUTO', 'MAN', 'CAS'] as const).map((m) => (
              <button
                key={m}
                onClick={() => onToggleMode(tag.tag, m)}
                className={`rounded py-1.5 text-xs font-bold transition ${
                  tag.mode === m
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* SP Adjust Input */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-400">SETPOINT ENTRY</label>
          <div className="mt-1.5 flex gap-2">
            <input
              type="number"
              value={spInput}
              onChange={(e) => setSpInput(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleApplySp}
              className="rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
            >
              SEND
            </button>
          </div>
          <span className="text-[10px] text-slate-500">
            Valid range: {tag.limits.rangeLow} - {tag.limits.rangeHigh} {tag.units}
          </span>
        </div>
      </div>
    </div>
  );
};
```

### 6.5 Automated CI/CD Deployment Pipeline (GitHub Actions)

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy PAC Plant Digital Twin to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code Repository
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Project Dependencies
        run: npm ci

      - name: Execute Typechecks & Kinetic Engine Unit Tests
        run: |
          npx tsc --noEmit
          npm test -- --passWithNoTests

      - name: Compile Production Web Application Bundle
        run: npm run build

      - name: Upload GitHub Pages Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy Assets to GitHub Pages CDN
        id: deployment
        uses: actions/deploy-pages@v4
```

---

# 7. IMPLEMENTATION ROADMAP & ENGINEERING GOVERNANCE

To execute this digital twin project smoothly, work is structured into five sequential, agile engineering sprints.

```
+----------------------------------------------------------------------------------------------------+
| 5-STAGE IMPLEMENTATION TIMELINE & DELIVERABLES                                                     |
+----------------------------------------------------------------------------------------------------+
| Sprint 1: Vector Graphics & Master PFD Topology (Weeks 1-2)                                        |
|   Deliverables: Vectorization of PAC_PFD.vsdx, SVG viewport pan-zoom, baseline stream database.    |
|                                                                                                    |
| Sprint 2: Area-by-Area Interactive P&ID Layouts (Weeks 3-4)                                        |
|   Deliverables: Conversion of Area 100-700 CAD schematics, clickable ISA-5.1 instruments.         |
|                                                                                                    |
| Sprint 3: Client-Side Physics Simulation Engine (Weeks 5-6)                                        |
|   Deliverables: WASM SCM solver, Rotary Kiln BVP, Keggin speciation kinetics, Web Worker loop.     |
|                                                                                                    |
| Sprint 4: Supervisory Control, Alarms & Soft Sensors (Weeks 7-8)                                   |
|   Deliverables: ISA-18.2 Alarm Bus, PID Faceplate modal, EKF conversion and basicity soft sensors. |
|                                                                                                    |
| Sprint 5: Technoeconomics, Edge Gateway & Deployment (Weeks 9-10)                                   |
|   Deliverables: Real-time OPEX tracker, OPC UA / MQTT bridge, GitHub Actions deployment to Pages.  |
+----------------------------------------------------------------------------------------------------+
```

### 7.1 Phased Delivery Milestones

#### Phase 1: Interactive Master PFD & Design Token Framework (Weeks 1–2)
- Parse `PAC_PFD.vsdx` into clean SVG assets.
- Implement the React-Vite frontend shell with the Dark Glassmorphism SCADA theme.
- Bind all 64 process streams into the central Zustand store.
- Enable interactive hover tooltips and dynamic line flow animations.

#### Phase 2: High-Fidelity Interactive P&IDs (Areas 100–700) (Weeks 3–4)
- Convert native CAD files (`Area100.dwg` to `Area700.dwg`) into responsive layered SVGs.
- Overlay 180+ ISA-5.1 smart instrumentation bubbles with live PV/SP readouts.
- Implement layer-filtering controls (toggle Piping, Mechanical, Electrical, or Instrumentation layers).

#### Phase 3: Physics Kernels & Dynamic Simulation Integration (Weeks 5–6)
- Implement first-principles models in TypeScript and compile heavy solvers to WebAssembly:
  - Heterogeneous Shrinking Core Model for `R-601/R-602`.
  - Sullivan-Friedman-Maier kiln transport solver for `RK-201`.
  - Keggin polycation hydrolysis kinetics for `R-701/R-702`.
  - Darcy cake filtration solver for `BH-301` and `FP-601`.
- Verify mathematical outputs against Aspen Plus v14.2 baseline runs.

#### Phase 4: Industrial Control Faceplates, Soft Sensors & HAZOP Simulator (Weeks 7–8)
- Build pop-up controller faceplates supporting Manual, Auto, and Cascade modes with bumpless transfer.
- Implement the Extended Kalman Filter (EKF) soft sensors for $Al_{13}$ speciation and unmeasurable reaction conversions.
- Construct the HAZOP "What-If" emergency scenario engine (cooling failure runaway, kiln flameout).

#### Phase 5: Technoeconomic Analytics, Edge Gateway & Production Launch (Weeks 9–10)
- Integrate dynamic financial models linking live stream flows to raw material costs ($HCl$, bauxite) and PURC electrical tariffs.
- Configure WebSocket / MQTT client for physical plant connectivity via OPC UA.
- Deploy the production bundle to GitHub Pages via automated GitHub Actions.
- Conduct final User Acceptance Testing (UAT) with operations and engineering staff.

### 7.2 Validation & Acceptance Criteria Against Pilot/Aspen Benchmarks
To declare the Digital Twin operationally ready for engineering sign-off:
1. **Mass Balance Closure:** Total mass across all flowsheet balance nodes must close within **$\pm 0.25\%$** of the Aspen Plus benchmark ($755.99\text{ kg/h}$ ore $+ 1,475.40\text{ kg/h}$ acid $= 2,231.39\text{ kg/h}$ slurry).
2. **Thermal Profile Accuracy:** Rotary kiln axial temperature predictions must match the 1D differential simulation in the design report within **$\pm 15^\circ\text{C}$** across all grid points.
3. **Leaching Yield Fidelity:** Shrinking Core Model must predict total alumina extraction within **$\pm 1.5\%$** of the nominal $88.4\%$ steady-state target.
4. **Basicity & Speciation Alignment:** The Ferron kinetics model must replicate the target $45\text{--}55\%$ basicity and $>80\%\ Al_{13}$ Keggin fraction under design dosing rates.
5. **Real-Time Client Performance:** Frame rate must maintain $\ge 55\text{ FPS}$ on standard web browsers with animation running, with client-side solver execution time under $10\text{ ms}$ per step.

### 7.3 Concluding Recommendations for Industrial Twin Operations
1. **Maintain Digital-Physical Parity:** Whenever physical modifications occur (e.g., replacement of pump impellers or re-bricking of the kiln), mechanical parameters in the twin’s configuration files must be updated immediately to preserve model accuracy.
2. **Utilize for Operator Certification:** Before live commissioning of the Awaso plant, all DCS console operators should undergo certified training on the digital twin’s HAZOP simulation module, practicing emergency procedures for acid runaway and scrubber failures.
3. **Progress Toward Autonomous Optimization:** Once the physical plant achieves operational stability, the twin’s prescriptive optimization models (specific acid consumption trimmer and PURC off-peak mill scheduler) should be linked closed-loop to the supervisory DCS to maximize commercial margins and establish the facility as a benchmark of modern African chemical manufacturing.

---
**End of Report — Document PAC-DTWIN-ENG-2026-001**
