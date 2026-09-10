# 30,000 TPA Poly-Aluminium Chloride (PAC) Chemical Plant Digital Twin
### Industrial Digital Twin & SCADA Web Simulator | Awaso, Ghana

[![ISO 10628 Compliant](https://img.shields.io/badge/Flowsheet-ISO_10628-007ACC.svg)](https://www.iso.org/standard/39294.html)
[![ISA 5.1 Instrumentation](https://img.shields.io/badge/P%26ID-ISA_5.1-4CAF50.svg)](https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa5)
[![Zero-Cost Static Hosting](https://img.shields.io/badge/Hosting-GitHub_Pages-222222.svg)](https://pages.github.com/)
[![License](https://img.shields.io/badge/Project-KNUST_Chemical_Engineering-B71C1C.svg)](#)

---

## 📋 Project Overview

This repository houses the complete engineering deliverables and interactive **Industrial Digital Twin** for a **30,000 Tonnes Per Annum (TPA)** Poly-Aluminium Chloride ($\text{Al}_n(\text{OH})_m\text{Cl}_{3n-m}$) chemical production facility utilizing raw bauxite from the Awaso deposits in the Western North Region of Ghana.

The project is developed by **Group 7B** in the Department of Chemical Engineering at Kwame Nkrumah University of Science and Technology (KNUST), supervised by **Dr. Mary Mensah**.

### 👥 Group Members (Group 7B)
- **AMOAH, Kelvin** (ID: 1933122) — Ball Mill Grinding Circuit & Comminution Design
- **DARKO, Melissa Afriyie** (ID: 1936822) — Basicity Adjustment Reactor & Polymerization Design
- **GYASI-DENTEH, Prince Sugar** (ID: 1938022) — Reductive Roasting Rotary Kiln & Off-gas Design
- **OSABUTEY, Sylvester Nii Abbey** (ID: 1940922) — Two-Stage Jacketed Digestion CSTR Design

---

## 🏭 Digital Twin Features

The web-based digital twin runs directly in modern web browsers with **zero build steps** and **zero server costs**, designed for direct deployment to **GitHub Pages**.

- **Master Process Flow Diagram (PFD)**: Complete plant layout from raw bauxite comminution to purified PAC storage with real-time stream velocity animations and dynamic mass/energy balance telemetry.
- **Area P&IDs (Areas 100 to 700)**: Fully interactive, high-fidelity Piping & Instrumentation Diagrams conforming strictly to **ISO 10628-2** equipment symbols and **ISA-5.1** instrumentation bubbles.
  - **Area 100**: Raw Material Handling & Preparation
  - **Area 200**: Pyro-Processing & Reductive Roasting (Rotary Kiln RK-201)
  - **Area 300**: Flue Gas & Particulate Treatment (Cyclones & Wet Scrubbers)
  - **Area 400**: High-Intensity Dry Magnetic Beneficiation (MS-401)
  - **Area 500**: Wet Grinding & Closed-Circuit Hydrocyclone Classification (ML-501 / HC-501)
  - **Area 600**: Pressurized Hydrochloric Digestion & Filtration (R-601/602 & FP-601)
  - **Area 700**: Basification, Keggin ($Al_{13}$) Polymerization & Maturation (R-701/702)
- **Interactive SCADA Faceplates**: Click on any control loop (FIC, TIC, PIC, LIC, DIC) to adjust setpoints, switch between Auto/Manual modes, and observe dynamic plant responses.
- **Interactive Stream Inspection Drawer**: Click any numbered stream callout to inspect mass flowrates, temperatures, pressures, enthalpy, and chemical compositions.
- **Dual Visual Theme**: Modern, high-contrast **Apple Light Mode** (default) with an instant toggle to Industrial Dark SCADA Mode.
- **Continuous Pipelines**: 100% continuous, leak-free SVG vector pipelines with zero hover jitter.

---

## 🚀 Quick Start (Run Locally)

You do not need Node.js, Webpack, or npm to run the digital twin. It uses native ES6 JavaScript modules and standard CSS variables.

### Option 1: Python HTTP Server (Recommended)
In the project directory, open your terminal and run:
```bash
python -m http.server 8080
```
Then navigate in your browser to:
```
http://localhost:8080/
```

### Option 2: VS Code Live Server
Right-click on `index.html` and select **Open with Live Server**.

---

## 🌐 Deploying to GitHub Pages (Zero-Cost Hosting)

To make the Digital Twin accessible anywhere in the world at `https://<username>.github.io/<repo-name>/`:

1. Commit and push this repository to GitHub.
2. In your GitHub repository, navigate to **Settings** > **Pages** (in the left sidebar).
3. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
4. Set the branch to `main` and the folder to `/ (root)`.
5. Click **Save**. Within 60 seconds, your Digital Twin will be live!

---

## 📂 Repository Layout

```
PAC_DTwin/
├── index.html                   # Main SCADA Digital Twin single-page application
├── js/
│   ├── main.js                  # Application orchestrator & event bus
│   ├── config/
│   │   ├── streams.js           # 64-stream mass & energy balance dataset
│   │   └── pidData.js           # Full instrumentation & equipment graphs (Areas 100-700)
│   ├── ui/
│   │   ├── pfdRenderer.js       # Master PFD SVG renderer (ISO 10628 symbols)
│   │   ├── pidRenderer.js       # P&ID renderer (ISO 10628 equipment & ISA-5.1 instruments)
│   │   └── faceplateRenderer.js # SCADA instrument faceplate dialogs
│   └── models/
│       ├── thermodynamics.js    # Enthalpy, vapor pressure, and flash equilibrium
│       └── softSensors.js       # Virtual state observers and estimators
├── styles/
│   ├── scada-tokens.css         # CSS design system (Apple Light Mode & Dark SCADA tokens)
│   └── flowsheet.css            # Flowsheet vector styling, smooth animations & drawer
├── P&ID/                        # Native AutoCAD (.dwg) & viewing (.pdf) sheets for Areas 100-700
├── PAC_Aspen_Simulation.apw     # Aspen Plus V14.0 rigorous plant simulation model
├── PAC_Economics_Final.xlsx     # CAPEX, OPEX, DCF Cash Flow, NPV and IRR model
├── PAC_PFD.vsdx                 # Master Process Flow Diagram (Visio / draw.io)
├── PAC_Report.docx              # Comprehensive final engineering plant design report
├── DTwin.md                     # Complete Digital Twin Engineering Architecture Report
└── README.md                    # Project navigation, guide & deployment instructions
```

---

## 📐 Engineering Standards Reference

- **ISO 10628-2**: Diagrams for the chemical and petrochemical industry — Graphical symbols.
- **ANSI/ISA-5.1-2009**: Instrumentation Symbols and Identification.
- **ISO 23247 / NAMUR NOA**: Industrial Digital Twin maturity and open architecture framework.
