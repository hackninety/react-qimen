# GitHub 奇门遁甲开源项目调研与选型

> 调研时间：2026-07-04。目标：告别 fork 维护模式（旧项目 fork 自 qfdk/qimen），
> 改为 npm 直接依赖上游算法库 + 本地适配器（插件式），支持多家引擎与流派切换。
> 检索范围：GitHub `奇门遁甲 / qimen / qimendunjia / qmdj / 遁甲` 等关键词共 172 个仓库 + npm registry。

## 一、选型结论（已接入的 6 个引擎）

| 引擎 ID | npm 包 | 流派 | 定局法 | 许可证 | 采用理由 |
|---|---|---|---|---|---|
| `sanmeta`（默认） | [3meta](https://github.com/3metaJun/3meta) | 时家转盘 | 拆补 | MIT | 社区最活跃（v2.6，2026-06 仍在更），断盘要素最全：格局断验/旺衰/击刑/门迫/入墓/暗干/十干克应/i18n，有测试与文档站 |
| `bigfish` | [bigfishmarquis-qimen](https://github.com/perfhelf/bigfishmarquis-qimen) | 时家转盘 | 拆补/茅山/**置闰** | MIT | **唯一支持三种定局法的 JS 库**（置闰法 JS 生态独此一家），零运行时依赖，另含年/月/日家四层盘（本项目暂只用时家），地八神/暗干支 |
| `jelly` | [qimendunjia-standalone](https://github.com/MrJelly/QiMenDunJia) | 时家转盘 | 拆补 | MIT | 工程架构最佳：历法适配层（寿星天文历移植/tyme4ts/lite 三变体同 API），交节边界精度高，晚子时模式可配，monorepo+测试 |
| `taobi` | [taobi](https://github.com/Taogram/taobi) | 时家转盘 | 拆补/茅山/**均分** | MPL-2.0 | VSOP87D 天文算法节气（精确到分钟），原创「均分法」定局独此一家 |
| `kinqimen` | [kinqimen](https://www.npmjs.com/package/kinqimen)（TS 版） | 时家转盘 | 拆补 | GPL-3.0 | kentang2017 堅奇門（Python 124★）的 TS 移植，tyme4ts 历法，含门迫/击刑/三马/长生运 |
| `mingfa` | [qimen-mingfa](https://github.com/Richardge885/qimen-refactor) | **飞盘·鸣法** | 鸣法（交节定元，锁定拆补） | MIT | npm 唯一飞盘鸣法引擎：天地双神、九门（含中门）、格局断语、六亲/十神/神煞体系 |

**交叉验证**：基准盘 2024-06-15 14:30 → 芒种 阳遁六局上元 / 值符天柱 / 值使惊门，
由 3meta、qimendunjia-standalone、kinqimen、qimen-mingfa 四家**互相独立的算法**得出一致结果；
taobi（拆补模式）与 bigfish 亦一致。见 `src/engines/__tests__/engines.test.ts` 与 `scripts/engines-smoke.mjs`。

## 二、候选全景（JS/TS，可 npm 引入）

| 项目 | 星数 | 状态 | 评价 |
|---|---|---|---|
| 3meta | 16★ | ✅ 已接入 | 见上。注意：竞品 bigfish README 声称其存在“天禽随天芮门位错位” bug，**我们基准盘实测未复现**，且其源码有对应处理逻辑，判定为竞品陈旧说法 |
| bigfishmarquis-qimen | 10★ | ✅ 已接入 | 直接发布 TS 源码（`main: src/engine.ts`），需要 tsconfig paths 类型门面（见 ARCHITECTURE.md）；历法需外部提供（本项目用 lunar-typescript） |
| qimendunjia-standalone / -lite / -tyme4ts | 2★ | ✅ 已接入 | 三变体同 API 可互换：lite ~12KB（近似节气）/ standalone ~68KB（寿星历）/ tyme4ts ~6KB+依赖 |
| taobi | 54★ | ✅ 已接入 | **2024-09 后停更**；置闰法未实现、飞盘未完成；输出为字符串画布需自行解析；值符/值使需适配器自行推导 |
| kinqimen（TS 版 npm） | — | ✅ 已接入 | 发布者 coaixy（非 kentang2017 本人），GPL-3.0；只移植了时家拆补，Python 原版的刻家/金函玉镜未移植 |
| qimen-mingfa | — | ✅ 已接入 | v1.0.28（2025-01）；输出含大段古籍断语文本，适配器只取结构化字段 |
| qimen-dunjia（arc119226，5★） | 5★ | ❌ 淘汰 | **确证 bug**：节气表用繁体（芒種），历法库返回简体（芒种），全年约半数节气直接抛错 `未知的節氣`；文档极详尽可作学习资料 |
| @yhjs/dunjia（yihai-js/yihai-bagua） | — | 🔜 二期候选 | 时家 + **山向奇门**（风水盘）、移星换斗、外圈神煞插件，MIT，寿星历 TS 全家桶（含八字/大六壬），2026-02 发布 |
| mingpan（ChesterRa，91★，Apache-2.0） | 91★ | 📖 对照参考 | MCP 服务形态（依赖 MCP SDK/zod），规则参考张志春《神奇之门》，支持转盘/飞盘+拆补/茅山+时日月年盘；适合做第二意见对照，不适合作浏览器内嵌引擎 |
| Jam0731/MingPan | 2★ | 📖 观察 | 六大术数纯计算引擎，奇门支持转盘/飞盘，未发 npm |
| panming-dev/mingfa-paipan | 9★ | 📖 对照参考 | 另一家鸣法飞盘（MIT，真太阳时/交节定元），README 声称已发 npm 实际未发布，需 `github:` 依赖；可作 qimen-mingfa 的对照 |
| anthonylee1994/qimen | 10★ | 📖 观察 | TS 转盘完整实现（lunar-typescript，有测试），未发 npm |
| funan-tech-folks/nodejs-qmdj | 5★ | ❌ | 算法探索性质，README 空 |

## 三、参考实现（非 JS，规则/对照价值）

| 项目 | 语言 | 价值 |
|---|---|---|
| [kentang2017/kinqimen](https://github.com/kentang2017/kinqimen)（124★） | Python | 唯一含**刻家奇门**与**金函玉镜日家**的开源实现；置闰+拆补双法；TS 移植缺口所在 |
| [deminzhang/qimen-go](https://github.com/deminzhang/qimen-go)（25★） | Go | 覆盖最广：转盘/飞盘/鸣法+**阴盘**+日家两派+大六壬合盘；README 记录了各流派规则差异，是自研阴盘 overlay 的首选规则参考 |
| [wlhyl/qimen](https://github.com/wlhyl/qimen)（5★，GPL-3.0） | Rust | **阴盘奇门** web API（swisseph 星历），可自部署作远程引擎，GPL 注意 |
| [redrockhorse/qimenpaipan](https://github.com/redrockhorse/qimenpaipan)（16★） | Python | 置闰法参考实现（默认置闰） |
| [qfdk/qimen](https://github.com/qfdk/qimen)（189★，旧 fork 上游） | Node/Express | 茅山法+转盘网页应用；算法在 `lib/` 未发 npm——这正是当初必须 fork 的原因；有单测，仍可作茅山法对照 |
| banderzhm/ZhouYiLab（101★，MIT） | C++ | 五术合一计算引擎，WASM 化潜力 |
| taynpg/csp（50★） | C++ | 命令行式盘工具 |

**避雷**：masterai-top / alibabama401 / deeptexas-ai / taishan6868 / pokerdeveloper / deepseek7878 等
“周易排盘源码可商业运营”系仓库为同一营销矩阵，无授权保障；Horosa 系（321★）为 AGPL 完整应用非库；
hhszzzz/taibu（299★）license NOASSERTION；Brhiza/mingyu（176★）无 license——均不宜作为依赖。

## 四、流派覆盖矩阵

| 流派/盘式 | 现状 | 引擎 |
|---|---|---|
| 时家转盘 · 拆补 | ✅ 五家可互证 | sanmeta / bigfish / jelly / taobi / kinqimen |
| 时家转盘 · 茅山 | ✅ 两家 | bigfish / taobi |
| 时家转盘 · 置闰 | ✅ 一家 | bigfish |
| 时家转盘 · 均分（原创法） | ✅ 一家 | taobi |
| 飞盘 · 鸣法 | ✅ 一家 | mingfa（可加 mingfa-paipan 对照） |
| 年/月/日家盘 | 🔜 引擎已支持待接 UI | bigfish、jelly 均有四层盘 API |
| 山向奇门（风水） | 🔜 二期 | @yhjs/dunjia |
| 阴盘奇门（道家） | ❌ 无 JS 库 | 自研 overlay（转盘引擎+移星换斗层），规则参考 qimen-go / wlhyl |
| 刻家奇门、金函玉镜日家 | ❌ 仅 Python | 等待/自行移植 kinqimen |

## 五、二期路线图

1. **多引擎对照视图**：同一时刻并排渲染多家盘面并高亮差异（架构已支持，纯 UI 工作）
2. **年/月/日家盘**：bigfish `nianJia/yueJia/riJiaGenerate`、jelly `method: '日家'|'月家'|'年家'` 接入
3. **阴盘奇门 overlay 插件**：以转盘引擎统一模型为底，叠加移星换斗/时空转换层
4. **山向奇门**：接入 @yhjs/dunjia
5. ~~真太阳时校正~~ ✅ 已完成：省市区经度库 + 时区自动 + 手动经度，经度修正 + 均时差
6. ~~AI 解读导出~~ ✅ 已完成：MD（紧凑省 token）/ JSON（完整）双格式，附地理与口径上下文
