"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ActivityForm } from "@/components/activities/activity-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ActivityTemplate } from "@/types/domain";

export function ActivityDialog({ activity, trigger }: { activity?: ActivityTemplate; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Plus className="h-4 w-4" />
            添加活动
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{activity ? "编辑活动" : "添加活动"}</DialogTitle>
          <DialogDescription>活动会作为补录和计时的预设，保存后仍然计入普通沉浸记录。</DialogDescription>
        </DialogHeader>
        <ActivityForm activity={activity} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
