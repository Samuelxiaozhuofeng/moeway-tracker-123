"use client";

import { Cloud, LogOut, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase/client";
import { syncWithSupabase } from "@/lib/supabase/sync";
import { useInvalidateData } from "@/lib/data/hooks";

export function AuthPanel() {
  const supabase = getSupabaseClient();
  const invalidate = useInvalidateData();
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserEmail(session?.user.email));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (!supabase) {
    return (
      <section className="quiet-panel rounded-[1.5rem] p-4">
        <h2 className="font-semibold">云同步</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">未配置 Supabase 环境变量时，浸录会保持完全本地离线可用。</p>
      </section>
    );
  }

  return (
    <section className="quiet-panel rounded-[1.5rem] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Cloud className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">云同步</h2>
      </div>
      {userEmail ? (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">{userEmail}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                const result = await syncWithSupabase();
                await invalidate();
                toast.success(result.ok ? "同步完成" : "需要登录");
              }}
            >
              <Cloud className="h-4 w-4" />
              立即同步
            </Button>
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>
              <LogOut className="h-4 w-4" />
              退出
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          <Button
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOtp({ email });
              if (error) throw error;
              toast.success("登录链接已发送");
            }}
          >
            <Mail className="h-4 w-4" />
            发送 magic link
          </Button>
        </div>
      )}
    </section>
  );
}
