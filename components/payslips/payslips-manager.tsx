"use client";

import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PayrollRecord {
  id: string;
  employeeId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  netPay: number;
  status: "DRAFT" | "APPROVED" | "LOCKED";
  employee: { name: string; department: string };
}

export function PayslipsManager() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payroll")
      .then((res) => res.json())
      .then((data) => {
        setRecords(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payslips</h1>
        <p className="text-muted-foreground text-sm">
          Download a PDF payslip for any processed payroll record.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Records</CardTitle>
          <CardDescription>All processed pay periods, most recent first</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>
          ) : records.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center text-sm">
              <FileText className="size-8" />
              No payroll records yet. Process payroll first from the Payroll Processing tab.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.employee.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {r.employeeId} · {r.employee.department}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(r.payPeriodStart)} &ndash; {formatDate(r.payPeriodEnd)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(r.netPay)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "LOCKED" ? "success" : "secondary"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/api/payslips/${r.id}/pdf`} download>
                          <Download className="size-4" />
                          PDF
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
