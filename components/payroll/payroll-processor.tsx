"use client";

import { useState } from "react";
import { Calculator, Lock, Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface PayrollRecord {
  id: string;
  employeeId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  grossPay: number;
  sssDeduction: number;
  philhealthDeduction: number;
  pagibigDeduction: number;
  taxDeduction: number;
  totalDeductions: number;
  netPay: number;
  status: "DRAFT" | "APPROVED" | "LOCKED";
  employee: { name: string; department: string };
}

function firstHalfOfMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 15);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function PayrollProcessor() {
  const defaults = firstHalfOfMonth();
  const [payPeriodStart, setPayPeriodStart] = useState(defaults.start);
  const [payPeriodEnd, setPayPeriodEnd] = useState(defaults.end);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [processing, setProcessing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedMessage, setApprovedMessage] = useState<string | null>(null);

  async function handleProcess() {
    setProcessing(true);
    setError(null);
    setApprovedMessage(null);

    const res = await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payPeriodStart, payPeriodEnd }),
    });
    const data = await res.json();
    setProcessing(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to process payroll.");
      setRecords([]);
      return;
    }
    setRecords(data);
  }

  async function handleApproveAndLock() {
    setApproving(true);
    setError(null);
    setApprovedMessage(null);

    const res = await fetch("/api/payroll/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payPeriodStart, payPeriodEnd }),
    });
    const data = await res.json();
    setApproving(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to approve payroll.");
      return;
    }

    setRecords(data.records);
    setApprovedMessage(`Locked ${data.lockedCount} payroll record(s).`);
  }

  const totals = records.reduce(
    (acc, r) => ({
      grossPay: acc.grossPay + r.grossPay,
      totalDeductions: acc.totalDeductions + r.totalDeductions,
      netPay: acc.netPay + r.netPay,
    }),
    { grossPay: 0, totalDeductions: 0, netPay: 0 }
  );

  const allLocked = records.length > 0 && records.every((r) => r.status === "LOCKED");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payroll Processing</h1>
        <p className="text-muted-foreground text-sm">
          Compute gross pay, statutory deductions, and net pay for a pay period.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Pay Period</CardTitle>
          <CardDescription>Attendance logs within this range will be used.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={payPeriodStart}
                onChange={(e) => setPayPeriodStart(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                value={payPeriodEnd}
                onChange={(e) => setPayPeriodEnd(e.target.value)}
              />
            </div>
            <Button onClick={handleProcess} disabled={processing}>
              {processing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Calculator className="size-4" />
              )}
              Process Payroll
            </Button>
          </div>
          {error && <p className="text-destructive mt-3 text-sm">{error}</p>}
        </CardContent>
      </Card>

      {records.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Payroll Results</CardTitle>
              <CardDescription>
                {records.length} employee(s) for {payPeriodStart} to {payPeriodEnd}
              </CardDescription>
            </div>
            <Button
              onClick={handleApproveAndLock}
              disabled={approving || allLocked}
              variant={allLocked ? "secondary" : "default"}
            >
              {approving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : allLocked ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <Lock className="size-4" />
              )}
              {allLocked ? "Payroll Locked" : "Approve & Lock Payroll"}
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {approvedMessage && (
              <p className="text-success mb-3 text-sm font-medium">{approvedMessage}</p>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Gross Pay</TableHead>
                    <TableHead className="text-right">SSS</TableHead>
                    <TableHead className="text-right">PhilHealth</TableHead>
                    <TableHead className="text-right">Pag-IBIG</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total Deductions</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.employee.name}</div>
                        <div className="text-muted-foreground text-xs">{r.employeeId}</div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(r.grossPay)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.sssDeduction)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(r.philhealthDeduction)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(r.pagibigDeduction)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(r.taxDeduction)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(r.totalDeductions)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(r.netPay)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "LOCKED" ? "success" : "secondary"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>Totals</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.grossPay)}</TableCell>
                    <TableCell colSpan={3} />
                    <TableCell className="text-right" />
                    <TableCell className="text-right">
                      {formatCurrency(totals.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.netPay)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
