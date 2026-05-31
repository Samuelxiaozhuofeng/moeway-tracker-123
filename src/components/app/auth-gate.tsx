"use client";

import { Cloud, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prepareLocalCacheForUser } from "@/lib/db/account-cache";
import { useInvalidateData } from "@/lib/data/hooks";
import { syncWithSupabase } from "@/lib/supabase/sync";
import { useSupabaseSession } from "@/lib/supabase/use-session";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const auth = useSupabaseSession();
  const invalidate = useInvalidateData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [sending, setSending] = useState(false);
  const [syncingUserId, setSyncingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (auth.status !== "signed-in") return;
    const userId = auth.session.user.id;
    if (syncingUserId === userId) return;

    setSyncingUserId(userId);
    prepareLocalCacheForUser(userId)
      .then(() => syncWithSupabase())
      .then(() => invalidate())
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "登录后同步失败");
      });
  }, [auth, invalidate, syncingUserId]);

  if (auth.status === "signed-in") return children;

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#0d1020_0%,#151827_56%,#111423_100%)] px-4">
      <section className="surface grid w-full max-w-md gap-5 rounded-[2rem] p-6 shadow-soft">
        <div className="grid gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ImmerseLog</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">账号登录</h1>
          </div>
        </div>

        {auth.status === "missing-env" && (
          <p className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
            当前部署缺少 Supabase 环境变量，无法启用云端账号登录。
          </p>
        )}

        {auth.status === "error" && (
          <p className="rounded-2xl border border-red-400/25 bg-red-400/10 p-3 text-sm leading-6 text-red-100">
            {auth.error.message}
          </p>
        )}

        {auth.status === "loading" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在检查登录状态
          </div>
        ) : (
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!auth.supabase || auth.status === "missing-env") return;
              setSending(true);
              try {
                const credentials = { email, password };
                const { error } = mode === "sign-in"
                  ? await auth.supabase.auth.signInWithPassword(credentials)
                  : await auth.supabase.auth.signUp(credentials);
                if (error) throw error;
                toast.success(mode === "sign-in" ? "登录成功" : "注册成功");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "登录失败");
              } finally {
                setSending(false);
              }
            }}
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              disabled={!auth.supabase || auth.status === "missing-env" || sending}
            />
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 位密码"
              disabled={!auth.supabase || auth.status === "missing-env" || sending}
            />
            <Button type="submit" disabled={!auth.supabase || auth.status === "missing-env" || sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
              {mode === "sign-in" ? "登录" : "注册并登录"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={sending}
              onClick={() => setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"))}
            >
              {mode === "sign-in" ? "没有账号？创建一个" : "已有账号？直接登录"}
            </Button>
          </form>
        )}

        <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          使用邮箱和密码登录后，本机记录会同步到你的 Supabase 账号；再次打开或换设备登录后会自动拉取账号数据。
        </div>
      </section>
    </main>
  );
}
