/**
 * 占类与用神规则表（时家主流转盘口径，只编码高共识规则）。
 *
 * 占类与 qmdj-ts-lib 占目库的 15 个分类论断严格对齐（另加「综合」），
 * 选定占类后：用神自动定位落宫（utils/yongshen.ts）+ 对应古法原文
 * （qmdj-ts-lib/zhanmu）一并注入导出与 AI Prompt。
 * 低共识的取用之争不硬编码，交由古法原文与 AI 权衡。
 */

export type YongShenKind = 'dayGan' | 'hourGan' | 'gan' | 'gate' | 'star' | 'god' | 'ma';

export interface YongShenRule {
  /** 用神角色（如「财门」「病星」） */
  role: string;
  kind: YongShenKind;
  /** kind=gan/gate/star/god 时的符号（庚 / 生门 / 天芮 / 六合） */
  symbol?: string;
}

export interface TopicDef {
  /** 占类 id，与 qmdj-ts-lib zhanmu topics 对齐（综合除外） */
  id: string;
  label: string;
  /** 用神（通用的日干/时干由定位器自动附加，此处只列专属用神） */
  yongShen: YongShenRule[];
  /** 检索具体占目（卷七~十）用的关键词 */
  keywords: string[];
  /** 口径备注 */
  note?: string;
}

/** 通用用神：任何占类都先看日干（求测人）与时干（所占之事） */
export const COMMON_YONGSHEN: YongShenRule[] = [
  { role: '求测人（日干）', kind: 'dayGan' },
  { role: '所占之事（时干）', kind: 'hourGan' },
];

export const TOPICS: TopicDef[] = [
  {
    id: '综合', label: '综合（未指定）',
    yongShen: [
      { role: '主事之神（值符）', kind: 'god', symbol: '值符' },
      { role: '事之门户（值使）', kind: 'gate', symbol: '值使' },
    ],
    keywords: [],
    note: '未指定占事，仅列通用用神；建议选定占类以获得对应古法',
  },
  {
    id: '求财', label: '求财 · 生意交易',
    yongShen: [
      { role: '财门（生门）', kind: 'gate', symbol: '生门' },
      { role: '钱财资本（戊）', kind: 'gan', symbol: '戊' },
    ],
    keywords: ['财', '债', '买', '卖', '交易', '贸易', '开店', '合伙', '货'],
  },
  {
    id: '婚姻', label: '婚姻 · 感情',
    yongShen: [
      { role: '男方（庚）', kind: 'gan', symbol: '庚' },
      { role: '女方（乙）', kind: 'gan', symbol: '乙' },
      { role: '婚姻媒介（六合）', kind: 'god', symbol: '六合' },
    ],
    keywords: ['婚', '嫁', '娶', '纳宠'],
  },
  {
    id: '词讼', label: '官司 · 词讼',
    yongShen: [
      { role: '词讼之门（惊门）', kind: 'gate', symbol: '惊门' },
      { role: '对方/仇怨（庚）', kind: 'gan', symbol: '庚' },
      { role: '官府法庭（开门）', kind: 'gate', symbol: '开门' },
    ],
    keywords: ['讼', '官司', '状', '罪', '囚', '审', '嘱托'],
  },
  {
    id: '疾病', label: '疾病 · 求医',
    yongShen: [
      { role: '病症（天芮）', kind: 'star', symbol: '天芮' },
      { role: '医药（天心）', kind: 'star', symbol: '天心' },
      { role: '医生（乙）', kind: 'gan', symbol: '乙' },
    ],
    keywords: ['病', '医', '症', '愈'],
  },
  {
    id: '官禄', label: '事业 · 官禄升迁',
    yongShen: [
      { role: '官职事业（开门）', kind: 'gate', symbol: '开门' },
      { role: '上司贵人（值符）', kind: 'god', symbol: '值符' },
    ],
    keywords: ['官', '升', '任', '迁', '禄', '批文', '差遣', '役', '幕馆'],
  },
  {
    id: '科试', label: '考试 · 科试',
    yongShen: [
      { role: '文书成绩（丁）', kind: 'gan', symbol: '丁' },
      { role: '考场文化（景门）', kind: 'gate', symbol: '景门' },
      { role: '文昌之星（天辅）', kind: 'star', symbol: '天辅' },
    ],
    keywords: ['试', '考', '科举', '殿试', '书馆', '童生'],
  },
  {
    id: '出行', label: '出行 · 远行',
    yongShen: [
      { role: '出行门户（开门）', kind: 'gate', symbol: '开门' },
      { role: '动象（马星）', kind: 'ma' },
    ],
    keywords: ['出行', '出外', '行水陆', '渡', '路'],
  },
  {
    id: '行人', label: '行人 · 走失寻人',
    yongShen: [
      { role: '行踪动静（马星）', kind: 'ma' },
      { role: '藏匿（六合）', kind: 'god', symbol: '六合' },
    ],
    keywords: ['行人', '走失', '寻', '访', '归期', '信'],
    note: '行人以时干为用（通用用神已含）；杜门主藏形',
  },
  {
    id: '家宅', label: '家宅 · 迁移',
    yongShen: [
      { role: '宅舍田产（生门）', kind: 'gate', symbol: '生门' },
      { role: '家宅之星（天禽）', kind: 'star', symbol: '天禽' },
    ],
    keywords: ['宅', '房', '迁移', '住', '窑'],
  },
  {
    id: '胎产', label: '胎产 · 子嗣',
    yongShen: [
      { role: '胎孕（六合）', kind: 'god', symbol: '六合' },
      { role: '产母（乙）', kind: 'gan', symbol: '乙' },
    ],
    keywords: ['孕', '胎', '产', '生男女'],
  },
  {
    id: '晴雨', label: '天时 · 晴雨',
    yongShen: [
      { role: '晴象（丙）', kind: 'gan', symbol: '丙' },
      { role: '雨象（壬）', kind: 'gan', symbol: '壬' },
      { role: '雨雾（癸）', kind: 'gan', symbol: '癸' },
    ],
    keywords: ['雨', '晴', '雪', '天时'],
  },
  {
    id: '身命', label: '身命 · 运势',
    yongShen: [
      { role: '主事之神（值符）', kind: 'god', symbol: '值符' },
      { role: '命运门户（值使）', kind: 'gate', symbol: '值使' },
    ],
    keywords: ['身命', '寿夭', '年命', '贵贱'],
  },
  {
    id: '兵', label: '争斗 · 竞争（兵占）',
    yongShen: [
      { role: '我方主帅（值符）', kind: 'god', symbol: '值符' },
      { role: '敌方（庚）', kind: 'gan', symbol: '庚' },
      { role: '扬兵之位（九天）', kind: 'god', symbol: '九天' },
      { role: '伏藏之位（九地）', kind: 'god', symbol: '九地' },
    ],
    keywords: ['兵', '战', '攻', '守', '贼', '敌', '军'],
  },
  {
    id: '埋葬', label: '阴宅 · 埋葬',
    yongShen: [{ role: '葬地阴宅（死门）', kind: 'gate', symbol: '死门' }],
    keywords: ['葬', '坟', '墓'],
  },
  {
    id: '田禾', label: '田禾 · 种植',
    yongShen: [
      { role: '田土（生门）', kind: 'gate', symbol: '生门' },
      { role: '禾稼（天禽）', kind: 'star', symbol: '天禽' },
    ],
    keywords: ['田', '禾', '种', '谷', '蚕'],
  },
];

export function getTopic(id: string): TopicDef {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0];
}
