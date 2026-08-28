"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  Calculator,
  FileText,
  ClipboardCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/attendance", label: "Attendance", icon: UploadCloud },
  { href: "/payroll", label: "Payroll", icon: Calculator },
  { href: "/payslips", label: "Payslips", icon: FileText },
  { href: "/checklist", label: "My Tasks", icon: ClipboardCheck },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex overflow-x-auto border-b bg-card md:hidden">
      {navItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
