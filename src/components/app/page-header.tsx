import { cn } from "@/lib/utils/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary/80">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-normal text-balance sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}
