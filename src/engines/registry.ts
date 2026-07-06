/**
 * 引擎注册表 —— 流派/引擎切换的唯一入口
 *
 * 新增引擎的步骤：
 * 1. `npm install <算法库>`（直接依赖上游，不 fork；需修补时用 patch-package）
 * 2. 在 engines/adapters/ 下实现适配器，输出统一模型 UnifiedQimenChart
 * 3. 在本文件 import 并加入 engines 数组
 */
import type { ChartLayer, JuMethod, QimenEngine, QimenEngineId, School } from './types';
import { sanmetaEngine } from './adapters/sanmeta';
import { bigfishEngine } from './adapters/bigfish';
import { jellyEngine } from './adapters/jelly';
import { taobiEngine } from './adapters/taobi';
import { kinqimenEngine } from './adapters/kinqimen';
import { mingfaEngine } from './adapters/mingfa';

const engines: QimenEngine[] = [
  sanmetaEngine,
  bigfishEngine,
  jellyEngine,
  taobiEngine,
  kinqimenEngine,
  mingfaEngine,
];

export const DEFAULT_ENGINE_ID: QimenEngineId = 'sanmeta';

export function listQimenEngines(): QimenEngine[] {
  return engines;
}

export function listEnginesBySchool(school: School): QimenEngine[] {
  return engines.filter((e) => e.school === school);
}

/** 支持指定盘类的引擎（年/月/日家用；时家另按流派过滤） */
export function listEnginesByLayer(layer: ChartLayer): QimenEngine[] {
  return engines.filter((e) => e.layers.includes(layer));
}

export function getQimenEngine(id: QimenEngineId): QimenEngine {
  return engines.find((e) => e.id === id) ?? engines[0];
}

export function registerQimenEngine(engine: QimenEngine): void {
  if (!engines.some((e) => e.id === engine.id)) {
    engines.push(engine);
  }
}

/** 引擎支持某定局法则返回该法，否则回退到引擎默认（methods[0]） */
export function resolveMethod(engine: QimenEngine, method: JuMethod): JuMethod {
  return engine.methods.includes(method) ? method : engine.methods[0];
}

/** 引擎支持某盘类则返回该类，否则回退到引擎默认（layers[0]） */
export function resolveLayer(engine: QimenEngine, layer: ChartLayer): ChartLayer {
  return engine.layers.includes(layer) ? layer : engine.layers[0];
}
