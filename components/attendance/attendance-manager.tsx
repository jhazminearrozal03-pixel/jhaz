"use client";

import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { UploadCloud, FileCheck2, AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface CsvRow {
  employeeId?: string;
  date?: string;
  hoursWorked?: string;
  overtimeHours?: string;
  lateMinutes?: string;
}

interface UploadResult {
  inserted: number;
  updated: number;
  total: number;
  errors: { row: number; message: string }[];
}

interface AttendanceLog {
  id: string;
  employeeId: string;
  date: string;
  hoursWorked: number;
  overtimeHours: number;
  lateMinutes: number;
  employee: { name: string; department: string };
}

const REQUIRED_COLUMNS = ["employeeId", "date", "hoursWorked", "overtimeHours", "lateMinutes"];

export function AttendanceManager() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/attendance")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .finally(() => {
        if (!cancelled) setLogsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshIndex]);

  function refreshLogs() {
    setRefreshIndex((i) => i + 1);
  }

  function handleFile(file: File) {
    setParseError(null);
    setResult(null);
    setFileName(file.name);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = results.meta.fields ?? [];
        const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
        if (missing.length > 0) {
          setParseError(`CSV is missing required column(s): ${missing.join(", ")}`);
          setRows([]);
          return;
        }
        setRows(results.data);
      },
      error: (err) => {
        setParseError(err.message);
      },
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleUpload() {
    if (rows.length === 0) return;
    setUploading(true);
    setResult(null);

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setParseError(data.error ?? "Upload failed.");
      return;
    }

    setResult(data);
    setRows([]);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
    refreshLogs();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance Upload</h1>
        <p className="text-muted-foreground text-sm">
          Upload a CSV with columns: employeeId, date, hoursWorked, overtimeHours, lateMinutes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Attendance CSV</CardTitle>
          <CardDescription>
            Drag and drop a file, or browse to select one.{" "}
            <a href="/sample-attendance.csv" download className="text-primary underline underline-offset-4">
              Download sample template
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="border-input hover:bg-accent/50 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors"
          >
            <UploadCloud className="text-muted-foreground size-8" />
            <p className="text-sm font-medium">
              {fileName ?? "Click to browse or drag a CSV file here"}
            </p>
            <p className="text-muted-foreground text-xs">.csv files only</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          {parseError && (
            <div className="text-destructive flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4" />
              {parseError}
            </div>
          )}

          {rows.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">
                Preview ({rows.length} row{rows.length === 1 ? "" : "s"})
              </p>
              <div className="max-h-64 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">OT Hours</TableHead>
                      <TableHead className="text-right">Late (min)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.employeeId}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell className="text-right">{row.hoursWorked}</TableCell>
                        <TableCell className="text-right">{row.overtimeHours}</TableCell>
                        <TableCell className="text-right">{row.lateMinutes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rows.length > 10 && (
                <p className="text-muted-foreground text-xs">
                  Showing first 10 of {rows.length} rows.
                </p>
              )}
              <Button onClick={handleUpload} disabled={uploading} className="w-fit">
                {uploading && <Loader2 className="size-4 animate-spin" />}
                Save {rows.length} Attendance Record{rows.length === 1 ? "" : "s"}
              </Button>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-2 rounded-md border bg-muted/50 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <FileCheck2 className="text-success size-4" />
                {result.inserted} inserted, {result.updated} updated of {result.total} rows.
              </div>
              {result.errors.length > 0 && (
                <ul className="text-destructive list-inside list-disc">
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Logs</CardTitle>
          <CardDescription>Latest records saved to the database</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {logsLoading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No attendance logs uploaded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">OT Hours</TableHead>
                  <TableHead className="text-right">Late</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(0, 25).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-medium">{log.employee.name}</div>
                      <div className="text-muted-foreground text-xs">{log.employeeId}</div>
                    </TableCell>
                    <TableCell>{formatDate(log.date)}</TableCell>
                    <TableCell className="text-right">{log.hoursWorked}</TableCell>
                    <TableCell className="text-right">
                      {log.overtimeHours > 0 ? (
                        <Badge variant="secondary">{log.overtimeHours}h OT</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.lateMinutes > 0 ? (
                        <Badge variant="destructive">{log.lateMinutes}m late</Badge>
                      ) : (
                        "—"
                      )}
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
