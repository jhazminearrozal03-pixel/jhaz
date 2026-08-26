-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "basicMonthlySalary" REAL NOT NULL,
    "dailyRate" REAL NOT NULL,
    "position" TEXT NOT NULL,
    "portalPassword" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "hoursWorked" REAL NOT NULL,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "lateMinutes" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttendanceLog_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "payPeriodStart" DATETIME NOT NULL,
    "payPeriodEnd" DATETIME NOT NULL,
    "grossPay" REAL NOT NULL,
    "sssDeduction" REAL NOT NULL,
    "philhealthDeduction" REAL NOT NULL,
    "pagibigDeduction" REAL NOT NULL,
    "taxDeduction" REAL NOT NULL,
    "totalDeductions" REAL NOT NULL,
    "netPay" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PayrollRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");

-- CreateIndex
CREATE INDEX "AttendanceLog_employeeId_idx" ON "AttendanceLog"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceLog_employeeId_date_key" ON "AttendanceLog"("employeeId", "date");

-- CreateIndex
CREATE INDEX "PayrollRecord_employeeId_idx" ON "PayrollRecord"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRecord_employeeId_payPeriodStart_payPeriodEnd_key" ON "PayrollRecord"("employeeId", "payPeriodStart", "payPeriodEnd");
