"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLanguage } from "@/lib/db/languages";
import { useInvalidateData, useLanguages } from "@/lib/data/hooks";

export function LanguageSettings() {
  const { data: languages = [] } = useLanguages();
  const invalidate = useInvalidateData();
  const [name, setName] = useState("");

  return (
    <section className="quiet-panel rounded-[1.5rem] p-4">
      <h2 className="font-semibold">目标语言</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {languages.map((language) => (
          <span key={language.id} className="rounded-full bg-white/[0.06] px-3 py-1 text-sm">
            <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: language.accent }} />
            {language.name}
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="添加自定义语言" />
        <Button
          variant="outline"
          size="icon"
          aria-label="添加语言"
          onClick={async () => {
            if (!name.trim()) return;
            await createLanguage({ name, code: name.toLowerCase().slice(0, 5), accent: "#f7b267" });
            setName("");
            await invalidate();
            toast.success("语言已添加");
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
