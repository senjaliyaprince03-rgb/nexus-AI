"use client"

import { ReviewFilterGroup, ReviewFilterItem } from "@/components/ui/review-filter-bars"

export default function ReviewFilterBarsDemo() {
  const total = 12921

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Filter answer quality</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Segment feedback by rating to inspect how users score NexusAI responses.
      </p>

      <ReviewFilterGroup defaultValue="all">
        <ReviewFilterItem value="5-stars" stars={5} count={5168} total={total} />
        <ReviewFilterItem value="4-stars" stars={4} count={4726} total={total} />
        <ReviewFilterItem value="3-stars" stars={3} count={3234} total={total} />
        <ReviewFilterItem value="2-stars" stars={2} count={1842} total={total} />
        <ReviewFilterItem value="1-star" stars={1} count={452} total={total} />
      </ReviewFilterGroup>
      <div className="mt-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
        Use this pattern for analytics or feedback dashboards inside NexusAI.
      </div>
    </div>
  )
}
