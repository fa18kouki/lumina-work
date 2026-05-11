// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CastPhotoGallery } from "@/components/store/cast-photo-gallery";

describe("CastPhotoGallery", () => {
  const photos = [
    "https://example.com/a.jpg",
    "https://example.com/b.jpg",
    "https://example.com/c.jpg",
  ];

  it("photos が空 / fallback も無いときはプレースホルダーを出す", () => {
    render(<CastPhotoGallery photos={[]} fallbackImage={null} alt="キャスト" />);

    expect(screen.queryByTestId("cast-gallery-main")).not.toBeInTheDocument();
    expect(screen.getByTestId("cast-gallery-placeholder")).toBeInTheDocument();
  });

  it("photos 空でも fallbackImage があればそれをメインに出す", () => {
    render(
      <CastPhotoGallery
        photos={[]}
        fallbackImage="https://example.com/avatar.jpg"
        alt="キャスト"
      />,
    );

    const main = screen.getByTestId("cast-gallery-main") as HTMLImageElement;
    expect(main.src).toBe("https://example.com/avatar.jpg");
    expect(screen.queryByTestId("cast-gallery-thumb")).not.toBeInTheDocument();
  });

  it("photos が 1 枚のときはメインだけ表示し、サムネ列は出さない", () => {
    render(
      <CastPhotoGallery photos={[photos[0]]} fallbackImage={null} alt="キャスト" />,
    );

    const main = screen.getByTestId("cast-gallery-main") as HTMLImageElement;
    expect(main.src).toBe(photos[0]);
    expect(screen.queryByTestId("cast-gallery-thumb")).not.toBeInTheDocument();
  });

  it("photos が複数あるとサムネ列が枚数分でて、最初の写真がメインで選択中になる", () => {
    render(
      <CastPhotoGallery photos={photos} fallbackImage={null} alt="キャスト" />,
    );

    const main = screen.getByTestId("cast-gallery-main") as HTMLImageElement;
    expect(main.src).toBe(photos[0]);

    const thumbs = screen.getAllByTestId("cast-gallery-thumb");
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0]).toHaveAttribute("aria-current", "true");
    expect(thumbs[1]).toHaveAttribute("aria-current", "false");
  });

  it("サムネをクリックするとメイン画像がそのサムネに切り替わる", () => {
    render(
      <CastPhotoGallery photos={photos} fallbackImage={null} alt="キャスト" />,
    );

    const thumbs = screen.getAllByTestId("cast-gallery-thumb");
    fireEvent.click(thumbs[2]);

    const main = screen.getByTestId("cast-gallery-main") as HTMLImageElement;
    expect(main.src).toBe(photos[2]);
    expect(thumbs[2]).toHaveAttribute("aria-current", "true");
    expect(thumbs[0]).toHaveAttribute("aria-current", "false");
  });
});
