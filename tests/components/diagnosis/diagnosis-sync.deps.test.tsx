// @vitest-environment jsdom
/**
 * H-1: DiagnosisSync の useEffect deps が `[status, session]` だと
 *   session オブジェクト参照が毎レンダで変わるたびに effect が再走り、
 *   無限リトライ / 多重 fetch のリスクがある。
 *   deps を `[status, session?.user?.id, session?.user?.role]` に絞る。
 *
 * H-2: 別ロール (例: OWNER) でログインしている端末では、
 *   前のキャストが残した診断 localStorage を誤って merge しないように
 *   role !== "CAST" のときは clearDiagnosisSession() してから return する。
 *   ただし unauthenticated の状態 (これからログインする可能性) では消さない。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { render, cleanup, act } from "@testing-library/react";

const useAppSessionMock = vi.fn();
const clearDiagnosisSessionMock = vi.fn();
const getDiagnosisSessionMock = vi.fn();

vi.mock("@/lib/auth-helpers", () => ({
  useAppSession: useAppSessionMock,
}));

vi.mock("@/lib/diagnosis-session", () => ({
  clearDiagnosisSession: clearDiagnosisSessionMock,
  getDiagnosisSession: getDiagnosisSessionMock,
}));

const fetchMock = vi.fn();

beforeEach(() => {
  useAppSessionMock.mockReset();
  clearDiagnosisSessionMock.mockReset();
  getDiagnosisSessionMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function answersWithContent() {
  return {
    answers: {
      age: 25,
      desiredAreas: ["新宿"],
    },
  };
}

describe("DiagnosisSync — H-1: useEffect deps", () => {
  it("fetch がリトライ可能な失敗で submittedRef が戻った後、 session 参照だけ変わっても再 fetch しない", async () => {
    // 1 回目の fetch は失敗 → submittedRef.current = false に戻る
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "server error",
    });
    getDiagnosisSessionMock.mockReturnValue(answersWithContent());

    const session1 = {
      user: { id: "cast-user-1", role: "CAST" as const },
    };
    useAppSessionMock.mockReturnValue({
      data: session1,
      status: "authenticated",
    });

    const { DiagnosisSync } = await import(
      "@/components/diagnosis/diagnosis-sync"
    );

    let rerender: ReturnType<typeof render>["rerender"];
    await act(async () => {
      ({ rerender } = render(<DiagnosisSync />));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // 別オブジェクトだが id/role は同じ
    await act(async () => {
      useAppSessionMock.mockReturnValue({
        data: { user: { id: "cast-user-1", role: "CAST" as const } },
        status: "authenticated",
      });
      rerender!(<DiagnosisSync />);
    });

    // deps が `[status, session]` だと submittedRef が戻ってしまった後で
    // session 参照変化により effect が再走 → fetch が複数回呼ばれる。
    // deps を id/role に絞れば 1 回のまま。
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("DiagnosisSync — H-2: 別ロールでの localStorage クリア", () => {
  it("role=OWNER で authenticated のとき localStorage をクリアし fetch は走らない", async () => {
    getDiagnosisSessionMock.mockReturnValue(answersWithContent());
    useAppSessionMock.mockReturnValue({
      data: { user: { id: "owner-1", role: "OWNER" as const } },
      status: "authenticated",
    });

    const { DiagnosisSync } = await import(
      "@/components/diagnosis/diagnosis-sync"
    );
    render(<DiagnosisSync />);

    expect(clearDiagnosisSessionMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("role=ADMIN で authenticated のときも localStorage をクリアする", async () => {
    getDiagnosisSessionMock.mockReturnValue(answersWithContent());
    useAppSessionMock.mockReturnValue({
      data: { user: { id: "admin-1", role: "ADMIN" as const } },
      status: "authenticated",
    });

    const { DiagnosisSync } = await import(
      "@/components/diagnosis/diagnosis-sync"
    );
    render(<DiagnosisSync />);

    expect(clearDiagnosisSessionMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("status=unauthenticated のときは localStorage を消さない (これからログインする可能性)", async () => {
    getDiagnosisSessionMock.mockReturnValue(answersWithContent());
    useAppSessionMock.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    const { DiagnosisSync } = await import(
      "@/components/diagnosis/diagnosis-sync"
    );
    render(<DiagnosisSync />);

    expect(clearDiagnosisSessionMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("role=CAST のときは fetch が走り、 sync 前段で localStorage を消さない", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    getDiagnosisSessionMock.mockReturnValue(answersWithContent());
    useAppSessionMock.mockReturnValue({
      data: { user: { id: "cast-user-2", role: "CAST" as const } },
      status: "authenticated",
    });

    const { DiagnosisSync } = await import(
      "@/components/diagnosis/diagnosis-sync"
    );
    render(<DiagnosisSync />);

    // fetch は走る
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // 反映成功前なので clear は呼ばれていない
    expect(clearDiagnosisSessionMock).not.toHaveBeenCalled();
  });
});
