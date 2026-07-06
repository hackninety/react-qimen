/**
 * bigfishmarquis-qimen 的类型门面
 *
 * 该包直接发布 TypeScript 源码（main: src/engine.ts），若让 tsc 编译其源文件，
 * 会被本项目的严格选项（noUnusedLocals 等）拦下。tsconfig.app.json 通过 paths
 * 把相关模块指到本文件，仅做类型声明；运行时 Vite/Vitest 仍解析真实源码。
 */
declare module 'bigfishmarquis-qimen' {
  export interface QimenPalace {
    palaceNumber: number;
    palaceName: string;
    palaceElement: string;
    skyStem: string;
    earthStem: string;
    hiddenStems: string[];
    star: string;
    starElement: string;
    door: string;
    doorElement: string;
    god: string;
    godShort: string;
    marks: string[];
    jiMarks?: string[];
    highlightStem?: string;
    jiGanStem?: string;
    diGod?: string;
  }

  export interface QimenChart {
    palaces: QimenPalace[];
    zhiFuStar: string;
    zhiShiDoor: string;
    zhiFuPalace: number;
    zhiShiPalace: number;
    dun: 'yang' | 'yin';
    juNumber: number;
    yuan: string;
    kongWang: string[];
    solarTerm?: string;
    fourPillars?: {
      year: { gan: string; zhi: string };
      month: { gan: string; zhi: string };
      day: { gan: string; zhi: string };
      hour: { gan: string; zhi: string };
    };
  }

  export interface JuResult {
    isYangDun: boolean;
    juNumber: number;
    yuan: '上' | '中' | '下';
  }

  /** 年家排盘（按太岁年定局） */
  export function nianJiaGenerate(year: number): QimenChart;
  /** 月家排盘（month 为节气月序：寅=1 … 丑=12） */
  export function yueJiaGenerate(year: number, month: number): QimenChart;
  /** 日家排盘（公历年月日） */
  export function riJiaGenerate(year: number, month: number, day: number): QimenChart;
}

declare module 'bigfishmarquis-qimen/src/engines/shijia' {
  import type { QimenChart } from 'bigfishmarquis-qimen';
  export function shiJiaGenerate(
    hourStem: string,
    hourBranch: string,
    juNumber: number,
    dun: 'yang' | 'yin',
    fourPillars: {
      year: { gan: string; zhi: string };
      month: { gan: string; zhi: string };
      day: { gan: string; zhi: string };
      hour: { gan: string; zhi: string };
    },
    solarTerm?: string,
  ): QimenChart;
}

declare module 'bigfishmarquis-qimen/src/engines/chaibuquju' {
  import type { JuResult } from 'bigfishmarquis-qimen';
  export function chaiBuJuByGanZhi(solarTerm: string, dayGan: string, dayZhi: string, hour?: number): JuResult;
}

declare module 'bigfishmarquis-qimen/src/engines/maoshan' {
  import type { JuResult } from 'bigfishmarquis-qimen';
  export function maoShanJu(solarTerm: string, elapsedHours: number): JuResult;
  export function isYangDunTerm(solarTerm: string): boolean;
}

declare module 'bigfishmarquis-qimen/src/engines/zhirun' {
  import type { JuResult } from 'bigfishmarquis-qimen';
  export function zhiRunJu(solarTerm: string, dayGzIndex: number, daysSinceJieQi: number): JuResult;
}
