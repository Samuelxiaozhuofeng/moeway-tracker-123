"use client";

import { ArrowRight, CheckCircle2, Library, Target } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkDialog } from "@/components/library/work-dialog";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/lib/db/settings";

export default function OnboardingPage() {
  const router = useRouter();
  return (
    <div className="mx-auto grid max-w-4xl gap-6 py-6">
      <header>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary/80">Welcome</p>
        <h1 className="text-4xl font-semibold text-balance">把已经走过的沉浸路，也一起记进来。</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          浸录默认带日语、西班牙语、英语；你可以在“我”里添加更多语言。最重要的是：添加作品时填“已完成 X 集/章/页”，系统会自动折算历史时长。
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Step icon={<Target />} title="设置目标" text="每日/每周听力和阅读目标会实时显示在首页。" />
        <Step icon={<Library />} title="添加作品" text="作品架记录封面、进度、平均干净分钟数和笔记。" />
        <Step icon={<CheckCircle2 />} title="开始记录" text="实时计时或手动补录，都能更新统计和热力图。" />
      </section>

      <div className="surface rounded-[2rem] p-5">
        <h2 className="mb-3 text-xl font-semibold">先加入第一部作品</h2>
        <WorkDialog />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          onClick={async () => {
            await updateSettings({ onboardingCompleted: true });
            router.push("/");
          }}
        >
          进入首页
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/profile">调整目标</Link>
        </Button>
      </div>
    </div>
  );
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="quiet-panel rounded-[1.5rem] p-4">
      <div className="mb-4 text-primary [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}
