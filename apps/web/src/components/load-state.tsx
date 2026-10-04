import { Card } from "@/components/ui";

export function LoadError({ error }: { error: Error }) {
  return (
    <Card className="p-5">
      <h2 className="font-serif font-medium text-[20px] leading-[26px]">Can&apos;t reach Recall.</h2>
      <p className="text-[15px] leading-6 text-ink-muted mt-2">{error.message}</p>
      <p className="text-[13px] text-ink-muted mt-2">
        Check that the server is running (<span className="mono">pnpm --filter @recall/server dev</span>) and that <span className="mono">NEXT_PUBLIC_STUDENT_ID</span> is set.
      </p>
    </Card>
  );
}

export function Loading({ className = "h-40" }: { className?: string }) {
  return <div className={`rounded-card bg-ink/[0.05] animate-pulse ${className}`} aria-busy aria-label="Loading" />;
}
