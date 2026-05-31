"use client";

import { Download, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { backupToCsvRows, exportBackup, importBackup, type BackupPayload } from "@/lib/db/backup";
import { listSessions } from "@/lib/db/sessions";
import { useInvalidateData } from "@/lib/data/hooks";
import { downloadText } from "@/lib/utils/download";

export function DataManagement() {
  const inputRef = useRef<HTMLInputElement>(null);
  const invalidate = useInvalidateData();

  return (
    <section className="quiet-panel rounded-[1.5rem] p-4">
      <h2 className="font-semibold">数据管理</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            const payload = await exportBackup();
            downloadText(`immerselog-${payload.exportedAt.slice(0, 10)}.json`, JSON.stringify(payload, null, 2), "application/json");
          }}
        >
          <Download className="h-4 w-4" />
          导出 JSON
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const sessions = await listSessions();
            downloadText("immerselog-sessions.csv", backupToCsvRows(sessions), "text/csv;charset=utf-8");
          }}
        >
          <Download className="h-4 w-4" />
          导出 CSV
        </Button>
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          导入 JSON
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            const payload = JSON.parse(await file.text()) as BackupPayload;
            await importBackup(payload);
            await invalidate();
            toast.success("导入完成");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "导入失败，请检查 JSON 文件。");
          } finally {
            event.target.value = "";
          }
        }}
      />
    </section>
  );
}
