"use client";

import { Clock3, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SessionForm } from "@/components/records/session-form";
import { StartImmersion } from "@/components/timer/start-immersion";

export default function LogPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <PageHeader
        eyebrow="Record"
        title="记录"
        description="实时计时适合当下沉浸，手动补录适合昨天、通勤或批量补进度。"
      />
      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface rounded-[2rem] p-5">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Clock3 className="h-5 w-5" />
            <h2 className="font-semibold">实时计时</h2>
          </div>
          <StartImmersion compact />
        </div>
        <div className="surface rounded-[2rem] p-5">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <PlusCircle className="h-5 w-5" />
            <h2 className="font-semibold">快速补录</h2>
          </div>
          <SessionForm />
        </div>
      </section>
    </div>
  );
}
