import { describe, it, expect } from "vitest";
import {
  REGION_DATA,
  AREAS,
  getAllAreas,
  getAllAreaIds,
  getAreasByRegion,
  getAreasByPrefecture,
  getAreasByCity,
  searchAreas,
  getAreaLabel,
} from "@/lib/areas";

describe("areas", () => {
  describe("REGION_DATA", () => {
    it("8つの地方が定義されている", () => {
      expect(REGION_DATA).toHaveLength(8);
      expect(REGION_DATA.map((r) => r.name)).toEqual([
        "北海道",
        "東北",
        "関東",
        "甲信越",
        "東海",
        "関西",
        "中国・四国",
        "九州・沖縄",
      ]);
    });
  });

  describe("getAllAreas", () => {
    it("全エリアを取得できる", () => {
      const areas = getAllAreas();
      expect(areas.length).toBeGreaterThan(100);
    });

    it("各エリアはidとlabelを持つ", () => {
      const areas = getAllAreas();
      for (const area of areas) {
        expect(area.id).toBeTruthy();
        expect(area.label).toBeTruthy();
      }
    });
  });

  describe("getAllAreaIds", () => {
    it("全エリアIDが一意である", () => {
      const ids = getAllAreaIds();
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("AREAS（後方互換）", () => {
    it("既存の主要エリアを含む", () => {
      const majorAreas = [
        "新宿", "歌舞伎町", "渋谷", "六本木", "銀座", "赤坂",
        "恵比寿", "池袋", "上野", "錦糸町", "川崎", "大宮",
        "千葉", "船橋", "栄", "梅田", "難波", "中洲",
        "すすきの",
      ];
      for (const area of majorAreas) {
        expect(AREAS).toContain(area);
      }
    });

    it("新規追加された地方エリアを含む", () => {
      const newAreas = [
        "国分町", "盛岡", "五反田", "関内", "北新地",
        "祇園", "流川", "天文館", "国際通り",
      ];
      for (const area of newAreas) {
        expect(AREAS).toContain(area);
      }
    });
  });

  describe("getAreasByRegion", () => {
    it("関東のエリアを取得できる", () => {
      const areas = getAreasByRegion("関東");
      expect(areas.length).toBeGreaterThan(20);
      expect(areas.map((a) => a.label)).toContain("歌舞伎町");
      expect(areas.map((a) => a.label)).toContain("大宮");
    });

    it("存在しない地方は空配列を返す", () => {
      expect(getAreasByRegion("不明")).toEqual([]);
    });
  });

  describe("getAreasByPrefecture", () => {
    it("東京都のエリアを取得できる", () => {
      const areas = getAreasByPrefecture("東京都");
      expect(areas.map((a) => a.label)).toContain("歌舞伎町");
      expect(areas.map((a) => a.label)).toContain("新宿");
      expect(areas.map((a) => a.label)).toContain("町田");
    });

    it("存在しない県は空配列を返す", () => {
      expect(getAreasByPrefecture("不明県")).toEqual([]);
    });
  });

  describe("getAreasByCity", () => {
    it("名古屋市のエリアIDを取得できる", () => {
      const ids = getAreasByCity("名古屋市");
      expect(ids).toContain("sakae");
      expect(ids).toContain("nishiki");
      expect(ids).toContain("meieki");
      expect(ids).toContain("sumiyoshi");
    });

    it("存在しない都市は空配列を返す", () => {
      expect(getAreasByCity("不明市")).toEqual([]);
    });
  });

  describe("searchAreas", () => {
    it("テキスト検索で部分一致するエリアを返す", () => {
      const results = searchAreas("すすきの");
      expect(results).toHaveLength(1);
      expect(results[0].label).toBe("すすきの");
    });

    it("複数マッチする場合は全て返す", () => {
      const results = searchAreas("新");
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it("空クエリは空配列を返す", () => {
      expect(searchAreas("")).toEqual([]);
      expect(searchAreas("  ")).toEqual([]);
    });
  });

  describe("getAreaLabel", () => {
    it("IDからラベルを取得できる", () => {
      expect(getAreaLabel("kabukicho")).toBe("歌舞伎町");
      expect(getAreaLabel("susukino")).toBe("すすきの");
    });

    it("存在しないIDはIDそのものを返す", () => {
      expect(getAreaLabel("unknown")).toBe("unknown");
    });
  });
});
