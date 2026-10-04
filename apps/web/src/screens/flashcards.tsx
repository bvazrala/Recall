"use client";

import { useRouter } from "next/navigation";
import { AppBar, Button, Card, Label, Page, Title } from "@/components/ui";
import { LoadError, Loading } from "@/components/load-state";
import { useDay } from "@/components/day-context";
import { cardCount } from "@/lib/day-data";
import { useNav } from "@/lib/nav";

const tally = (cards: { state: number }[]) => ({
  fresh: cards.filter((c) => c.state === 0).length,
  learning: cards.filter((c) => c.state === 1 || c.state === 3).length,
  review: cards.filter((c) => c.state === 2).length,
});

export function Flashcards() {
  const { go } = useNav();
  const router = useRouter();
  const { data, error, loading } = useDay();
  const total = data ? cardCount(data) : 0;

  return (
    <>
      <AppBar />
      <Page wide>
        <Title>Flashcards</Title>
        {error ? <div className="mt-6"><LoadError error={error} /></div> : loading || !data ? <Loading className="mt-6 h-24" /> : (
          <>
            <Card className="mt-6 p-5 flex items-center gap-4 flex-wrap">
              <div className="flex-1"><span className="font-serif font-medium text-[32px] leading-none">{total}</span> <span className="text-[16px]">due today</span></div>
              <Button className="w-full sm:w-auto" disabled={total === 0} onClick={() => go("study")}>Study due cards</Button>
            </Card>
            <section className="mt-8">
              <Label>Today&apos;s topics</Label>
              {data.topics.length === 0 ? (
                <p className="mt-3 text-[16px] text-ink-muted">No topics yet. Add a class to build your first deck.</p>
              ) : (
                <ul className="mt-2 border-t border-line">
                  {data.topics.map((t) => {
                    const { fresh, learning, review } = tally(data.cards[t.topicId] ?? []);
                    return (
                      <li key={t.topicId} className="border-b border-line">
                        <button onClick={() => router.push(`/flashcards/study?topic=${t.topicId}`)} className="w-full flex items-center gap-3 py-3.5 min-h-14 text-left">
                          <span className="flex-1 text-[16px]">{t.name}</span>
                          <span className="flex gap-3 text-[12px] text-right">
                            <span className="text-ink-muted"><span className="mono text-[14px] block">{fresh}</span>New</span>
                            <span className="text-accent-text"><span className="mono text-[14px] block">{learning}</span>Learning</span>
                            <span className="text-good"><span className="mono text-[14px] block">{review}</span>Due</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </Page>
    </>
  );
}
