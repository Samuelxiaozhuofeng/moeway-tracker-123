"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WorkForm } from "@/components/library/work-form";
import { useState } from "react";
import type { LibraryWork } from "@/types/domain";

export function WorkDialog({ work, trigger }: { work?: LibraryWork; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" />
            添加作品
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{work ? "编辑作品" : "添加作品"}</DialogTitle>
          <DialogDescription>填写已完成进度时，浸录会自动计入历史沉浸时间。</DialogDescription>
        </DialogHeader>
        <WorkForm work={work} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
