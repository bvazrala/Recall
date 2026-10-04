import { Card } from "@/components/ui";

export function LoadError({ error }: { error: Error }) {
  return (
    <Card className="p-5">
      <h2 className="font-hand text-[22px] leading-[1.15] text-pen">Can&apos;t reach Recall.</h2>
      <p className="mt-2">{error.message}</p>
      <p className="mt-2 text-[15px] text-ink-muted">
        Check that the server is running (<code className="font-sans font-bold">pnpm --filter @recall/server dev</code>) and that <code className="font-sans font-bold">NEXT_PUBLIC_STUDENT_ID</code> is set.
      </p>
    </Card>
  );
}

export function Loading({ className = "h-40" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[3px] bg-ink/[0.06] ${className}`} aria-busy aria-label="Loading" />;
}
