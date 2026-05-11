// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CastDetailModal } from "@/components/store/cast-detail-modal";

type ModalCast = NonNullable<Parameters<typeof CastDetailModal>[0]["cast"]>;

function buildCast(overrides: Partial<ModalCast> = {}): ModalCast {
  return {
    id: "cast-1",
    nickname: "テストキャスト",
    age: 22,
    rank: "C",
    photos: [],
    description: null,
    totalExperienceYears: null,
    previousHourlyRate: null,
    desiredAreas: [],
    desiredHourlyRate: null,
    desiredMonthlyIncome: null,
    availableDaysPerWeek: null,
    height: null,
    bust: null,
    waist: null,
    hip: null,
    cupSize: null,
    alcoholTolerance: null,
    preferredAtmosphere: null,
    preferredClientele: null,
    isAvailableNow: null,
    shiftPreferences: null,
    hasTattoo: null,
    dressAvailability: null,
    needsPickup: null,
    hobbies: null,
    specialSkills: null,
    languageSkills: null,
    monthlySales: null,
    monthlyNominations: null,
    birthdaySales: null,
    socialFollowers: null,
    hasVipClients: null,
    vipClientDescription: null,
    birthdayEventWillingness: null,
    user: null,
    ...overrides,
  } as ModalCast;
}

describe("CastDetailModal photo gallery", () => {
  it("photos が複数枚あるときはサムネ列が出る", () => {
    render(
      <CastDetailModal
        cast={buildCast({
          photos: [
            "https://example.com/a.jpg",
            "https://example.com/b.jpg",
            "https://example.com/c.jpg",
          ],
        })}
        open
        onClose={vi.fn()}
        onOffer={vi.fn()}
      />,
    );

    expect(screen.getByTestId("cast-gallery-main")).toBeInTheDocument();
    const thumbs = screen.getAllByTestId("cast-gallery-thumb");
    expect(thumbs).toHaveLength(3);
  });

  it("サムネをクリックするとメイン画像が切り替わる", () => {
    const photos = [
      "https://example.com/a.jpg",
      "https://example.com/b.jpg",
      "https://example.com/c.jpg",
    ];
    render(
      <CastDetailModal
        cast={buildCast({ photos })}
        open
        onClose={vi.fn()}
        onOffer={vi.fn()}
      />,
    );

    const thumbs = screen.getAllByTestId("cast-gallery-thumb");
    fireEvent.click(thumbs[1]);

    const main = screen.getByTestId("cast-gallery-main") as HTMLImageElement;
    expect(main.src).toBe(photos[1]);
  });

  it("photos が空でも user.image があればフォールバック表示される", () => {
    render(
      <CastDetailModal
        cast={buildCast({
          photos: [],
          user: { image: "https://example.com/avatar.jpg" },
        })}
        open
        onClose={vi.fn()}
        onOffer={vi.fn()}
      />,
    );

    const main = screen.getByTestId("cast-gallery-main") as HTMLImageElement;
    expect(main.src).toBe("https://example.com/avatar.jpg");
    expect(screen.queryByTestId("cast-gallery-thumb")).not.toBeInTheDocument();
  });
});
