"use client";

import { AuthPanel } from "@/components/app/auth-panel";
import { DataManagement } from "@/components/app/data-management";
import { GoalSettingsPanel } from "@/components/app/goal-settings";
import { LanguageSettings } from "@/components/app/language-settings";
import { NotificationPanel } from "@/components/app/notification-panel";
import { PageHeader } from "@/components/app/page-header";

export default function ProfilePage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-5">
      <PageHeader eyebrow="Me" title="我" description="管理语言、目标、云同步和备份。所有核心记录都可以离线写入。" />
      <div className="grid gap-4 lg:grid-cols-2">
        <LanguageSettings />
        <GoalSettingsPanel />
        <AuthPanel />
        <DataManagement />
        <NotificationPanel />
      </div>
    </div>
  );
}
