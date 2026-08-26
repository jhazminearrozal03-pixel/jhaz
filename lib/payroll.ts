// Philippine statutory payroll deduction calculators.
// Rates and brackets are simplified approximations of SSS, PhilHealth,
// Pag-IBIG, and BIR (TRAIN law) rules for demonstration purposes.

export interface SSSResult {
  msc: number;
  employeeShare: number;
  employerShare: number;
  total: number;
}

export interface PhilHealthResult {
  base: number;
  employeeShare: number;
  employerShare: number;
  total: number;
}

export interface PagIbigResult {
  employeeShare: number;
  employerShare: number;
  total: number;
}

export type PayPeriodType = "monthly" | "semi-monthly";

const SSS_RATE = 0.15;
const SSS_EMPLOYEE_RATE = 0.05;
const SSS_EMPLOYER_RATE = SSS_RATE - SSS_EMPLOYEE_RATE;
const SSS_MSC_CAP = 35000;
const SSS_MSC_FLOOR = 4000;

/** SSS: 15% total rate (10% employer / 5% employee), MSC capped at PHP 35,000. */
export function calculateSSS(monthlySalary: number): SSSResult {
  const msc = Math.min(Math.max(monthlySalary, SSS_MSC_FLOOR), SSS_MSC_CAP);
  const employeeShare = round2(msc * SSS_EMPLOYEE_RATE);
  const employerShare = round2(msc * SSS_EMPLOYER_RATE);
  return { msc, employeeShare, employerShare, total: round2(employeeShare + employerShare) };
}

const PHILHEALTH_RATE = 0.05;
const PHILHEALTH_EMPLOYEE_RATE = 0.025;
const PHILHEALTH_EMPLOYER_RATE = PHILHEALTH_RATE - PHILHEALTH_EMPLOYEE_RATE;
const PHILHEALTH_FLOOR = 10000;
const PHILHEALTH_CEILING = 100000;

/** PhilHealth: 5% total rate split 2.5%/2.5%, base floored at 10,000 and ceilinged at 100,000. */
export function calculatePhilHealth(monthlySalary: number): PhilHealthResult {
  const base = Math.min(Math.max(monthlySalary, PHILHEALTH_FLOOR), PHILHEALTH_CEILING);
  const employeeShare = round2(base * PHILHEALTH_EMPLOYEE_RATE);
  const employerShare = round2(base * PHILHEALTH_EMPLOYER_RATE);
  return { base, employeeShare, employerShare, total: round2(employeeShare + employerShare) };
}

const PAGIBIG_EMPLOYEE_RATE = 0.02;
const PAGIBIG_EMPLOYER_RATE = 0.02;
const PAGIBIG_EMPLOYEE_CAP = 200;

/** Pag-IBIG: 2% employee share, capped at PHP 200/month. Employer matches 2% (uncapped here for simplicity). */
export function calculatePagIbig(monthlySalary: number): PagIbigResult {
  const employeeShare = round2(Math.min(monthlySalary * PAGIBIG_EMPLOYEE_RATE, PAGIBIG_EMPLOYEE_CAP));
  const employerShare = round2(monthlySalary * PAGIBIG_EMPLOYER_RATE);
  return { employeeShare, employerShare, total: round2(employeeShare + employerShare) };
}

// BIR TRAIN law progressive withholding tax brackets (monthly, effective 2023 onward).
const MONTHLY_TAX_BRACKETS = [
  { over: 0, base: 0, rate: 0 },
  { over: 20833, base: 0, rate: 0.15 },
  { over: 33333, base: 1875, rate: 0.2 },
  { over: 66667, base: 8541.8, rate: 0.25 },
  { over: 166667, base: 33541.8, rate: 0.3 },
  { over: 666667, base: 183541.8, rate: 0.35 },
];

// Semi-monthly brackets are exactly half of the monthly thresholds/bases.
const SEMI_MONTHLY_TAX_BRACKETS = MONTHLY_TAX_BRACKETS.map((b) => ({
  over: round2(b.over / 2),
  base: round2(b.base / 2),
  rate: b.rate,
}));

/** BIR withholding tax using progressive brackets on taxable income for the given pay period type. */
export function calculateWithholdingTax(
  taxableIncome: number,
  periodType: PayPeriodType = "monthly"
): number {
  const brackets = periodType === "monthly" ? MONTHLY_TAX_BRACKETS : SEMI_MONTHLY_TAX_BRACKETS;
  let applicable = brackets[0];
  for (const bracket of brackets) {
    if (taxableIncome >= bracket.over) {
      applicable = bracket;
    } else {
      break;
    }
  }
  const tax = applicable.base + (taxableIncome - applicable.over) * applicable.rate;
  return round2(Math.max(tax, 0));
}

export interface AttendanceTotals {
  hoursWorked: number;
  overtimeHours: number;
  lateMinutes: number;
}

export interface PayrollComputationInput {
  basicMonthlySalary: number;
  dailyRate: number;
  attendance: AttendanceTotals;
  payPeriodStart: Date;
  payPeriodEnd: Date;
}

export interface PayrollComputationResult {
  grossPay: number;
  regularPay: number;
  overtimePay: number;
  lateDeduction: number;
  sss: SSSResult;
  philhealth: PhilHealthResult;
  pagibig: PagIbigResult;
  taxDeduction: number;
  totalDeductions: number;
  netPay: number;
  periodType: PayPeriodType;
}

const OVERTIME_MULTIPLIER = 1.25;
const STANDARD_HOURS_PER_DAY = 8;

/** Determines whether a pay period is semi-monthly (~half a month) or monthly based on its span. */
export function getPayPeriodType(start: Date, end: Date): PayPeriodType {
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
  return days <= 16 ? "semi-monthly" : "monthly";
}

/** Full payroll computation: gross pay from attendance, statutory deductions, and net pay. */
export function computePayroll(input: PayrollComputationInput): PayrollComputationResult {
  const { basicMonthlySalary, dailyRate, attendance, payPeriodStart, payPeriodEnd } = input;
  const hourlyRate = dailyRate / STANDARD_HOURS_PER_DAY;

  const regularPay = round2(attendance.hoursWorked * hourlyRate);
  const overtimePay = round2(attendance.overtimeHours * hourlyRate * OVERTIME_MULTIPLIER);
  const lateDeduction = round2((attendance.lateMinutes / 60) * hourlyRate);
  const grossPay = round2(regularPay + overtimePay - lateDeduction);

  const sss = calculateSSS(basicMonthlySalary);
  const philhealth = calculatePhilHealth(basicMonthlySalary);
  const pagibig = calculatePagIbig(basicMonthlySalary);

  const periodType = getPayPeriodType(payPeriodStart, payPeriodEnd);
  const taxableIncome = round2(
    grossPay - sss.employeeShare - philhealth.employeeShare - pagibig.employeeShare
  );
  const taxDeduction = calculateWithholdingTax(taxableIncome, periodType);

  const totalDeductions = round2(
    sss.employeeShare + philhealth.employeeShare + pagibig.employeeShare + taxDeduction
  );
  const netPay = round2(grossPay - totalDeductions);

  return {
    grossPay,
    regularPay,
    overtimePay,
    lateDeduction,
    sss,
    philhealth,
    pagibig,
    taxDeduction,
    totalDeductions,
    netPay,
    periodType,
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
