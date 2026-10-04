"use client";

import { useRouter } from "next/navigation";
import { AppBar, Button, Folder, H2, Page, Row, Title } from "@/components/ui";
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
      <Page>
        <Title className="pt-3.5 lg:pt-0">Flashcards</Title>
        {error ? <div className="mt-6"><LoadError error={error} /></div> : loading || !data ? <Loading className="mt-6 h-24" /> : (
          <div className="lg:mt-10 lg:flex lg:flex-wrap lg:items-start lg:gap-x-14 lg:gap-y-12">
            <Folder tab="Today" className="mt-[21px] min-w-0 lg:mt-0 lg:flex-[1_1_360px]">
              <p className="flex items-baseline gap-2.5"><span className="font-hand text-[42px] leading-none text-pen lg:text-[62px] lg:leading-[0.95]">{total}</span>{total === 1 ? "card" : "cards"} due today</p>
              <Button full className="mt-[30px] lg:mt-8" disabled={total === 0} onClick={() => go("study")}>Study due cards</Button>
            </Folder>
            <section className="mt-9 min-w-0 lg:mt-2 lg:flex-[2_1_480px]">
              <H2>Today&apos;s topics</H2>
              {data.topics.length === 0 ? (
                <>
                  <p className="mt-3 font-hand text-[18px] leading-[1.4] text-ink-muted">No topics yet. Add a class to build your first deck.</p>
                  <Button variant="secondary" className="mt-7" onClick={() => go("add-class")}>Add a class</Button>
                </>
              ) : (
                <ul className="mt-3 grid gap-3 lg:mt-4 lg:gap-4 xl:grid-cols-2">
                  {data.topics.map((t) => {
                    const cards = data.cards[t.topicId] ?? [];
                    const { fresh, learning, review } = tally(cards);
                    return (
                      <li key={t.topicId}>
                        <Row label={cards.length === 1 ? "1 card" : `${cards.length} cards`} title={t.name} meta={`${fresh} new, ${learning} learning, ${review} due.`} onClick={() => router.push(`/flashcards/study?topic=${t.topicId}`)} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </Page>
    </>
  );
}
