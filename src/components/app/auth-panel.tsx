"use client";

import { Cloud, Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clearLocalAccountCache, forgetLocalCacheUser } from "@/lib/db/account-cache";
import { syncWithSupabase } from "@/lib/supabase/sync";
import { useInvalidateData } from "@/lib/data/hooks";
import { useSupabaseSession } from "@/lib/supabase/use-session";

export function AuthPanel() {
  const auth = useSupabaseSession();
  const invalidate = useInvalidateData();
  const [signingOut, setSigningOut] = useState(false);
  const userEmail = auth.status === "signed-in" ? auth.session.user.email : undefined;
  const supabase = auth.status === "signed-in" ? auth.supabase : null;

  return (
    <section className="quiet-panel rounded-[1.5rem] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Cloud className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">云同步</h2>
      </div>
      {auth.status === "signed-in" && supabase ? (
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
            <Button
              variant="outline"
              disabled={signingOut}
              onClick={async () => {
                setSigningOut(true);
                try {
                  await syncWithSupabase();
                  const { error } = await supabase.auth.signOut();
                  if (error) throw error;
                  await clearLocalAccountCache();
                  forgetLocalCacheUser();
                  await invalidate();
                  toast.success("已退出登录");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "退出登录失败");
                } finally {
                  setSigningOut(false);
                }
              }}
            >
              {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              退出
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted-foreground">当前未登录，请回到登录页使用邮箱链接登录。</p>
      )}
    </section>
  );
}
