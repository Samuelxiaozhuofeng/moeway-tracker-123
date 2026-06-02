"use client";

import { Pause, Play, Square, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SessionForm } from "@/components/records/session-form";
import { getTimerSeconds, useTimerStore } from "@/store/timer-store";

export function TimerDock() {
  const { timer, pauseTimer, resumeTimer, resetTimer } = useTimerStore();
  const [seconds, setSeconds] = useState(0);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    setSeconds(getTimerSeconds(timer));
    const id = window.setInterval(() => setSeconds(getTimerSeconds(timer)), 1000);
    return () => window.clearInterval(id);
  }, [timer]);

  useEffect(() => {
    if (timer?.status !== "running") return;
    let lock: { release: () => Promise<void> } | undefined;
    const wakeLock = (navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock;
    wakeLock?.request("screen").then((value) => {
      lock = value;
    }).catch(() => undefined);
    return () => {
      lock?.release().catch(() => undefined);
    };
  }, [timer?.status]);

  const label = useMemo(() => {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${rest}`;
  }, [seconds]);

  if (!timer) return null;

  return (
    <>
      <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-xl lg:bottom-5">
        <div className="surface flex items-center justify-between gap-3 rounded-[1.5rem] p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{timer.workTitle ?? "自由沉浸"}</p>
            <p className="font-mono text-2xl font-semibold tabular-nums text-primary">{label}</p>
          </div>
          <div className="flex gap-2">
            {timer.status === "running" ? (
              <Button variant="outline" size="icon" onClick={pauseTimer} aria-label="暂停">
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="icon" onClick={resumeTimer} aria-label="继续">
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="amber"
              size="icon"
              onClick={() => {
                pauseTimer();
                setFinishing(true);
              }}
              aria-label="结束"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={resetTimer} aria-label="放弃">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={finishing} onOpenChange={setFinishing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存本次沉浸</DialogTitle>
          </DialogHeader>
          <SessionForm
            defaults={{
              languageId: timer.languageId,
              kind: timer.kind,
              activityId: timer.activityId ?? "none",
              workId: timer.workId ?? "none",
              workTitle: timer.workTitle,
              minutes: Math.max(1, Math.round(seconds / 60)),
              unitsCompleted: timer.workId ? 1 : 0
            }}
            onDone={() => {
              setFinishing(false);
              resetTimer();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
