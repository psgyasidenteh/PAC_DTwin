/**
 * INDUSTRIAL HYDRAULICS, TRANSPORT & HEAT TRANSFER UTILITIES
 * First-principles chemical & mechanical engineering equations for:
 * - Control valve flow sizing (ISA-75.01 / IEC 60534)
 * - Centrifugal & slurry pump hydraulics, power draw & affinity scaling
 * - Available Net Positive Suction Head (NPSHa) & cavitation evaluation
 * - Darcy-Weisbach piping pressure drop & Colebrook-White friction factor
 * - Log-Mean Temperature Difference (LMTD) & heat exchanger rating
 */

export const G_ACCEL = 9.80665; // m/s^2

/**
 * Calculates liquid volumetric flow through a control valve per IEC 60534 / ISA-75.01
 * @param {number} kv - Current valve flow coefficient (m^3/h at deltaP = 1 bar)
 * @param {number} deltaPBar - Pressure drop across valve (bar)
 * @param {number} fluidDensityKgM3 - Fluid density (kg/m^3)
 * @returns {Object} Flow rate (m^3/h and kg/h)
 */
export function calculateValveLiquidFlow(kv, deltaPBar, fluidDensityKgM3 = 1000.0) {
  if (kv <= 0 || deltaPBar <= 0) return { volFlowM3H: 0, massFlowKgH: 0 };
  const sg = fluidDensityKgM3 / 1000.0;
  const volFlowM3H = kv * Math.sqrt(deltaPBar / sg);
  const massFlowKgH = volFlowM3H * fluidDensityKgM3;
  return {
    volFlowM3H: Number(volFlowM3H.toFixed(2)),
    massFlowKgH: Number(massFlowKgH.toFixed(2))
  };
}

/**
 * Centrifugal & Slurry Pump Head-Capacity Curve with VFD Affinity Scaling
 * @param {Object} pumpSpec
 * @param {number} pumpSpec.shutoffHeadM - Shutoff head H0 (meters)
 * @param {number} pumpSpec.nominalFlowM3H - Nominal rated flow (m^3/h)
 * @param {number} pumpSpec.nominalHeadM - Nominal rated head (meters)
 * @param {number} [pumpSpec.ratedRpm=1450] - Rated motor speed (RPM)
 * @param {number} [speedRpm=1450] - Operating speed (RPM)
 * @param {number} [flowM3H=0] - Current flow demand (m^3/h)
 * @param {number} [fluidDensityKgM3=1000] - Fluid density (kg/m^3)
 * @param {number} [pumpEfficiency=0.72] - Hydraulic efficiency (0 - 1)
 * @param {number} [motorEfficiency=0.92] - Electrical motor efficiency (0 - 1)
 * @returns {Object} Developed head, hydraulic kW, motor kW
 */
export function calculatePumpHydraulics(pumpSpec, speedRpm, flowM3H, fluidDensityKgM3 = 1000.0, pumpEfficiency = 0.72, motorEfficiency = 0.92) {
  const speedRatio = speedRpm / (pumpSpec.ratedRpm || 1450.0);
  // Affinity laws: H0 scales with (N1/N2)^2, flow capacity with (N1/N2)
  const scaledH0 = pumpSpec.shutoffHeadM * Math.pow(speedRatio, 2);
  const flowCap = pumpSpec.nominalFlowM3H * speedRatio;
  const curveCoeff = (scaledH0 - pumpSpec.nominalHeadM * Math.pow(speedRatio, 2)) / Math.pow(flowCap, 2);

  // H(Q) = H0 - A * Q^2
  const developedHeadM = Math.max(0, scaledH0 - curveCoeff * Math.pow(flowM3H, 2));

  // Hydraulic Power (kW) = (rho * g * Q * H) / (3.6e6)
  const hydraulicPowerKw = (fluidDensityKgM3 * G_ACCEL * flowM3H * developedHeadM) / 3.6e6;
  const motorPowerKw = hydraulicPowerKw / (pumpEfficiency * motorEfficiency);

  return {
    developedHeadM: Number(developedHeadM.toFixed(2)),
    hydraulicPowerKw: Number(hydraulicPowerKw.toFixed(2)),
    motorPowerKw: Number(motorPowerKw.toFixed(2)),
    speedRatio: Number(speedRatio.toFixed(3))
  };
}

/**
 * Calculates Net Positive Suction Head Available (NPSHa) and evaluates cavitation margin.
 * @param {Object} suctionCondition
 * @param {number} suctionCondition.suctionPressureBara - Absolute pressure at suction surface (bara)
 * @param {number} suctionCondition.vaporPressureBara - Fluid vapor pressure at operating temp (bara)
 * @param {number} suctionCondition.staticElevationM - Height of liquid surface above pump centerline (+ for flooded, - for suction lift)
 * @param {number} suctionCondition.suctionFrictionLossM - Friction loss in suction piping (meters)
 * @param {number} [suctionCondition.fluidDensityKgM3=1000] - Fluid density (kg/m^3)
 * @param {number} [suctionCondition.npshRequiredM=2.5] - Pump NPSHr from manufacturer curve (meters)
 * @returns {Object} NPSHa, NPSHr margin, and cavitation status
 */
export function calculateNPSH(suctionCondition) {
  const rho = suctionCondition.fluidDensityKgM3 || 1000.0;
  const npshr = suctionCondition.npshRequiredM || 2.5;

  // Convert pressures from bara to head (meters): h = (P * 1e5) / (rho * g)
  const pSuctHead = (suctionCondition.suctionPressureBara * 1e5) / (rho * G_ACCEL);
  const pVapHead = (suctionCondition.vaporPressureBara * 1e5) / (rho * G_ACCEL);

  const npsha = pSuctHead - pVapHead + suctionCondition.staticElevationM - suctionCondition.suctionFrictionLossM;
  const margin = npsha - npshr;

  return {
    npshaM: Number(npsha.toFixed(2)),
    npshrM: Number(npshr.toFixed(2)),
    marginM: Number(margin.toFixed(2)),
    isCavitationRisk: margin < 0.5,
    status: margin >= 1.0 ? "HEALTHY" : margin >= 0.5 ? "MARGINAL" : "CAVITATING"
  };
}

/**
 * Calculates piping frictional head loss via Darcy-Weisbach & Swamee-Jain explicit Colebrook equation
 * @param {number} flowM3H - Liquid volumetric flow (m^3/h)
 * @param {number} pipeDiameterMm - Internal pipe diameter (mm)
 * @param {number} pipeLengthM - Equivalent pipe length including fittings (m)
 * @param {number} [fluidDensityKgM3=1000] - Fluid density (kg/m^3)
 * @param {number} [viscosityCp=1.0] - Dynamic viscosity (cP or mPa.s)
 * @param {number} [roughnessMm=0.045] - Pipe absolute roughness (mm, standard commercial steel = 0.045 mm)
 * @returns {Object} Velocity, Reynolds number, friction factor, deltaP
 */
export function calculatePipeFrictionLoss(flowM3H, pipeDiameterMm, pipeLengthM, fluidDensityKgM3 = 1000.0, viscosityCp = 1.0, roughnessMm = 0.045) {
  const dM = pipeDiameterMm / 1000.0;
  const areaM2 = (Math.PI * Math.pow(dM, 2)) / 4.0;
  const velMS = (flowM3H / 3600.0) / areaM2;

  const muPaS = viscosityCp * 1e-3;
  const reynolds = (fluidDensityKgM3 * velMS * dM) / muPaS;

  let f = 0.02;
  if (reynolds < 2300) {
    // Laminar
    f = reynolds > 0 ? 64.0 / reynolds : 0.02;
  } else {
    // Turbulent - Swamee-Jain explicit Colebrook approximation
    const relRoughness = (roughnessMm / 1000.0) / dM;
    f = 0.25 / Math.pow(Math.log10(relRoughness / 3.7 + 5.74 / Math.pow(reynolds, 0.9)), 2);
  }

  // Darcy-Weisbach head loss: h_f = f * (L / D) * (v^2 / 2g)
  const headLossM = f * (pipeLengthM / dM) * (Math.pow(velMS, 2) / (2.0 * G_ACCEL));
  const pressureDropBar = (fluidDensityKgM3 * G_ACCEL * headLossM) / 1e5;

  return {
    velocityMS: Number(velMS.toFixed(2)),
    reynolds: Math.round(reynolds),
    frictionFactor: Number(f.toFixed(4)),
    headLossM: Number(headLossM.toFixed(2)),
    pressureDropBar: Number(pressureDropBar.toFixed(3))
  };
}

/**
 * Calculates Log Mean Temperature Difference (LMTD) and heat exchanger duty
 * @param {Object} temps
 * @param {number} temps.hotInC - Hot stream inlet temp (°C)
 * @param {number} temps.hotOutC - Hot stream outlet temp (°C)
 * @param {number} temps.coldInC - Cold stream inlet temp (°C)
 * @param {number} temps.coldOutC - Cold stream outlet temp (°C)
 * @param {number} areaM2 - Heat transfer surface area (m^2)
 * @param {number} uCoeffWM2K - Overall heat transfer coefficient U (W/m^2·K)
 * @param {number} [ft=1.0] - Cross-flow / multi-pass correction factor
 * @returns {Object} LMTD, heat duty (kW), required cooling water
 */
export function calculateHeatExchangerRating(temps, areaM2, uCoeffWM2K, ft = 1.0) {
  const dt1 = temps.hotInC - temps.coldOutC;
  const dt2 = temps.hotOutC - temps.coldInC;

  let lmtd = 0;
  if (Math.abs(dt1 - dt2) < 0.01) {
    lmtd = dt1;
  } else if (dt1 <= 0 || dt2 <= 0) {
    lmtd = 0.1; // Temperature cross or pinch
  } else {
    lmtd = (dt1 - dt2) / Math.log(dt1 / dt2);
  }

  const effectiveDt = lmtd * ft;
  // Duty Q = U * A * effectiveDt (Watts -> kW)
  const dutyKw = (uCoeffWM2K * areaM2 * effectiveDt) / 1000.0;

  // Required cooling water flow for given deltaT (assuming Cp = 4.184 kJ/kg·K)
  const cwDeltaT = Math.max(1, temps.coldOutC - temps.coldInC);
  const cwFlowKgH = (dutyKw * 3600.0) / (4.184 * cwDeltaT);

  return {
    lmtdC: Number(lmtd.toFixed(2)),
    effectiveDtC: Number(effectiveDt.toFixed(2)),
    dutyKw: Number(dutyKw.toFixed(1)),
    coolingWaterRequiredM3H: Number((cwFlowKgH / 1000.0).toFixed(2))
  };
}
