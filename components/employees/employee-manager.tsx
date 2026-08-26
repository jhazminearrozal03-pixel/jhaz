"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatCurrency } from "@/lib/utils";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  basicMonthlySalary: number;
  dailyRate: number;
  position: string;
}

const emptyForm = {
  employeeId: "",
  name: "",
  department: "",
  position: "",
  basicMonthlySalary: "",
  dailyRate: "",
  portalPassword: "",
};

export function EmployeeManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEmployees(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshIndex]);

  function refreshEmployees() {
    setRefreshIndex((i) => i + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: form.employeeId,
        name: form.name,
        department: form.department,
        position: form.position,
        basicMonthlySalary: Number(form.basicMonthlySalary),
        dailyRate: Number(form.dailyRate),
        portalPassword: form.portalPassword,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to add employee.");
      setSubmitting(false);
      return;
    }

    setForm(emptyForm);
    setShowForm(false);
    setSubmitting(false);
    refreshEmployees();
  }

  async function handleDelete(employeeId: string) {
    if (!confirm(`Remove employee ${employeeId}? This also deletes their attendance and payroll history.`)) {
      return;
    }
    await fetch(`/api/employees/${employeeId}`, { method: "DELETE" });
    refreshEmployees();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-muted-foreground text-sm">
            Manage your workforce roster and compensation details.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" />
          {showForm ? "Cancel" : "Add Employee"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Employee</CardTitle>
            <CardDescription>Add a new employee to the roster.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Employee ID">
                <Input
                  required
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  placeholder="EMP-006"
                />
              </Field>
              <Field label="Full Name">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Juan Dela Cruz"
                />
              </Field>
              <Field label="Department">
                <Input
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Engineering"
                />
              </Field>
              <Field label="Position">
                <Input
                  required
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="Software Engineer"
                />
              </Field>
              <Field label="Basic Monthly Salary (PHP)">
                <Input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.basicMonthlySalary}
                  onChange={(e) => setForm({ ...form, basicMonthlySalary: e.target.value })}
                  placeholder="35000"
                />
              </Field>
              <Field label="Daily Rate (PHP)">
                <Input
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.dailyRate}
                  onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                  placeholder="1590.91"
                />
              </Field>
              <Field label="Employee Portal Password">
                <Input
                  required
                  type="text"
                  value={form.portalPassword}
                  onChange={(e) => setForm({ ...form, portalPassword: e.target.value })}
                  placeholder="Initial password"
                />
              </Field>

              <div className="col-span-full flex items-center gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Save Employee
                </Button>
                {error && <p className="text-destructive text-sm">{error}</p>}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-0">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Loading employees…</p>
          ) : employees.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No employees yet. Add your first employee above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-right">Monthly Salary</TableHead>
                  <TableHead className="text-right">Daily Rate</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.employeeId}</TableCell>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.position}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(emp.basicMonthlySalary)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(emp.dailyRate)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(emp.employeeId)}
                        aria-label={`Remove ${emp.name}`}
                      >
                        <Trash2 className="text-destructive size-4" />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
