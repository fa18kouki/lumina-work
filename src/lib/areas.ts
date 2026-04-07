/**
 * 全国エリアデータ（階層構造）
 * 夜職特化のため、繁華街・主要都市中心のエリア定義
 */

// ─── 型定義 ───

export interface AreaItem {
  id: string;
  label: string;
}

export interface CityGroup {
  name: string;
  areas: AreaItem[];
}

export interface PrefectureGroup {
  name: string;
  cities?: CityGroup[];
  areas?: AreaItem[];
}

export interface RegionGroup {
  name: string;
  prefectures: PrefectureGroup[];
}

// ─── 全国エリアデータ ───

export const REGION_DATA: RegionGroup[] = [
  {
    name: "北海道",
    prefectures: [
      {
        name: "北海道",
        cities: [
          {
            name: "札幌市",
            areas: [
              { id: "susukino", label: "すすきの" },
              { id: "sapporo-eki", label: "札幌駅周辺" },
            ],
          },
        ],
        areas: [
          { id: "asahikawa", label: "旭川" },
          { id: "hakodate", label: "函館" },
          { id: "otaru", label: "小樽" },
          { id: "obihiro", label: "帯広" },
          { id: "kushiro", label: "釧路" },
        ],
      },
    ],
  },
  {
    name: "東北",
    prefectures: [
      {
        name: "宮城県",
        cities: [
          {
            name: "仙台市",
            areas: [
              { id: "kokubuncho", label: "国分町" },
              { id: "sendai-eki", label: "仙台駅周辺" },
            ],
          },
        ],
      },
      {
        name: "青森県",
        areas: [
          { id: "aomori", label: "青森" },
          { id: "hirosaki", label: "弘前" },
          { id: "hachinohe", label: "八戸" },
        ],
      },
      {
        name: "岩手県",
        areas: [{ id: "morioka", label: "盛岡" }],
      },
      {
        name: "秋田県",
        areas: [{ id: "akita", label: "秋田" }],
      },
      {
        name: "山形県",
        areas: [{ id: "yamagata", label: "山形" }],
      },
      {
        name: "福島県",
        areas: [
          { id: "koriyama", label: "郡山" },
          { id: "fukushima", label: "福島" },
          { id: "iwaki", label: "いわき" },
        ],
      },
    ],
  },
  {
    name: "関東",
    prefectures: [
      {
        name: "東京都",
        cities: [
          {
            name: "東京主要繁華街",
            areas: [
              { id: "kabukicho", label: "歌舞伎町" },
              { id: "shinjuku", label: "新宿" },
              { id: "roppongi", label: "六本木" },
              { id: "nishiazabu", label: "西麻布" },
              { id: "ginza", label: "銀座" },
              { id: "akasaka", label: "赤坂" },
              { id: "ebisu", label: "恵比寿" },
              { id: "nakameguro", label: "中目黒" },
              { id: "shibuya", label: "渋谷" },
              { id: "ikebukuro", label: "池袋" },
              { id: "ueno", label: "上野" },
              { id: "kinshicho", label: "錦糸町" },
              { id: "gotanda", label: "五反田" },
              { id: "kamata", label: "蒲田" },
            ],
          },
          {
            name: "東京その他",
            areas: [
              { id: "machida", label: "町田" },
              { id: "tachikawa", label: "立川" },
              { id: "hachioji", label: "八王子" },
              { id: "kichijoji", label: "吉祥寺" },
            ],
          },
        ],
      },
      {
        name: "神奈川県",
        cities: [
          {
            name: "横浜市",
            areas: [
              { id: "kannai", label: "関内" },
              { id: "yokohama-nishiguchi", label: "横浜駅西口" },
            ],
          },
        ],
        areas: [
          { id: "kawasaki", label: "川崎" },
          { id: "fujisawa", label: "藤沢" },
          { id: "sagamihara", label: "相模原" },
        ],
      },
      {
        name: "埼玉県",
        areas: [
          { id: "omiya", label: "大宮" },
          { id: "kawaguchi", label: "川口" },
          { id: "tokorozawa", label: "所沢" },
          { id: "kawagoe", label: "川越" },
        ],
      },
      {
        name: "千葉県",
        areas: [
          { id: "chiba", label: "千葉" },
          { id: "funabashi", label: "船橋" },
          { id: "kashiwa", label: "柏" },
          { id: "matsudo", label: "松戸" },
        ],
      },
      {
        name: "群馬県",
        areas: [
          { id: "takasaki", label: "高崎" },
          { id: "maebashi", label: "前橋" },
          { id: "ota", label: "太田" },
        ],
      },
      {
        name: "栃木県",
        areas: [
          { id: "utsunomiya", label: "宇都宮" },
          { id: "oyama", label: "小山" },
        ],
      },
      {
        name: "茨城県",
        areas: [
          { id: "mito", label: "水戸" },
          { id: "tsukuba", label: "つくば" },
          { id: "tsuchiura", label: "土浦" },
        ],
      },
    ],
  },
  {
    name: "甲信越",
    prefectures: [
      {
        name: "新潟県",
        areas: [
          { id: "niigata-furumachi", label: "新潟古町" },
          { id: "niigata-eki", label: "新潟駅周辺" },
          { id: "nagaoka", label: "長岡" },
        ],
      },
      {
        name: "長野県",
        areas: [
          { id: "nagano", label: "長野" },
          { id: "matsumoto", label: "松本" },
        ],
      },
      {
        name: "山梨県",
        areas: [{ id: "kofu", label: "甲府" }],
      },
    ],
  },
  {
    name: "東海",
    prefectures: [
      {
        name: "愛知県",
        cities: [
          {
            name: "名古屋市",
            areas: [
              { id: "sakae", label: "栄" },
              { id: "nishiki", label: "錦" },
              { id: "meieki", label: "名駅" },
              { id: "sumiyoshi", label: "住吉" },
              { id: "kanayama", label: "金山" },
              { id: "imaike", label: "今池" },
              { id: "ozone", label: "大曽根" },
              { id: "fujigaoka", label: "藤が丘" },
              { id: "sakae-joshidai", label: "栄・女子大" },
              { id: "shibata-hoshizaki", label: "柴田・星崎" },
            ],
          },
        ],
        areas: [
          { id: "toyota", label: "豊田" },
          { id: "toyohashi", label: "豊橋" },
          { id: "okazaki", label: "岡崎" },
          { id: "ichinomiya", label: "一宮" },
          { id: "kasugai", label: "春日井" },
          { id: "kariya", label: "刈谷" },
          { id: "anjo", label: "安城" },
          { id: "chita-handa", label: "知多・半田" },
        ],
      },
      {
        name: "静岡県",
        cities: [
          {
            name: "静岡市",
            areas: [
              { id: "ryogaecho", label: "両替町" },
              { id: "shizuoka-eki", label: "静岡駅周辺" },
            ],
          },
        ],
        areas: [
          { id: "hamamatsu", label: "浜松" },
          { id: "numazu", label: "沼津" },
          { id: "fuji", label: "富士" },
        ],
      },
      {
        name: "岐阜県",
        areas: [
          { id: "gifu", label: "岐阜" },
          { id: "ogaki", label: "大垣" },
        ],
      },
      {
        name: "三重県",
        areas: [
          { id: "yokkaichi", label: "四日市" },
          { id: "tsu", label: "津" },
        ],
      },
    ],
  },
  {
    name: "関西",
    prefectures: [
      {
        name: "大阪府",
        cities: [
          {
            name: "大阪市",
            areas: [
              { id: "kitashinchi", label: "北新地" },
              { id: "minami", label: "ミナミ" },
              { id: "umeda", label: "梅田" },
              { id: "namba", label: "難波" },
              { id: "juso", label: "十三" },
              { id: "kyobashi", label: "京橋" },
              { id: "tennoji", label: "天王寺" },
            ],
          },
        ],
        areas: [
          { id: "sakai", label: "堺" },
          { id: "hirakata", label: "枚方" },
          { id: "higashiosaka", label: "東大阪" },
        ],
      },
      {
        name: "京都府",
        cities: [
          {
            name: "京都市",
            areas: [
              { id: "gion", label: "祇園" },
              { id: "kiyamachi", label: "木屋町" },
              { id: "kawaramachi", label: "河原町" },
            ],
          },
        ],
      },
      {
        name: "兵庫県",
        cities: [
          {
            name: "神戸市",
            areas: [
              { id: "sannomiya", label: "三宮" },
              { id: "motomachi", label: "元町" },
            ],
          },
        ],
        areas: [
          { id: "himeji", label: "姫路" },
          { id: "nishinomiya", label: "西宮" },
          { id: "amagasaki", label: "尼崎" },
        ],
      },
      {
        name: "奈良県",
        areas: [{ id: "nara", label: "奈良" }],
      },
      {
        name: "滋賀県",
        areas: [
          { id: "otsu", label: "大津" },
          { id: "kusatsu", label: "草津" },
        ],
      },
      {
        name: "和歌山県",
        areas: [{ id: "wakayama", label: "和歌山" }],
      },
    ],
  },
  {
    name: "中国・四国",
    prefectures: [
      {
        name: "広島県",
        cities: [
          {
            name: "広島市",
            areas: [
              { id: "nagarekawa", label: "流川" },
              { id: "hiroshima-eki", label: "広島駅周辺" },
            ],
          },
        ],
        areas: [
          { id: "fukuyama", label: "福山" },
          { id: "kure", label: "呉" },
        ],
      },
      {
        name: "岡山県",
        areas: [
          { id: "okayama", label: "岡山" },
          { id: "kurashiki", label: "倉敷" },
        ],
      },
      {
        name: "山口県",
        areas: [
          { id: "shimonoseki", label: "下関" },
          { id: "yamaguchi", label: "山口" },
        ],
      },
      {
        name: "鳥取県",
        areas: [
          { id: "tottori", label: "鳥取" },
          { id: "yonago", label: "米子" },
        ],
      },
      {
        name: "島根県",
        areas: [
          { id: "matsue", label: "松江" },
          { id: "izumo", label: "出雲" },
        ],
      },
      {
        name: "愛媛県",
        areas: [{ id: "matsuyama", label: "松山" }],
      },
      {
        name: "香川県",
        areas: [{ id: "takamatsu", label: "高松" }],
      },
      {
        name: "高知県",
        areas: [{ id: "kochi", label: "高知" }],
      },
      {
        name: "徳島県",
        areas: [{ id: "tokushima", label: "徳島" }],
      },
    ],
  },
  {
    name: "九州・沖縄",
    prefectures: [
      {
        name: "福岡県",
        cities: [
          {
            name: "福岡市",
            areas: [
              { id: "nakasu", label: "中洲" },
              { id: "tenjin", label: "天神" },
            ],
          },
        ],
        areas: [
          { id: "kokura", label: "小倉" },
          { id: "kurume", label: "久留米" },
        ],
      },
      {
        name: "熊本県",
        cities: [
          {
            name: "熊本市",
            areas: [
              { id: "shimotori", label: "下通" },
              { id: "kamitori", label: "上通" },
            ],
          },
        ],
      },
      {
        name: "鹿児島県",
        areas: [
          { id: "tenmonkan", label: "天文館" },
          { id: "kagoshima-eki", label: "鹿児島駅周辺" },
        ],
      },
      {
        name: "長崎県",
        areas: [
          { id: "nagasaki", label: "長崎" },
          { id: "sasebo", label: "佐世保" },
        ],
      },
      {
        name: "大分県",
        areas: [
          { id: "oita", label: "大分" },
          { id: "beppu", label: "別府" },
        ],
      },
      {
        name: "宮崎県",
        areas: [{ id: "miyazaki", label: "宮崎" }],
      },
      {
        name: "佐賀県",
        areas: [{ id: "saga", label: "佐賀" }],
      },
      {
        name: "沖縄県",
        cities: [
          {
            name: "那覇市",
            areas: [
              { id: "naha-matsuyama", label: "松山" },
              { id: "kokusai-dori", label: "国際通り" },
            ],
          },
        ],
        areas: [
          { id: "chatan", label: "北谷" },
          { id: "okinawa-shi", label: "沖縄市" },
        ],
      },
    ],
  },
];

// ─── ユーティリティ関数 ───

/** 都道府県配下の全AreaItemを取得 */
function getPrefectureAreas(pref: PrefectureGroup): AreaItem[] {
  const items: AreaItem[] = [];
  if (pref.cities) {
    for (const city of pref.cities) {
      items.push(...city.areas);
    }
  }
  if (pref.areas) {
    items.push(...pref.areas);
  }
  return items;
}

/** 全AreaItemのフラットリスト */
export function getAllAreas(): AreaItem[] {
  const items: AreaItem[] = [];
  for (const region of REGION_DATA) {
    for (const pref of region.prefectures) {
      items.push(...getPrefectureAreas(pref));
    }
  }
  return items;
}

/** 全エリアIDのフラットリスト */
export function getAllAreaIds(): string[] {
  return getAllAreas().map((a) => a.id);
}

/** 地方でフィルター */
export function getAreasByRegion(regionName: string): AreaItem[] {
  const region = REGION_DATA.find((r) => r.name === regionName);
  if (!region) return [];
  const items: AreaItem[] = [];
  for (const pref of region.prefectures) {
    items.push(...getPrefectureAreas(pref));
  }
  return items;
}

/** 県でフィルター */
export function getAreasByPrefecture(prefName: string): AreaItem[] {
  for (const region of REGION_DATA) {
    const pref = region.prefectures.find((p) => p.name === prefName);
    if (pref) return getPrefectureAreas(pref);
  }
  return [];
}

/** 都市グループ傘下のエリアIDリスト */
export function getAreasByCity(cityName: string): string[] {
  for (const region of REGION_DATA) {
    for (const pref of region.prefectures) {
      if (pref.cities) {
        const city = pref.cities.find((c) => c.name === cityName);
        if (city) return city.areas.map((a) => a.id);
      }
    }
  }
  return [];
}

/** テキスト検索（ラベルに対する部分一致） */
export function searchAreas(query: string): AreaItem[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return getAllAreas().filter((a) => a.label.toLowerCase().includes(lower));
}

/** エリアIDからラベルを取得 */
export function getAreaLabel(id: string): string {
  const area = getAllAreas().find((a) => a.id === id);
  return area?.label ?? id;
}

// ─── エリア逆引き ───

/** エリアの所在地情報 */
export interface AreaLocation {
  region: string;
  prefecture: string;
  city?: string;
  area: string;
}

/** エリアラベルから所在地（地方・都道府県・市）を逆引き */
export function getAreaLocation(areaLabel: string): AreaLocation | null {
  for (const region of REGION_DATA) {
    for (const pref of region.prefectures) {
      if (pref.cities) {
        for (const city of pref.cities) {
          if (city.areas.some((a) => a.label === areaLabel)) {
            return { region: region.name, prefecture: pref.name, city: city.name, area: areaLabel };
          }
        }
      }
      if (pref.areas?.some((a) => a.label === areaLabel)) {
        return { region: region.name, prefecture: pref.name, area: areaLabel };
      }
    }
  }
  return null;
}

/** エリアラベルから住所プレフィックスを生成（例: "愛知県名古屋市錦"） */
export function getAreaAddressPrefix(areaLabel: string): string {
  const loc = getAreaLocation(areaLabel);
  if (!loc) return areaLabel;
  return `${loc.prefecture}${loc.city ?? ""}${loc.area}`;
}

// ─── 後方互換 ───

/** 全エリアラベルの配列（既存のAREAS互換） */
export const AREAS = getAllAreas().map((a) => a.label);

export type Area = string;
