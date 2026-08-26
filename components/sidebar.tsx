"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  Calculator,
  FileText,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/attendance", label: "Attendance Upload", icon: UploadCloud },
  { href: "/payroll", label: "Payroll Processing", icon: Calculator },
  { href: "/payslips", label: "Payslips", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <Wallet className="size-5 text-primary" />
        <span className="font-semibold tracking-tight">Payroll Assistant</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground">
        Philippine Payroll · Statutory Deductions
      </div>
    </aside>
  );
}
