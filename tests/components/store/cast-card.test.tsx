// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CastCard } from "@/components/store/cast-card";

type CastCardProps = Parameters<typeof CastCard>[0];

function makeCast(overrides: Partial<CastCardProps["cast"]> = {}): CastCardProps["cast"] {
  return {
    id: "cast-1",
    nickname: "うっち",
    age: 22,
    photos: [],
    desiredAreas: ["刈谷"],
    rank: "C",
    description: null,
    totalExperienceYears: 2,
    previousHourlyRate: null,
    user: null,
    ...overrides,
  };
}

const PHOTO = (n: number) => `https://example.com/photo-${n}.jpg`;

describe("CastCard 複数画像", () => {
  it("photos が 1 枚のときはサムネ列が表示されない", () => {
    render(
      <CastCard
        cast={makeCast({ photos: [PHOTO(1)] })}
        onDetail={vi.fn()}
        onOffer={vi.fn()}
      />
    );

    expect(screen.queryByTestId("cast-card-thumbnails")).not.toBeInTheDocument();
    const main = screen.getByTestId("cast-card-main-image") as HTMLImageElement;
    expect(main.src).toContain("photo-1.jpg");
  });

  it("photos が 2 枚のときはサムネが 1 枚表示される", () => {
    render(
      <CastCard
        cast={makeCast({ photos: [PHOTO(1), PHOTO(2)] })}
        onDetail={vi.fn()}
        onOffer={vi.fn()}
      />
    );

    const thumbs = screen.getByTestId("cast-card-thumbnails");
    const thumbButtons = within(thumbs).getAllByRole("button");
    expect(thumbButtons).toHaveLength(1);
    const thumbImg = thumbButtons[0].querySelector("img") as HTMLImageElement;
    expect(thumbImg.src).toContain("photo-2.jpg");
  });

  it("photos が 3 枚のときはサムネが 2 枚表示され「+N」は出ない", () => {
    render(
      <CastCard
        cast={makeCast({ photos: [PHOTO(1), PHOTO(2), PHOTO(3)] })}
        onDetail={vi.fn()}
        onOffer={vi.fn()}
      />
    );

    const thumbs = screen.getByTestId("cast-card-thumbnails");
    expect(within(thumbs).getAllByRole("button")).toHaveLength(2);
    expect(screen.queryByTestId("cast-card-more-badge")).not.toBeInTheDocument();
  });

  it("photos が 5 枚のときはサムネ 1 枚 +「+3」バッジが出る", () => {
    render(
      <CastCard
        cast={makeCast({
          photos: [PHOTO(1), PHOTO(2), PHOTO(3), PHOTO(4), PHOTO(5)],
        })}
        onDetail={vi.fn()}
        onOffer={vi.fn()}
      />
    );

    const thumbs = screen.getByTestId("cast-card-thumbnails");
    const buttons = within(thumbs).getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(screen.getByTestId("cast-card-more-badge")).toHaveTextContent("+3");
  });

  it("サムネをクリックするとメインと入れ替わる", () => {
    render(
      <CastCard
        cast={makeCast({ photos: [PHOTO(1), PHOTO(2), PHOTO(3)] })}
        onDetail={vi.fn()}
        onOffer={vi.fn()}
      />
    );

    expect((screen.getByTestId("cast-card-main-image") as HTMLImageElement).src)
      .toContain("photo-1.jpg");

    const thumbs = screen.getByTestId("cast-card-thumbnails");
    const firstThumbButton = within(thumbs).getAllByRole("button")[0];
    fireEvent.click(firstThumbButton);

    expect((screen.getByTestId("cast-card-main-image") as HTMLImageElement).src)
      .toContain("photo-2.jpg");

    // 旧メイン (photo-1) が今度はサムネ側に存在する
    const thumbsAfter = screen.getByTestId("cast-card-thumbnails");
    const thumbImgs = Array.from(
      thumbsAfter.querySelectorAll("img")
    ).map((img) => (img as HTMLImageElement).src);
    expect(thumbImgs.some((s) => s.includes("photo-1.jpg"))).toBe(true);
  });

  it("メイン画像クリックで onDetail が呼ばれる", () => {
    const onDetail = vi.fn();
    render(
      <CastCard
        cast={makeCast({ photos: [PHOTO(1), PHOTO(2)] })}
        onDetail={onDetail}
        onOffer={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("cast-card-main-button"));
    expect(onDetail).toHaveBeenCalledWith("cast-1");
  });

  it("「+N」バッジクリックで onDetail が呼ばれる", () => {
    const onDetail = vi.fn();
    render(
      <CastCard
        cast={makeCast({
          photos: [PHOTO(1), PHOTO(2), PHOTO(3), PHOTO(4)],
        })}
        onDetail={onDetail}
        onOffer={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("cast-card-more-badge"));
    expect(onDetail).toHaveBeenCalledWith("cast-1");
  });

  it("photos が空でも user.image があればメインに使われ、サムネ列は出ない", () => {
    render(
      <CastCard
        cast={makeCast({
          photos: [],
          user: { image: "https://example.com/line-avatar.jpg" },
        })}
        onDetail={vi.fn()}
        onOffer={vi.fn()}
      />
    );

    expect(
      (screen.getByTestId("cast-card-main-image") as HTMLImageElement).src
    ).toContain("line-avatar.jpg");
    expect(screen.queryByTestId("cast-card-thumbnails")).not.toBeInTheDocument();
  });
});
