// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CastCard } from "@/components/store/cast-card";

type CastCardCast = Parameters<typeof CastCard>[0]["cast"];

function buildCast(overrides: Partial<CastCardCast> = {}): CastCardCast {
  return {
    id: "cast-1",
    nickname: "テストキャスト",
    age: 22,
    photos: [],
    desiredAreas: [],
    rank: "C",
    description: null,
    totalExperienceYears: null,
    previousHourlyRate: null,
    user: null,
    ...overrides,
  };
}

describe("CastCard photo count badge", () => {
  it("photos が 1 枚だけのときは枚数バッジを出さない", () => {
    render(
      <CastCard
        cast={buildCast({ photos: ["https://example.com/a.jpg"] })}
        onDetail={vi.fn()}
        onOffer={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("cast-card-photo-count")).not.toBeInTheDocument();
  });

  it("photos が空のときは枚数バッジを出さない", () => {
    render(
      <CastCard
        cast={buildCast({ photos: [] })}
        onDetail={vi.fn()}
        onOffer={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("cast-card-photo-count")).not.toBeInTheDocument();
  });

  it("photos が 2 枚以上のときは +N 枚バッジを出す", () => {
    render(
      <CastCard
        cast={buildCast({
          photos: [
            "https://example.com/a.jpg",
            "https://example.com/b.jpg",
            "https://example.com/c.jpg",
            "https://example.com/d.jpg",
          ],
        })}
        onDetail={vi.fn()}
        onOffer={vi.fn()}
      />,
    );

    const badge = screen.getByTestId("cast-card-photo-count");
    expect(badge).toBeInTheDocument();
    // 残り = 全体数 - メイン表示の 1 枚
    expect(badge).toHaveTextContent("+3");
  });
});
