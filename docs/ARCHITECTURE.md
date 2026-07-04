# 插件式引擎架构

## 设计目标

1. **不再 fork 上游**：算法库全部走 npm 依赖，升级 = `npm update`；上游需要修补时用
   `patch-package` / npm `overrides` 打薄补丁，并向上游提 PR，而不是维护整仓 fork。
2. **引擎即插件**：每个算法库一个适配器文件，输出统一领域模型；UI 完全不感知上游差异。
3. **流派可切换**：流派（时家转盘/飞盘鸣法）→ 引擎（按流派过滤）→ 定局法（按引擎能力过滤）三级切换。
4. **可互相验证**：同一流派多引擎并存，跨引擎一致性测试兜底上游算法回归。

## 分层

```
┌────────────────────────────────────────────────┐
│  UI（App / NinePalaceGrid / MetaPanel / …）     │   只消费 UnifiedQimenChart
├────────────────────────────────────────────────┤
│  registry.ts   引擎注册表（流派/定局法过滤）      │
├────────────────────────────────────────────────┤
│  adapters/     sanmeta │ bigfish │ jelly │      │   每库一个适配器
│                taobi │ kinqimen │ mingfa        │
├──────────────────────────────┬─────────────────┤
│  npm 上游算法库（零 fork）     │  calendar.ts    │   共享历法（lunar-typescript）
│  3meta / bigfishmarquis-qimen │  四柱/节气/旬首  │   供 bigfish、taobi 等
│  qimendunjia-standalone / …   │  /空亡/马星      │   “纯排盘核心”类库使用
└──────────────────────────────┴─────────────────┘
```

## 统一领域模型（`src/engines/types.ts`）

- `UnifiedQimenChart`：`meta`（四柱/节气/三元/阴阳遁/局数/旬首/符首/值符值使及落宫/空亡/马星）
  + `palaces[9]`（按洛书宫号排序）+ `patterns[]`（格局，可选）+ `raw`（原始输出，调试/导出用）。
- `PalaceInfo`：地盘干[]、天盘干[]（数组承载寄宫多干）、星/门/神、暗干、
  `marks`（空亡/马星/击刑/门迫/入墓 五种标准标记）、`extras`（引擎特有字段，键即展示标签）。
- `QimenEngine`：`id/name/school/methods[]/pkg/license/homepage/notes/capabilities[]/compute()`。
  `capabilities` 声明该引擎能产出哪些增值信息，UI 据此条件渲染，**缺失能力不代表凶吉无此象**。

## 新增一个引擎的步骤

1. `npm install <算法库>`；
2. 在 `src/engines/adapters/<id>.ts` 实现适配器：调用上游 → 归一化到 `UnifiedQimenChart`
   （星名统一带“天”前缀、门名带“门”、神名用全称、宫序 1-9）；
3. 在 `registry.ts` 的 `engines` 数组中注册；
4. 在 `engines.test.ts` 为其增加基准盘断言（局数/值符/值使/结构完整性）；
5. `scripts/engines-smoke.mjs` 中追加原始输出打印，便于排查。

## 关键实现决策与坑

| 事项 | 决策 |
|---|---|
| bigfish 发布 TS 源码（`main: src/engine.ts`） | 严格 tsc 会检查其源码报 noUnusedLocals。用 `tsconfig.app.json` 的 `paths` 把 `bigfishmarquis-qimen*` 指到 `src/types/bigfish.d.ts` 类型门面；运行时 Vite/Vitest 不读 tsconfig paths，仍解析真实源码 |
| taobi 无类型、输出为字符串画布 | `src/types/vendor.d.ts` 自声明；画布行列即洛书排布 `[巽离坤/震中兑/艮坎乾]`；值符=值符神落宫之星，值使=符首地盘宫的本位门，由适配器推导 |
| taobi 定局参数 | `options.elements`: 0 均分 / 1 拆补 / 2 茅山；`round` 正负号即阳/阴遁 |
| qimen-mingfa 的 d.ts 损坏（interfaces.d.ts 为空） | `skipLibCheck` 吞掉其声明错误，适配器内部用自定义接口断言 |
| 中五宫 | 转盘流派通常无星门神（寄坤二宫），UI 显示地盘干与暗干即可；鸣法飞盘中宫有完整星门神（含“中门”），模型天然兼容 |
| 星名归一 | `禽芮`（jelly）/`柱`（kinqimen）/`天芮,天禽`（taobi）→ 统一为 `天X` 或 `天X/天Y` |
| 晚子时（23:00-24:00） | 共享历法用 `getDayInGanZhi()`（子夜换日），与 jelly 默认 `same-day` 一致；各引擎内部自处理。跨引擎对照若在此边界出现差异属流派约定不同，非 bug |
| 时区 | 全部按浏览器本地时间起局；真太阳时校正列入二期 |

## 测试与验证

- **基准盘**：2024-06-15 14:30（芒种 阳遁六局上元/值符天柱/值使惊门），四家独立算法互证；
- **阴遁一致性**：2024-07-15 12:00，全引擎阴遁且局数、值符一致；
- **多定局法**：bigfish 茅山/置闰、taobi 茅山/均分结构完整性；
- `npm test` 跑全部断言；`node scripts/engines-smoke.mjs [ISO时间]` 打印各引擎原始输出做人工比对。

## 上游升级策略

- 常规升级：`npm update` + `npm test`（跨引擎一致性测试即回归护栏）；
- 上游破坏性变更：只改对应适配器文件；
- 上游 bug：`patch-package` 打补丁 + 提 PR，等合入后删补丁——任何情况下不 fork 整仓。
