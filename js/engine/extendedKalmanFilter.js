/**
 * DISCRETE EXTENDED KALMAN FILTER (EKF) & STATE OBSERVER CORE
 *
 * Industrial-grade recursive state estimator providing:
 * 1. Nonlinear state propagation: x_pred = f(x, u, dt)
 * 2. Error covariance propagation: P_pred = F * P * F^T + Q
 * 3. Innovation residual calculation: r = y - h(x_pred)
 * 4. Innovation covariance: S = H * P_pred * H^T + R
 * 5. Kalman Gain computation: K = P_pred * H^T * S^-1
 * 6. State update: x_est = x_pred + K * r
 * 7. Joseph-Form Covariance Update (guaranteed positive semi-definite):
 *    P_est = (I - K*H) * P_pred * (I - K*H)^T + K * R * K^T
 * 8. Normalized Innovation Squared (NIS) Chi-Square Outlier Gating
 * 9. Dynamic 95% Confidence Interval Calculation (+/- 1.96 * sigma)
 */

export class ExtendedKalmanFilter {
  /**
   * @param {Object} config
   * @param {number} config.stateDimension - Number of states (n)
   * @param {number} config.measDimension - Number of measurements (p)
   * @param {number[]} config.initialState - Initial state vector x0 [n]
   * @param {number[][]} config.initialCovariance - Initial error covariance P0 [n x n]
   * @param {number[][]} config.processNoise - Process noise covariance Q [n x n]
   * @param {number[][]} config.measurementNoise - Measurement noise covariance R [p x p]
   * @param {Function} config.stateTransitionFn - f(x, u, dt) -> x_pred
   * @param {Function} config.stateJacobianFn - F(x, u, dt) -> [n x n]
   * @param {Function} config.measurementFn - h(x) -> y_pred [p]
   * @param {Function} config.measurementJacobianFn - H(x) -> [p x n]
   * @param {number} [config.chiSquareThreshold=9.21] - NIS gate (p=2 -> 9.21 is 99% confidence)
   */
  constructor(config) {
    this.n = config.stateDimension || 1;
    this.p = config.measDimension || 1;

    this.x = [...(config.initialState || new Array(this.n).fill(0))];
    this.P = config.initialCovariance ? this.cloneMatrix(config.initialCovariance) : this.identityMatrix(this.n, 1.0);
    this.Q = config.processNoise ? this.cloneMatrix(config.processNoise) : this.identityMatrix(this.n, 0.01);
    this.R = config.measurementNoise ? this.cloneMatrix(config.measurementNoise) : this.identityMatrix(this.p, 0.05);

    this.f = config.stateTransitionFn || ((x, u, dt) => [...x]);
    this.F = config.stateJacobianFn || ((x, u, dt) => this.identityMatrix(this.n, 1.0));
    this.h = config.measurementFn || ((x) => [x[0]]);
    this.H = config.measurementJacobianFn || ((x) => [[1, ...new Array(this.n - 1).fill(0)]]);

    this.chiSquareThreshold = config.chiSquareThreshold || (this.p === 1 ? 6.63 : (this.p === 2 ? 9.21 : 11.34));

    // Diagnostic Metrics
    this.lastInnovation = new Array(this.p).fill(0);
    this.lastNIS = 0;
    this.isOutlierRejected = false;
    this.status = "OPTIMAL_CONVERGED"; // 'OPTIMAL_CONVERGED' | 'TRACKING' | 'OUTLIER_REJECTED' | 'HIGH_INNOVATION'
    this.stepCount = 0;
  }

  /**
   * Performs full EKF Predict + Update cycle
   * @param {number[]} measurements - Vector of physical noisy measurements z [p]
   * @param {any} inputs - Control inputs / manipulated variables u
   * @param {number} dt - Time step in seconds
   * @returns {Object} { state, stdDev, confidenceBounds, nis, status }
   */
  step(measurements, inputs, dt = 0.25) {
    this.stepCount++;

    // -------------------------------------------------------------
    // 1. Time Update (Predict Step)
    // -------------------------------------------------------------
    // Prior State: x_pred = f(x, u, dt)
    const xPred = this.f(this.x, inputs, dt);

    // Prior Jacobian: F = df/dx
    const F = this.F(this.x, inputs, dt);

    // Prior Covariance: P_pred = F * P * F^T + Q
    const FP = this.multiplyMatrices(F, this.P);
    const FT = this.transpose(F);
    const FPFT = this.multiplyMatrices(FP, FT);
    const PPred = this.addMatrices(FPFT, this.Q);

    // -------------------------------------------------------------
    // 2. Measurement Update (Correct Step)
    // -------------------------------------------------------------
    if (!measurements || measurements.length === 0) {
      // Open-loop prediction if no sensor measurement is available
      this.x = xPred;
      this.P = PPred;
      this.status = "OPEN_LOOP_PREDICTION";
      return this.getStateSummary();
    }

    // Expected Measurement: y_pred = h(x_pred)
    const yPred = this.h(xPred);

    // Measurement Jacobian: H = dh/dx
    const H = this.H(xPred);

    // Innovation Residual: r = z - y_pred
    const r = [];
    for (let i = 0; i < this.p; i++) {
      r[i] = measurements[i] - yPred[i];
    }
    this.lastInnovation = [...r];

    // Innovation Covariance: S = H * P_pred * H^T + R
    const HP = this.multiplyMatrices(H, PPred);
    const HT = this.transpose(H);
    const HPHT = this.multiplyMatrices(HP, HT);
    const S = this.addMatrices(HPHT, this.R);

    // Invert Innovation Covariance: S_inv
    const SInv = this.invertMatrix(S);

    // Normalized Innovation Squared (NIS): eps = r^T * S_inv * r
    // Used for Chi-Square Outlier Rejection Gate (sensor spike rejection)
    let nis = 0;
    if (SInv) {
      for (let i = 0; i < this.p; i++) {
        for (let j = 0; j < this.p; j++) {
          nis += r[i] * SInv[i][j] * r[j];
        }
      }
    }
    this.lastNIS = Number(nis.toFixed(3));

    // Check Chi-Square Gate
    if (nis > this.chiSquareThreshold && this.stepCount > 5) {
      // Measurement is statistically an outlier (>99% confidence)!
      // Reject gross sensor fault and accept prior prediction
      this.isOutlierRejected = true;
      this.status = "OUTLIER_REJECTED";
      this.x = xPred;
      this.P = PPred;
      return this.getStateSummary();
    }

    this.isOutlierRejected = false;

    // Kalman Gain: K = P_pred * H^T * S_inv
    const PHT = this.multiplyMatrices(PPred, HT);
    const K = SInv ? this.multiplyMatrices(PHT, SInv) : this.zerosMatrix(this.n, this.p);

    // State Correction: x_est = x_pred + K * r
    const xEst = [...xPred];
    for (let i = 0; i < this.n; i++) {
      let delta = 0;
      for (let j = 0; j < this.p; j++) {
        delta += K[i][j] * r[j];
      }
      xEst[i] += delta;
    }

    // Joseph-Form Covariance Update (Guarantees numerical stability and P >= 0):
    // P_est = (I - K*H) * P_pred * (I - K*H)^T + K * R * K^T
    const I = this.identityMatrix(this.n, 1.0);
    const KH = this.multiplyMatrices(K, H);
    const I_KH = this.subtractMatrices(I, KH);
    const I_KHT = this.transpose(I_KH);

    const term1 = this.multiplyMatrices(this.multiplyMatrices(I_KH, PPred), I_KHT);
    const KT = this.transpose(K);
    const term2 = this.multiplyMatrices(this.multiplyMatrices(K, this.R), KT);
    const PEst = this.addMatrices(term1, term2);

    this.x = xEst;
    this.P = PEst;

    // Health Classification
    const traceP = this.getTrace(this.P);
    if (nis > this.chiSquareThreshold * 0.7) {
      this.status = "HIGH_INNOVATION";
    } else if (traceP < 0.05) {
      this.status = "OPTIMAL_CONVERGED";
    } else {
      this.status = "TRACKING";
    }

    return this.getStateSummary();
  }

  /**
   * Offline LIMS / Laboratory Assay calibration state reset
   * Updates state with a high-accuracy laboratory reference
   */
  applyLabCalibration(stateIndex, labTrueValue, labUncertaintyR = 0.001) {
    if (stateIndex >= 0 && stateIndex < this.n) {
      this.x[stateIndex] = labTrueValue;
      this.P[stateIndex][stateIndex] = labUncertaintyR;
      this.status = "CALIBRATED_LIMS";
    }
  }

  getStateSummary() {
    const stdDevs = [];
    const confidenceBounds = [];

    for (let i = 0; i < this.n; i++) {
      const variance = Math.max(this.P[i][i], 1e-12);
      const sigma = Math.sqrt(variance);
      stdDevs.push(Number(sigma.toFixed(4)));
      const lowVal = Number((this.x[i] - 1.96 * sigma).toFixed(3));
      const highVal = Number((this.x[i] + 1.96 * sigma).toFixed(3));
      confidenceBounds.push({
        low: lowVal,
        high: highVal,
        lower: lowVal,
        upper: highVal
      });
    }

    return {
      state: [...this.x],
      stdDev: stdDevs,
      confidenceBounds,
      nis: this.lastNIS,
      status: this.status,
      isOutlierRejected: this.isOutlierRejected
    };
  }

  // ===============================================================
  // MATRIX ALGEBRA UTILITIES
  // ===============================================================
  identityMatrix(size, val = 1.0) {
    const mat = [];
    for (let i = 0; i < size; i++) {
      mat[i] = new Array(size).fill(0);
      mat[i][i] = val;
    }
    return mat;
  }

  zerosMatrix(rows, cols) {
    const mat = [];
    for (let i = 0; i < rows; i++) {
      mat[i] = new Array(cols).fill(0);
    }
    return mat;
  }

  cloneMatrix(mat) {
    return mat.map((row) => [...row]);
  }

  addMatrices(A, B) {
    const rows = A.length;
    const cols = A[0].length;
    const C = [];
    for (let i = 0; i < rows; i++) {
      C[i] = [];
      for (let j = 0; j < cols; j++) {
        C[i][j] = A[i][j] + B[i][j];
      }
    }
    return C;
  }

  subtractMatrices(A, B) {
    const rows = A.length;
    const cols = A[0].length;
    const C = [];
    for (let i = 0; i < rows; i++) {
      C[i] = [];
      for (let j = 0; j < cols; j++) {
        C[i][j] = A[i][j] - B[i][j];
      }
    }
    return C;
  }

  multiplyMatrices(A, B) {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    const C = [];
    for (let i = 0; i < rowsA; i++) {
      C[i] = new Array(colsB).fill(0);
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += A[i][k] * B[k][j];
        }
        C[i][j] = sum;
      }
    }
    return C;
  }

  transpose(A) {
    const rows = A.length;
    const cols = A[0].length;
    const AT = [];
    for (let j = 0; j < cols; j++) {
      AT[j] = [];
      for (let i = 0; i < rows; i++) {
        AT[j][i] = A[i][j];
      }
    }
    return AT;
  }

  getTrace(A) {
    let tr = 0;
    for (let i = 0; i < A.length; i++) {
      tr += A[i][i] || 0;
    }
    return tr;
  }

  /**
   * Inverts a 1x1, 2x2, or 3x3 matrix (sufficient for industrial sensor innovation spaces)
   */
  invertMatrix(A) {
    const n = A.length;
    if (n === 1) {
      const val = A[0][0];
      if (Math.abs(val) < 1e-12) return [[1e6]];
      return [[1.0 / val]];
    }
    if (n === 2) {
      const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      if (Math.abs(det) < 1e-12) return null;
      const invDet = 1.0 / det;
      return [
        [A[1][1] * invDet, -A[0][1] * invDet],
        [-A[1][0] * invDet, A[0][0] * invDet]
      ];
    }
    if (n === 3) {
      const a = A[0][0], b = A[0][1], c = A[0][2];
      const d = A[1][0], e = A[1][1], f = A[1][2];
      const g = A[2][0], h = A[2][1], k = A[2][2];

      const det = a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g);
      if (Math.abs(det) < 1e-12) return null;
      const invDet = 1.0 / det;

      return [
        [(e * k - f * h) * invDet, (c * h - b * k) * invDet, (b * f - c * e) * invDet],
        [(f * g - d * k) * invDet, (a * k - c * g) * invDet, (c * d - a * f) * invDet],
        [(d * h - e * g) * invDet, (g * b - a * h) * invDet, (a * e - b * d) * invDet]
      ];
    }

    // Default diagonal fallback
    const res = this.identityMatrix(n);
    for (let i = 0; i < n; i++) {
      res[i][i] = Math.abs(A[i][i]) > 1e-12 ? 1.0 / A[i][i] : 1e6;
    }
    return res;
  }
}
