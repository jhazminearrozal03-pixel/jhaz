import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

// Duplicated from lib/password.ts (which is guarded with `server-only` and can't be
// imported from this standalone script) so seeded team members get a real scrypt hash.
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

const teamMembers = [
  {
    email: "juan.delacruz@example.com",
    name: "Juan Dela Cruz",
    password: "changeme123",
    // Replace with the numeric user id from Monday.com (Admin > Users, or the users() API query)
    // so tasks assigned to this person on your board link to them automatically.
    mondayUserId: null as string | null,
  },
  {
    email: "angela.reyes@example.com",
    name: "Angela Reyes",
    password: "changeme123",
    mondayUserId: null as string | null,
  },
];

const employees = [
  {
    employeeId: "EMP-001",
    name: "Maria Santos",
    department: "Finance",
    basicMonthlySalary: 35000,
    position: "Accountant",
    portalPassword: "changeme123",
  },
  {
    employeeId: "EMP-002",
    name: "Juan Dela Cruz",
    department: "Engineering",
    basicMonthlySalary: 55000,
    position: "Software Engineer",
    portalPassword: "changeme123",
  },
  {
    employeeId: "EMP-003",
    name: "Angela Reyes",
    department: "Human Resources",
    basicMonthlySalary: 28000,
    position: "HR Officer",
    portalPassword: "changeme123",
  },
  {
    employeeId: "EMP-004",
    name: "Mark Villanueva",
    department: "Sales",
    basicMonthlySalary: 22000,
    position: "Sales Associate",
    portalPassword: "changeme123",
  },
  {
    employeeId: "EMP-005",
    name: "Kristine Bautista",
    department: "Engineering",
    basicMonthlySalary: 68000,
    position: "Engineering Lead",
    portalPassword: "changeme123",
  },
];

const WORK_DAYS_PER_MONTH = 22;

function dailyRateFor(basicMonthlySalary: number) {
  return Math.round((basicMonthlySalary / WORK_DAYS_PER_MONTH) * 100) / 100;
}

// Builds attendance logs for the first half of the current month (a semi-monthly pay period).
function buildAttendanceForEmployee(employeeId: string, seedIndex: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const logs: {
    employeeId: string;
    date: Date;
    hoursWorked: number;
    overtimeHours: number;
    lateMinutes: number;
  }[] = [];

  for (let day = 1; day <= 15; day++) {
    const date = new Date(Date.UTC(year, month, day));
    const dayOfWeek = date.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    const isLateDay = (day + seedIndex) % 5 === 0;
    const isOvertimeDay = (day + seedIndex) % 4 === 0;

    logs.push({
      employeeId,
      date,
      hoursWorked: 8,
      overtimeHours: isOvertimeDay ? 2 : 0,
      lateMinutes: isLateDay ? 15 : 0,
    });
  }

  return logs;
}

async function main() {
  console.log("Seeding employees...");

  for (const [index, emp] of employees.entries()) {
    await prisma.employee.upsert({
      where: { employeeId: emp.employeeId },
      update: {},
      create: {
        ...emp,
        dailyRate: dailyRateFor(emp.basicMonthlySalary),
      },
    });

    const logs = buildAttendanceForEmployee(emp.employeeId, index);
    for (const log of logs) {
      await prisma.attendanceLog.upsert({
        where: {
          employeeId_date: {
            employeeId: log.employeeId,
            date: log.date,
          },
        },
        update: log,
        create: log,
      });
    }
  }

  console.log(`Seeded ${employees.length} employees with attendance logs.`);

  console.log("Seeding team members...");
  for (const member of teamMembers) {
    await prisma.teamMember.upsert({
      where: { email: member.email },
      update: {},
      create: {
        email: member.email,
        name: member.name,
        passwordHash: hashPassword(member.password),
        mondayUserId: member.mondayUserId,
      },
    });
  }
  console.log(`Seeded ${teamMembers.length} team members.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
