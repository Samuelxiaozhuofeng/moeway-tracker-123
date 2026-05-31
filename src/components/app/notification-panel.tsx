"use client";

import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/lib/db/settings";
import { useInvalidateData } from "@/lib/data/hooks";

export function NotificationPanel() {
  const invalidate = useInvalidateData();

  return (
    <section className="quiet-panel rounded-[1.5rem] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">通知</h2>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">允许后可用于沉浸提醒和计时结束提示。</p>
      <Button
        className="mt-4"
        variant="outline"
        onClick={async () => {
          if (!("Notification" in window)) {
            toast.error("当前浏览器不支持通知");
            return;
          }
          const permission = await Notification.requestPermission();
          await updateSettings({ notificationsEnabled: permission === "granted" });
          await invalidate();
          if (permission === "granted") {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification("浸录已开启通知", {
              body: "下一次沉浸开始时，我们会安静地守在后台。",
              icon: "/icon.svg"
            });
          }
        }}
      >
        开启通知
      </Button>
    </section>
  );
}
