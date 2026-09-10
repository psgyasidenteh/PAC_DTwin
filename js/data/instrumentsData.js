/**
 * INSTRUMENTATION DATA MODEL (ISA-5.1)
 * Complete tag registry with Setpoints, Process Variables, Outputs, Limits & Alarms.
 */

export const INITIAL_INSTRUMENTS = {
  // Area 100: Comminution
  "WIC-101": {
    tag: "WIC-101",
    name: "Bauxite Ore Feed Rate",
    area: 100,
    type: "WIC",
    pv: 755.99,
    sp: 755.99,
    op: 52.4,
    units: "kg/h",
    mode: "AUTO",
    limits: { low: 200, high: 1500, alLow: 400, alHigh: 1200, tripHigh: 1400 },
    alarm: "NORMAL",
    pid: { kp: 1.2, ti: 15.0, td: 0.0 }
  },
  "AIT-102": {
    tag: "AIT-102",
    name: "Ore Moisture Analyzer",
    area: 100,
    type: "AIT",
    pv: 8.4,
    sp: 8.0,
    op: 0.0,
    units: "%",
    mode: "AUTO",
    limits: { low: 0, high: 20, alLow: 2.0, alHigh: 12.0, tripHigh: 15.0 },
    alarm: "NORMAL"
  },
  "LIC-103": {
    tag: "LIC-103",
    name: "Day Bin BN-101 Level",
    area: 100,
    type: "LIC",
    pv: 68.5,
    sp: 70.0,
    op: 48.0,
    units: "%",
    mode: "AUTO",
    limits: { low: 0, high: 100, alLow: 20, alHigh: 85, tripHigh: 95 },
    alarm: "NORMAL",
    pid: { kp: 1.8, ti: 45.0, td: 0.0 }
  },

  // Area 200: Rotary Kiln
  "TIC-201": {
    tag: "TIC-201",
    name: "Kiln Burning Zone Temp",
    area: 200,
    type: "TIC",
    pv: 850.0,
    sp: 850.0,
    op: 64.2,
    units: "°C",
    mode: "AUTO",
    limits: { low: 500, high: 1100, alLow: 780, alHigh: 920, tripHigh: 960 },
    alarm: "NORMAL",
    pid: { kp: 2.4, ti: 60.0, td: 12.0 }
  },
  "TIC-202": {
    tag: "TIC-202",
    name: "Kiln Exhaust Gas Temp",
    area: 200,
    type: "TIC",
    pv: 350.0,
    sp: 350.0,
    op: 42.0,
    units: "°C",
    mode: "AUTO",
    limits: { low: 150, high: 500, alLow: 250, alHigh: 400, tripHigh: 450 },
    alarm: "NORMAL"
  },
  "PIC-201": {
    tag: "PIC-201",
    name: "Kiln Hood Draft Pressure",
    area: 200,
    type: "PIC",
    pv: -20.4,
    sp: -20.0,
    op: 55.8,
    units: "Pa",
    mode: "AUTO",
    limits: { low: -100, high: 50, alLow: -50, alHigh: 10, tripHigh: 30 },
    alarm: "NORMAL",
    pid: { kp: 0.8, ti: 5.0, td: 0.0 }
  },
  "FIC-202": {
    tag: "FIC-202",
    name: "Fuel Gas Feed Flow",
    area: 200,
    type: "FIC",
    pv: 174.27,
    sp: 174.27,
    op: 62.0,
    units: "kg/h",
    mode: "CAS",
    limits: { low: 50, high: 300, alLow: 80, alHigh: 250, tripHigh: 280 },
    alarm: "NORMAL",
    pid: { kp: 1.5, ti: 10.0, td: 0.0 }
  },

  // Area 300: Off-Gas
  "PDIC-301": {
    tag: "PDIC-301",
    name: "Baghouse Tube-Sheet dP",
    area: 300,
    type: "PDIC",
    pv: 1250.0,
    sp: 1200.0,
    op: 35.0,
    units: "Pa",
    mode: "AUTO",
    limits: { low: 200, high: 2500, alLow: 500, alHigh: 1600, tripHigh: 2000 },
    alarm: "NORMAL"
  },
  "AIT-301": {
    tag: "AIT-301",
    name: "Stack CEMS Particulate",
    area: 300,
    type: "AIT",
    pv: 8.2,
    sp: 10.0,
    op: 0.0,
    units: "mg/Nm3",
    mode: "AUTO",
    limits: { low: 0, high: 50, alLow: 0, alHigh: 20, tripHigh: 35 },
    alarm: "NORMAL"
  },

  // Area 400: Magnetic Separation
  "WIC-401": {
    tag: "WIC-401",
    name: "Magnetite Byproduct Rate",
    area: 400,
    type: "WIC",
    pv: 32.1,
    sp: 32.0,
    op: 40.0,
    units: "kg/h",
    mode: "AUTO",
    limits: { low: 0, high: 80, alLow: 10, alHigh: 60, tripHigh: 75 },
    alarm: "NORMAL"
  },

  // Area 500: Wet Milling
  "DIC-501": {
    tag: "DIC-501",
    name: "Slurry Specific Gravity",
    area: 500,
    type: "DIC",
    pv: 1.45,
    sp: 1.45,
    op: 45.0,
    units: "g/cm3",
    mode: "AUTO",
    limits: { low: 1.1, high: 1.8, alLow: 1.35, alHigh: 1.55, tripHigh: 1.65 },
    alarm: "NORMAL",
    pid: { kp: 2.1, ti: 25.0, td: 0.0 }
  },
  "LIC-501": {
    tag: "LIC-501",
    name: "Slurry Tank TK-501 Level",
    area: 500,
    type: "LIC",
    pv: 62.4,
    sp: 65.0,
    op: 58.0,
    units: "%",
    mode: "AUTO",
    limits: { low: 0, high: 100, alLow: 25, alHigh: 80, tripHigh: 90 },
    alarm: "NORMAL"
  },

  // Area 600: Acid Digestion Train
  "FFIC-601": {
    tag: "FFIC-601",
    name: "HCl to Bauxite Ratio Controller",
    area: 600,
    type: "FFIC",
    pv: 1.08,
    sp: 1.08,
    op: 56.5,
    units: "ratio",
    mode: "AUTO",
    limits: { low: 0.8, high: 1.5, alLow: 0.95, alHigh: 1.25, tripHigh: 1.35 },
    alarm: "NORMAL",
    pid: { kp: 1.6, ti: 12.0, td: 1.5 }
  },
  "TIC-605": {
    tag: "TIC-605",
    name: "Leach Reactor R-601 Temp",
    area: 600,
    type: "TIC",
    pv: 120.0,
    sp: 120.0,
    op: 44.5,
    units: "°C",
    mode: "AUTO",
    limits: { low: 80, high: 160, alLow: 105, alHigh: 130, tripHigh: 140 },
    alarm: "NORMAL",
    pid: { kp: 3.2, ti: 30.0, td: 4.5 }
  },
  "TIC-606": {
    tag: "TIC-606",
    name: "Leach Reactor R-602 Temp",
    area: 600,
    type: "TIC",
    pv: 120.0,
    sp: 120.0,
    op: 28.0,
    units: "°C",
    mode: "AUTO",
    limits: { low: 80, high: 160, alLow: 105, alHigh: 130, tripHigh: 140 },
    alarm: "NORMAL",
    pid: { kp: 3.2, ti: 30.0, td: 4.5 }
  },
  "PT-602": {
    tag: "PT-602",
    name: "R-601 Vapor Headspace Press",
    area: 600,
    type: "PT",
    pv: 3.01,
    sp: 3.00,
    op: 15.0,
    units: "bara",
    mode: "AUTO",
    limits: { low: 1.0, high: 6.0, alLow: 1.8, alHigh: 4.2, tripHigh: 5.0 },
    alarm: "NORMAL"
  },
  "LIC-604": {
    tag: "LIC-604",
    name: "R-601 Slurry Level",
    area: 600,
    type: "LIC",
    pv: 72.0,
    sp: 72.0,
    op: 50.0,
    units: "%",
    mode: "AUTO",
    limits: { low: 0, high: 100, alLow: 30, alHigh: 85, tripHigh: 92 },
    alarm: "NORMAL",
    pid: { kp: 2.0, ti: 40.0, td: 0.0 }
  },
  "LIC-607": {
    tag: "LIC-607",
    name: "R-602 Slurry Level",
    area: 600,
    type: "LIC",
    pv: 72.0,
    sp: 72.0,
    op: 52.0,
    units: "%",
    mode: "AUTO",
    limits: { low: 0, high: 100, alLow: 30, alHigh: 85, tripHigh: 92 },
    alarm: "NORMAL",
    pid: { kp: 2.0, ti: 40.0, td: 0.0 }
  },

  // Area 700: Basification & Maturation
  "pHIC-701": {
    tag: "pHIC-701",
    name: "Basification pH & Basicity",
    area: 700,
    type: "pHIC",
    pv: 4.10,
    sp: 4.10,
    op: 54.0,
    units: "pH",
    mode: "AUTO",
    limits: { low: 2.0, high: 6.0, alLow: 3.5, alHigh: 4.6, tripHigh: 5.2 },
    alarm: "NORMAL",
    pid: { kp: 1.8, ti: 20.0, td: 2.0 }
  },
  "TIC-701": {
    tag: "TIC-701",
    name: "Basification Reactor Temp",
    area: 700,
    type: "TIC",
    pv: 65.0,
    sp: 65.0,
    op: 38.0,
    units: "°C",
    mode: "AUTO",
    limits: { low: 30, high: 100, alLow: 50, alHigh: 75, tripHigh: 85 },
    alarm: "NORMAL"
  },
  "TIC-702": {
    tag: "TIC-702",
    name: "Maturation Tank R-702 Temp",
    area: 700,
    type: "TIC",
    pv: 60.0,
    sp: 60.0,
    op: 24.0,
    units: "°C",
    mode: "AUTO",
    limits: { low: 30, high: 90, alLow: 48, alHigh: 70, tripHigh: 80 },
    alarm: "NORMAL"
  },
  "LT-702": {
    tag: "LT-702",
    name: "Finished PAC Storage Level",
    area: 700,
    type: "LT",
    pv: 54.2,
    sp: 60.0,
    op: 0.0,
    units: "%",
    mode: "AUTO",
    limits: { low: 0, high: 100, alLow: 15, alHigh: 90, tripHigh: 95 },
    alarm: "NORMAL"
  }
};
