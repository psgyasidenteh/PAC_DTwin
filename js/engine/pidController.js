/**
 * INDUSTRIAL ISA-5.1 DISCRETE PID & ACTUATOR ENGINE
 *
 * Implements standard ISA parallel form with:
 * - Anti-reset windup (clamping & back-calculation)
 * - Derivative filter on measurement PV (eliminates derivative kick & filters noise)
 * - Actuator dynamics: Slew-rate limiting (%/sec)
 * - Non-linear valve trim characteristics (Linear, Equal Percentage R=50, Quick Opening)
 * - Bumpless transfer between MANUAL, AUTO, and CASCADE modes
 * - Direct (Cooling) vs. Reverse (Heating) acting selection
 */

export class PIDController {
  /**
   * @param {Object} config
   * @param {string} config.tag - ISA-5.1 tag (e.g. "TIC-605")
   * @param {number} config.kp - Proportional gain
   * @param {number} config.ti - Integral time (seconds, > 0)
   * @param {number} [config.td=0] - Derivative time (seconds)
   * @param {number} [config.derivativeFilterN=10] - Derivative low-pass filter coefficient
   * @param {number} [config.opMin=0] - Minimum output limit (%)
   * @param {number} [config.opMax=100] - Maximum output limit (%)
   * @param {number} [config.slewRate=10.0] - Maximum actuator stroke rate (%/sec)
   * @param {string} [config.action="REVERSE"] - "REVERSE" (Heating: PV < SP -> OP increases) or "DIRECT" (Cooling: PV > SP -> OP increases)
   * @param {string} [config.valveTrim="EQUAL_PERCENTAGE"] - "LINEAR", "EQUAL_PERCENTAGE", or "QUICK_OPENING"
   * @param {string} [config.failPosition="FC"] - "FC" (Fail Closed / Air-to-Open) or "FO" (Fail Open / Air-to-Close)
   * @param {string} [config.mode="AUTO"] - "MANUAL", "AUTO", "CASCADE"
   */
  constructor(config) {
    this.tag = config.tag || "PID-LOOP";
    this.kp = config.kp !== undefined ? config.kp : 1.0;
    this.ti = config.ti && config.ti > 0 ? config.ti : 30.0;
    this.td = config.td !== undefined ? config.td : 0.0;
    this.derivativeFilterN = config.derivativeFilterN || 10.0;

    this.opMin = config.opMin !== undefined ? config.opMin : 0.0;
    this.opMax = config.opMax !== undefined ? config.opMax : 100.0;
    this.slewRate = config.slewRate || 10.0; // % per second
    this.action = config.action || "REVERSE";
    this.valveTrim = config.valveTrim || "EQUAL_PERCENTAGE";
    this.failPosition = config.failPosition || "FC";
    this.mode = config.mode || "AUTO";

    // Internal State Variables
    this.sp = config.sp !== undefined ? config.sp : 50.0;
    this.pv = config.pv !== undefined ? config.pv : 50.0;
    this.lastPv = this.pv;

    this.integral = 0.0;
    this.derivative = 0.0;
    this.rawOp = config.op !== undefined ? config.op : 50.0; // Desired controller output
    this.actuatorOp = this.rawOp; // Actual physical valve position after slew rate

    this.isSaturatedHigh = false;
    this.isSaturatedLow = false;
  }

  /**
   * Bumplessly sets the control mode.
   * When switching to AUTO, the integrator is initialized to avoid jumps.
   * When switching to MANUAL, the manual output target matches current valve position.
   */
  setMode(newMode) {
    if (newMode === this.mode) return;

    if (newMode === "AUTO" && this.mode === "MANUAL") {
      // Bumpless transfer: balance integral term so output matches current actuatorOp
      const error = this.action === "REVERSE" ? (this.sp - this.pv) : (this.pv - this.sp);
      const pTerm = this.kp * error;
      this.integral = Math.max(this.opMin, Math.min(this.opMax, this.actuatorOp - pTerm));
      this.rawOp = this.actuatorOp;
    } else if (newMode === "MANUAL") {
      this.rawOp = this.actuatorOp;
    }

    this.mode = newMode;
  }

  /**
   * Setpoint adjustment
   */
  setSetpoint(newSp) {
    this.sp = Number(newSp);
  }

  /**
   * Manual output adjustment (only used when in MANUAL mode)
   */
  setManualOutput(targetOp) {
    if (this.mode === "MANUAL") {
      this.rawOp = Math.max(this.opMin, Math.min(this.opMax, Number(targetOp)));
    }
  }

  /**
   * Discrete time-step update of PID algorithm and valve dynamics
   * @param {number} pv - Current process variable
   * @param {number} dt - Time step in seconds (e.g. 0.25 s)
   * @param {number} [cascadeSp] - Optional external setpoint if in CASCADE mode
   * @returns {Object} Loop execution telemetry
   */
  step(pv, dt, cascadeSp = null) {
    this.pv = pv;
    if (dt <= 0) dt = 0.25;

    if (this.mode === "CASCADE" && cascadeSp !== null) {
      this.sp = cascadeSp;
    }

    if (this.mode === "AUTO" || this.mode === "CASCADE") {
      // 1. Error calculation with Action (Direct vs Reverse)
      const error = this.action === "REVERSE" ? (this.sp - this.pv) : (this.pv - this.sp);

      // 2. Proportional Term
      const pTerm = this.kp * error;

      // 3. Derivative Term with low-pass filter on PV (derivative-on-measurement)
      // dPV/dt eliminates setpoint kick on SP steps
      let dTerm = 0.0;
      if (this.td > 0) {
        const dPv = this.pv - this.lastPv;
        const alpha = this.td / (this.td + this.derivativeFilterN * dt);
        const sign = this.action === "REVERSE" ? -1.0 : 1.0;
        this.derivative = alpha * this.derivative + sign * (this.kp * this.td * this.derivativeFilterN / (this.td + this.derivativeFilterN * dt)) * dPv;
        dTerm = this.derivative;
      } else {
        this.derivative = 0.0;
      }

      // 4. Integral Term with Anti-Reset Windup Clamping
      const iChange = (this.kp * dt / this.ti) * error;
      const tentativeOp = pTerm + (this.integral + iChange) + dTerm;

      // Anti-windup condition: do not accumulate integral if output is saturated in the direction of error
      if (tentativeOp > this.opMax) {
        this.isSaturatedHigh = true;
        this.isSaturatedLow = false;
        if (error < 0) {
          // Error is trying to bring it back down: allow integration
          this.integral += iChange;
        }
      } else if (tentativeOp < this.opMin) {
        this.isSaturatedLow = true;
        this.isSaturatedHigh = false;
        if (error > 0) {
          // Error is trying to bring it back up: allow integration
          this.integral += iChange;
        }
      } else {
        this.isSaturatedHigh = false;
        this.isSaturatedLow = false;
        this.integral += iChange;
      }

      // Clamp integral within physical bounds
      this.integral = Math.max(this.opMin - 20, Math.min(this.opMax + 20, this.integral));

      // Calculate raw desired output
      const calculatedOp = pTerm + this.integral + dTerm;
      this.rawOp = Math.max(this.opMin, Math.min(this.opMax, calculatedOp));
    }

    // 5. Actuator Physical Slew-Rate Limiting
    const maxStep = this.slewRate * dt;
    const deltaOp = this.rawOp - this.actuatorOp;

    if (Math.abs(deltaOp) <= maxStep) {
      this.actuatorOp = this.rawOp;
    } else {
      this.actuatorOp += Math.sign(deltaOp) * maxStep;
    }

    this.actuatorOp = Math.max(this.opMin, Math.min(this.opMax, this.actuatorOp));
    this.lastPv = this.pv;

    // 6. Installed Flow Fraction from Valve Trim Curve
    const flowFraction = this.calculateTrimFlowFraction(this.actuatorOp);

    return {
      tag: this.tag,
      mode: this.mode,
      sp: this.sp,
      pv: this.pv,
      error: this.sp - this.pv,
      rawOp: Number(this.rawOp.toFixed(2)),
      actuatorOp: Number(this.actuatorOp.toFixed(2)),
      flowFraction: Number(flowFraction.toFixed(4)),
      isSaturated: this.isSaturatedHigh || this.isSaturatedLow,
      pTerm: Number((this.kp * (this.action === "REVERSE" ? (this.sp - this.pv) : (this.pv - this.sp))).toFixed(2)),
      iTerm: Number(this.integral.toFixed(2)),
      dTerm: Number(this.derivative.toFixed(2))
    };
  }

  /**
   * Converts percentage valve opening to normalized flow coefficient (Kv / Cv fraction)
   * based on installed trim characteristic.
   * @param {number} op - Actuator opening (0 - 100%)
   * @returns {number} Flow fraction (0.0 - 1.0)
   */
  calculateTrimFlowFraction(op) {
    const x = Math.max(0, Math.min(100, op)) / 100.0;
    if (x <= 0.001) return 0.0;

    switch (this.valveTrim) {
      case "LINEAR":
        return x;
      case "EQUAL_PERCENTAGE": {
        // Equal percentage curve: f(x) = R^(x - 1) with rangeability R = 50
        const R = 50.0;
        return Math.pow(R, x - 1.0);
      }
      case "QUICK_OPENING":
        return Math.sqrt(x);
      default:
        return x;
    }
  }
}
