/**
 * 引擎层统一领域模型
 *
 * UI 组件只消费本文件定义的类型；具体算法库（3meta / bigfishmarquis-qimen /
 * qimendunjia-standalone / taobi / kinqimen / qimen-mingfa）通过 engines/adapters/
 * 下各自的适配器转换为统一模型。上游库发生破坏性变更时，只需修改对应适配器文件，
 * 不再需要 fork 上游仓库。
 */

// ---------- 基础常量 ----------

export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export type TianGan = (typeof TIAN_GAN)[number];

export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export type DiZhi = (typeof DI_ZHI)[number];

/** 洛书宫号 1-9 */
export type GongIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 宫号 → 宫名 */
export const GONG_NAMES: Record<GongIndex, string> = {
  1: '坎一宫',
  2: '坤二宫',
  3: '震三宫',
  4: '巽四宫',
  5: '中五宫',
  6: '乾六宫',
  7: '兑七宫',
  8: '艮八宫',
  9: '离九宫',
};

/** 宫号 → 八卦 */
export const GONG_TRIGRAMS: Record<GongIndex, string> = {
  1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中', 6: '乾', 7: '兑', 8: '艮', 9: '离',
};

/** 宫号 → 方位 */
export const GONG_DIRECTIONS: Record<GongIndex, string> = {
  1: '正北', 2: '西南', 3: '正东', 4: '东南', 5: '中央', 6: '西北', 7: '正西', 8: '东北', 9: '正南',
};

/** 九宫在 3×3 网格中的洛书排布（上南下北，与传统盘面一致：巽4 离9 坤2 / 震3 中5 兑7 / 艮8 坎1 乾6） */
export const LUOSHU_GRID: readonly (readonly GongIndex[])[] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
] as const;

// ---------- 流派与定局法 ----------

/** 流派（盘式体系） */
export type School = '时家转盘' | '飞盘鸣法';

export const SCHOOLS: School[] = ['时家转盘', '飞盘鸣法'];

/** 盘类（时间层级）：时家最常用；年/月/日家用于观一年/一月/一日之运 */
export type ChartLayer = '时家' | '日家' | '月家' | '年家';

export const CHART_LAYERS: ChartLayer[] = ['时家', '日家', '月家', '年家'];

/** 定局法 */
export type JuMethod = '拆补' | '茅山' | '置闰' | '均分' | '鸣法';

// ---------- 统一盘面模型 ----------

/** 宫位标记（各引擎能力不同，缺失不代表无此象） */
export type PalaceMark = '空亡' | '马星' | '击刑' | '门迫' | '入墓';

/** 单个宫位的完整信息 */
export interface PalaceInfo {
  gong: GongIndex;
  /** 地盘干（含寄宫干时可能有多个） */
  diPanGan: string[];
  /** 天盘干（含寄宫干时可能有多个） */
  tianPanGan: string[];
  /** 九星 */
  star?: string;
  /** 八门（鸣法为九门，中宫有中门） */
  gate?: string;
  /** 八神（鸣法为九神） */
  god?: string;
  /** 暗干 */
  hiddenGan?: string;
  /** 宫位标记：空亡/马星/击刑/门迫/入墓 */
  marks: PalaceMark[];
  /** 引擎特有的附加展示字段（如旺衰、地八神、十二神将等），键为展示标签 */
  extras?: Record<string, string>;
}

/** 格局命中 */
export interface PatternHit {
  name: string;
  gong?: GongIndex;
  kind?: '吉' | '凶' | '中';
  note?: string;
}

/** 盘面全局信息 */
export interface ChartMeta {
  /** 四柱干支 */
  siZhu: { year: string; month: string; day: string; hour: string };
  /** 节气 */
  jieQi: string;
  /** 三元 */
  yuan?: '上元' | '中元' | '下元';
  /** 阴阳遁 */
  dun: '阳遁' | '阴遁';
  /** 局数 1-9 */
  ju: number;
  /** 旬首（甲子/甲戌/…） */
  xunShou?: string;
  /** 符首（旬首所遁六仪） */
  fuShou?: string;
  /** 值符星 */
  zhiFu?: string;
  /** 值使门 */
  zhiShi?: string;
  /** 值符落宫 */
  zhiFuGong?: GongIndex;
  /** 值使落宫 */
  zhiShiGong?: GongIndex;
  /** 旬空地支 */
  kongWang?: string[];
  /** 驿马地支 */
  maXing?: string;
  /** 公历文本 */
  solarText: string;
  /** 农历文本 */
  lunarText?: string;
}

/** 统一奇门盘 —— UI 唯一消费的数据结构 */
export interface UnifiedQimenChart {
  engineId: QimenEngineId;
  school: School;
  method: JuMethod;
  /** 盘类（时/日/月/年家） */
  layer: ChartLayer;
  meta: ChartMeta;
  /** 九宫信息，index = 宫号 - 1（中五宫依流派可能为空/寄宫） */
  palaces: PalaceInfo[];
  /** 格局（仅部分引擎提供） */
  patterns?: PatternHit[];
  /** 原始引擎输出，供调试与 JSON 导出 */
  raw?: unknown;
}

// ---------- 引擎接口 ----------

export type QimenEngineId =
  | 'sanmeta'
  | 'bigfish'
  | 'jelly'
  | 'taobi'
  | 'kinqimen'
  | 'mingfa';

/** 引擎能力声明，UI 据此决定渲染哪些面板 */
export type EngineCapability =
  | '格局'
  | '暗干'
  | '击刑'
  | '门迫'
  | '入墓'
  | '旺衰'
  | '马星'
  | '空亡';

export interface ComputeInput {
  /** 公历时间（本地时区） */
  date: Date;
  /** 定局法，必须是引擎 methods 中的一项 */
  method: JuMethod;
  /** 盘类，必须是引擎 layers 中的一项；缺省为「时家」（向后兼容） */
  layer?: ChartLayer;
}

export interface QimenEngine {
  id: QimenEngineId;
  /** 展示名 */
  name: string;
  school: School;
  /** 支持的定局法（第一项为默认） */
  methods: JuMethod[];
  /** 支持的盘类（第一项为默认；缺省视为仅「时家」） */
  layers: ChartLayer[];
  /** npm 包名 */
  pkg: string;
  license: string;
  homepage: string;
  /** 一句话特点，展示在引擎切换器中 */
  notes: string;
  capabilities: EngineCapability[];
  compute(input: ComputeInput): UnifiedQimenChart;
}
