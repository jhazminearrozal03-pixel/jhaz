"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChecklistTask {
  id: string;
  title: string;
  status: "PENDING" | "DONE";
}

interface ChecklistDashboardProps {
  currentUser: { name: string; email: string };
  initialTasks: ChecklistTask[];
}

export function ChecklistDashboard({ currentUser, initialTasks }: ChecklistDashboardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(taskId: string, done: boolean) {
    setError(null);
    setPendingIds((prev) => new Set(prev).add(taskId));
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: done ? "DONE" : "PENDING" } : task))
    );

    try {
      const response = await fetch(`/api/checklist/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      });

      if (!response.ok) {
        // Revert the optimistic update if Monday.com couldn't be updated.
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: done ? "PENDING" : "DONE" } : task
          )
        );
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Could not update that task. Please try again.");
      }
    } catch {
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: done ? "PENDING" : "DONE" } : task))
      );
      setError("Could not reach the server. Please try again.");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }

  async function handleLogout() {
    await fetch("/api/checklist/auth/logout", { method: "POST" });
    router.replace("/checklist/login");
    router.refresh();
  }

  const pendingTasks = tasks.filter((task) => task.status === "PENDING");
  const doneTasks = tasks.filter((task) => task.status === "DONE");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground text-sm">
            Signed in as {currentUser.name} &middot; {currentUser.email}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>To do</CardTitle>
          <CardDescription>
            {pendingTasks.length === 0 ? "Nothing pending. Nice work!" : `${pendingTasks.length} task(s) remaining`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">You&apos;re all caught up.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {pendingTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  disabled={pendingIds.has(task.id)}
                  onToggle={handleToggle}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {doneTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Done</CardTitle>
            <CardDescription>{doneTasks.length} task(s) completed</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1">
              {doneTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  disabled={pendingIds.has(task.id)}
                  onToggle={handleToggle}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 && (
        <p className="text-muted-foreground text-center text-sm">
          No tasks assigned to you yet. New Monday.com assignments will show up here automatically.
        </p>
      )}
    </div>
  );
}

function TaskRow({
  task,
  disabled,
  onToggle,
}: {
  task: ChecklistTask;
  disabled: boolean;
  onToggle: (taskId: string, done: boolean) => void;
}) {
  const done = task.status === "DONE";

  return (
    <li className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50">
      <Checkbox
        checked={done}
        disabled={disabled}
        onCheckedChange={(checked) => onToggle(task.id, checked === true)}
        aria-label={`Mark "${task.title}" as ${done ? "not done" : "done"}`}
      />
      <span className={cn("text-sm", done && "text-muted-foreground line-through")}>{task.title}</span>
    </li>
  );
}
