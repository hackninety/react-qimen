/**
 * kinqimen（TS 版）适配器 —— 时家转盘 · 拆补法
 * 源自 kentang2017/kinqimen（Python 堅奇門）的 TypeScript 移植（GPL-3.0，tyme4ts 历法）
 */
import { Qimen } from 'kinqimen';
import { markKongMa, XUN_TO_FUSHOU } from '../calendar';
import type {
  ComputeInput,
  GongIndex,
  PalaceInfo,
  PalaceMark,
  QimenEngine,
  UnifiedQimenChart,
} from '../types';

const TRIGRAM_TO_GONG: Record<string, GongIndex> = {
  坎: 1, 坤: 2, 震: 3, 巽: 4, 中: 5, 乾: 6, 兑: 7, 艮: 8, 离: 9,
};

const GOD_FULL: Record<string, string> = {
  符: '值符', 蛇: '腾蛇', 阴: '太阴', 合: '六合', 勾: '勾陈',
  雀: '朱雀', 虎: '白虎', 玄: '玄武', 地: '九地', 天: '九天',
};

const CN_NUM: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

function compute({ date }: ComputeInput): UnifiedQimenChart {
  const pan = new Qimen({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  }).pan();

  const trigrams = Object.keys(TRIGRAM_TO_GONG);
  const palaces: PalaceInfo[] = trigrams
    .map((t) => {
      const gong = TRIGRAM_TO_GONG[t];
      const marks: PalaceMark[] = [];
      if (pan.menpo.some((m) => m.gong === t)) marks.push('门迫');
      if (pan.jixing.some((j) => j.gong === t)) marks.push('击刑');
      const star = pan.starPan[t as keyof typeof pan.starPan];
      const door = pan.doorPan[t as keyof typeof pan.doorPan];
      const god = pan.godPan[t as keyof typeof pan.godPan];
      return {
        gong,
        diPanGan: [pan.earthPan[t as keyof typeof pan.earthPan]].filter(Boolean) as string[],
        tianPanGan: [pan.skyPan[t as keyof typeof pan.skyPan]].filter(Boolean) as string[],
        star: star ? `天${star}` : undefined,
        gate: door ? `${door}门` : undefined,
        god: god ? GOD_FULL[god] ?? god : undefined,
        hiddenGan: pan.anganPan[t as keyof typeof pan.anganPan] || undefined,
        marks,
      };
    })
    .sort((a, b) => a.gong - b.gong);

  // '阳六局上' → 阳遁 / 6 / 上元
  const m = pan.ju.match(/([阴阳])([一二三四五六七八九1-9])局([上中下])?/);
  const dun = m?.[1] === '阴' ? '阴遁' : '阳遁';
  const ju = m ? (CN_NUM[m[2]] ?? Number(m[2])) : 0;
  const yuan = m?.[3] ? (`${m[3]}元` as '上元' | '中元' | '下元') : undefined;

  const gz = pan.ganzhi.match(/^(..)年(..)月(..)日(..)时$/);
  const kongWang = pan.xunKong.hourKong.split('');
  const zhiFuStar = pan.zhifuZhishi.zhifuStarGong[0];
  const zhiShiDoor = pan.zhifuZhishi.zhishiDoorGong[0];

  const chart: UnifiedQimenChart = {
    engineId: 'kinqimen',
    school: '时家转盘',
    method: '拆补',
    layer: '时家',
    meta: {
      siZhu: {
        year: gz?.[1] ?? '',
        month: gz?.[2] ?? '',
        day: gz?.[3] ?? '',
        hour: gz?.[4] ?? '',
      },
      jieQi: pan.jieqi,
      yuan,
      dun,
      ju,
      xunShou: pan.xunHead,
      fuShou: XUN_TO_FUSHOU[pan.xunHead],
      zhiFu: zhiFuStar ? `天${zhiFuStar}` : undefined,
      zhiShi: zhiShiDoor ? `${zhiShiDoor}门` : undefined,
      zhiFuGong: TRIGRAM_TO_GONG[pan.zhifuZhishi.zhifuStarGong[1]],
      zhiShiGong: TRIGRAM_TO_GONG[pan.zhifuZhishi.zhishiDoorGong[1]],
      kongWang,
      maXing: pan.maXing.yiMa,
      solarText: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    },
    palaces,
    raw: pan,
  };

  // 空亡/马星按地支落宫标记
  markKongMa(chart.palaces, kongWang, pan.maXing.yiMa);
  return chart;
}

export const kinqimenEngine: QimenEngine = {
  id: 'kinqimen',
  name: '堅奇門 KinQimen',
  school: '时家转盘',
  methods: ['拆补'],
  layers: ['时家'],
  pkg: 'kinqimen',
  license: 'GPL-3.0',
  homepage: 'https://github.com/kentang2017/kinqimen',
  notes: 'kentang2017 堅奇門的 TS 移植，tyme4ts 历法，含门迫/击刑/三马/长生运',
  capabilities: ['暗干', '击刑', '门迫', '马星', '空亡'],
  compute,
};
