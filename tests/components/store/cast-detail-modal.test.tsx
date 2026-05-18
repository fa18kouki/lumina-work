// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CastDetailModal } from "@/components/store/cast-detail-modal";

type CastDetailModalProps = Parameters<typeof CastDetailModal>[0];
type CastInput = NonNullable<CastDetailModalProps["cast"]>;

function makeCast(overrides: Partial<CastInput> = {}): CastInput {
  return {
    id: "cast-1",
    nickname: "うっち",
    age: 22,
    rank: "C",
    photos: [],
    desiredAreas: ["刈谷"],
    user: null,
    ...overrides,
  };
}

const PHOTO = (n: number) => `https://example.com/photo-${n}.jpg`;

describe("CastDetailModal 複数画像", () => {
  it("photos が 1 枚のときはサムネ列が出ない", () => {
    render(
      <CastDetailModal
        cast={makeCast({ photos: [PHOTO(1)] })}
        open
        onClose={vi.fn()}
        onOffer={vi.fn()}
      />
    );

    expect(
      screen.queryByTestId("cast-detail-thumbnails")
    ).not.toBeInTheDocument();
    expect(
      (screen.getByTestId("cast-detail-main-image") as HTMLImageElement).src
    ).toContain("photo-1.jpg");
  });

  it("photos が複数枚あるとサムネ列に全枚数並ぶ", () => {
    render(
      <CastDetailModal
        cast={makeCast({ photos: [PHOTO(1), PHOTO(2), PHOTO(3), PHOTO(4)] })}
        open
        onClose={vi.fn()}
        onOffer={vi.fn()}
      />
    );

    const thumbs = screen.getByTestId("cast-detail-thumbnails");
    expect(thumbs.querySelectorAll("button")).toHaveLength(4);
  });

  it("サムネをクリックするとメインが切り替わる", () => {
    render(
      <CastDetailModal
        cast={makeCast({ photos: [PHOTO(1), PHOTO(2), PHOTO(3)] })}
        open
        onClose={vi.fn()}
        onOffer={vi.fn()}
      />
    );

    expect(
      (screen.getByTestId("cast-detail-main-image") as HTMLImageElement).src
    ).toContain("photo-1.jpg");

    const thumbs = screen.getByTestId("cast-detail-thumbnails");
    const buttons = Array.from(thumbs.querySelectorAll("button"));
    fireEvent.click(buttons[2]);

    expect(
      (screen.getByTestId("cast-detail-main-image") as HTMLImageElement).src
    ).toContain("photo-3.jpg");
  });

  it("アクティブなサムネには aria-current=true が付く", () => {
    render(
      <CastDetailModal
        cast={makeCast({ photos: [PHOTO(1), PHOTO(2)] })}
        open
        onClose={vi.fn()}
        onOffer={vi.fn()}
      />
    );

    const thumbs = screen.getByTestId("cast-detail-thumbnails");
    const buttons = Array.from(thumbs.querySelectorAll("button"));
    expect(buttons[0].getAttribute("aria-current")).toBe("true");
    expect(buttons[1].getAttribute("aria-current")).not.toBe("true");

    fireEvent.click(buttons[1]);
    const buttonsAfter = Array.from(
      screen.getByTestId("cast-detail-thumbnails").querySelectorAll("button")
    );
    expect(buttonsAfter[0].getAttribute("aria-current")).not.toBe("true");
    expect(buttonsAfter[1].getAttribute("aria-current")).toBe("true");
  });

  it("photos が空でも user.image があればメインに表示される", () => {
    render(
      <CastDetailModal
        cast={makeCast({
          photos: [],
          user: { image: "https://example.com/line-avatar.jpg" },
        })}
        open
        onClose={vi.fn()}
        onOffer={vi.fn()}
      />
    );

    expect(
      (screen.getByTestId("cast-detail-main-image") as HTMLImageElement).src
    ).toContain("line-avatar.jpg");
    expect(
      screen.queryByTestId("cast-detail-thumbnails")
    ).not.toBeInTheDocument();
  });
});
