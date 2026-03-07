// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock tRPC
const { mockMutateAsync, mockInvalidate } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
  mockInvalidate: vi.fn(),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    store: {
      upsertProfile: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
          isPending: false,
        }),
      },
      getProfile: {
        invalidate: mockInvalidate,
      },
    },
    useUtils: () => ({
      store: {
        getProfile: {
          invalidate: mockInvalidate,
        },
      },
    }),
  },
}));

// Mock area-select
vi.mock("@/components/ui/area-select", () => ({
  AreaSelect: ({
    value,
    onChange,
    className,
  }: {
    value: string;
    onChange: (v: string) => void;
    className?: string;
  }) => (
    <select
      data-testid="area-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">選択してください</option>
      <option value="六本木">六本木</option>
      <option value="銀座">銀座</option>
    </select>
  ),
}));

import { OnboardingModal } from "@/components/store/onboarding-modal";

describe("OnboardingModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Step1の基本情報フォームが表示される", () => {
    render(<OnboardingModal onComplete={vi.fn()} />);

    expect(screen.getByText("基本情報を入力してください")).toBeInTheDocument();
    expect(screen.getByLabelText("店舗名")).toBeInTheDocument();
    expect(screen.getByTestId("area-select")).toBeInTheDocument();
    expect(screen.getByLabelText("住所")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "次へ" })).toBeInTheDocument();
  });

  it("Step1の必須項目が未入力だと次へ進めない", () => {
    render(<OnboardingModal onComplete={vi.fn()} />);

    const nextButton = screen.getByRole("button", { name: "次へ" });
    expect(nextButton).toBeDisabled();
  });

  it("Step1の全項目を入力すると次へボタンが有効になる", () => {
    render(<OnboardingModal onComplete={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("店舗名"), {
      target: { value: "テスト店舗" },
    });
    fireEvent.change(screen.getByTestId("area-select"), {
      target: { value: "六本木" },
    });
    fireEvent.change(screen.getByLabelText("住所"), {
      target: { value: "東京都港区六本木1-1-1" },
    });

    const nextButton = screen.getByRole("button", { name: "次へ" });
    expect(nextButton).not.toBeDisabled();
  });

  it("Step2に進むとアンケートが表示される", () => {
    render(<OnboardingModal onComplete={vi.fn()} />);

    // Step1を入力
    fireEvent.change(screen.getByLabelText("店舗名"), {
      target: { value: "テスト店舗" },
    });
    fireEvent.change(screen.getByTestId("area-select"), {
      target: { value: "六本木" },
    });
    fireEvent.change(screen.getByLabelText("住所"), {
      target: { value: "東京都港区六本木1-1-1" },
    });

    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    expect(
      screen.getByText("どこでこのサービスを知りましたか？")
    ).toBeInTheDocument();
    expect(screen.getByText("SNS（Twitter/X）")).toBeInTheDocument();
    expect(screen.getByText("SNS（Instagram）")).toBeInTheDocument();
    expect(screen.getByText("Google検索")).toBeInTheDocument();
    expect(screen.getByText("知人の紹介")).toBeInTheDocument();
  });

  it("Step2で選択肢を選ばないと完了ボタンが無効", () => {
    render(<OnboardingModal onComplete={vi.fn()} />);

    // Step1入力して次へ
    fireEvent.change(screen.getByLabelText("店舗名"), {
      target: { value: "テスト店舗" },
    });
    fireEvent.change(screen.getByTestId("area-select"), {
      target: { value: "六本木" },
    });
    fireEvent.change(screen.getByLabelText("住所"), {
      target: { value: "東京都港区六本木1-1-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    const completeButton = screen.getByRole("button", { name: "完了" });
    expect(completeButton).toBeDisabled();
  });

  it("Step2で選択肢を選んで完了するとupsertProfileが呼ばれる", async () => {
    mockMutateAsync.mockResolvedValue({});
    const onComplete = vi.fn();
    render(<OnboardingModal onComplete={onComplete} />);

    // Step1入力
    fireEvent.change(screen.getByLabelText("店舗名"), {
      target: { value: "テスト店舗" },
    });
    fireEvent.change(screen.getByTestId("area-select"), {
      target: { value: "六本木" },
    });
    fireEvent.change(screen.getByLabelText("住所"), {
      target: { value: "東京都港区六本木1-1-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    // Step2で選択
    fireEvent.click(screen.getByText("Google検索"));
    fireEvent.click(screen.getByRole("button", { name: "完了" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        name: "テスト店舗",
        area: "六本木",
        address: "東京都港区六本木1-1-1",
        referralSource: "Google検索",
      });
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it("閉じるボタンやオーバーレイクリックでは閉じない", () => {
    render(<OnboardingModal onComplete={vi.fn()} />);

    // 閉じるボタンが存在しないことを確認
    expect(screen.queryByLabelText("閉じる")).not.toBeInTheDocument();

    // オーバーレイ（背景）がある
    const overlay = screen.getByTestId("onboarding-overlay");
    expect(overlay).toBeInTheDocument();
  });

  it("Step2で戻るボタンを押すとStep1に戻る", () => {
    render(<OnboardingModal onComplete={vi.fn()} />);

    // Step1入力
    fireEvent.change(screen.getByLabelText("店舗名"), {
      target: { value: "テスト店舗" },
    });
    fireEvent.change(screen.getByTestId("area-select"), {
      target: { value: "六本木" },
    });
    fireEvent.change(screen.getByLabelText("住所"), {
      target: { value: "東京都港区六本木1-1-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));

    // Step2に進んだ
    expect(
      screen.getByText("どこでこのサービスを知りましたか？")
    ).toBeInTheDocument();

    // 戻るボタン
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));

    // Step1に戻った
    expect(screen.getByText("基本情報を入力してください")).toBeInTheDocument();
  });
});
