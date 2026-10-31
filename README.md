# react-qimen 奇门遁甲排盘

奇门遁甲在线排盘。**插件式多引擎架构**：算法层全部来自 npm 开源上游（零 fork），
通过适配器归一为统一盘面模型，支持流派与定局法一键切换、多家引擎互相验证。

## 在 AI 中使用统一 MCP

支持 MCP 的 AI 客户端可连接 **[https://mcp.0x7c.cc/mcp](https://mcp.0x7c.cc/mcp)**，传输方式选 **Streamable HTTP**，认证选**无**，无需访问令牌。MCP 负责排盘和 common 资料检索，当前 AI 再据此解读；远程调用会把填写的时间等参数发送到该服务。

统一服务 `paipan-common` 提供 **31 个工具**：6 个跨术数排盘与 common 检索基础工具、11 个 `bazi_` 八字高级工具、14 个 `taiyi_` 太乙高级工具；另有 7 个提示词和 5 个静态资源。本机 stdio 与远程 HTTP 使用同一套能力，每次传完整参数，不使用旧 `chartId`。

`prepare_reading.searchQueries` 可明确提供 1–3 个检索关键词，原问题保留在 `question`，结果会返回实际关键词。

首次配置时按所用客户端选择一条；本机 stdio 与远程 HTTP 二选一。已存在 `paipan-common` 时先在客户端移除旧同名连接再更换方式，旧 `bazi`、`taiyi`、`paipan-common-remote` 连接可移除，避免重复注册。保存后重连 MCP。

安装对应 CLI 后，在终端执行其中一条：

```bash
# Codex
codex mcp add paipan-common --url https://mcp.0x7c.cc/mcp

# Claude Code（当前用户范围）
claude mcp add --transport http --scope user paipan-common https://mcp.0x7c.cc/mcp
```

配置后重新打开客户端会话。已有本机 `paipan-common` 配置时，本机与远程选择一个即可，无需重复添加。命令说明见 [Codex MCP 文档](https://learn.chatgpt.com/docs/extend/mcp)和 [Claude Code MCP 文档](https://code.claude.com/docs/en/mcp)。

连接后可复制以下示例给 AI（请替换成实际起局资料）：

> 请先调用 system_catalog 核对参数，再用 prepare_reading 排奇门（systems=["qimen"]）。起局时间 eventTime 为公历 2026-10-29 14:30，timezone="+08:00"，不启用真太阳时；使用 sanmeta 引擎、时家拆补，研究主题为求财，不开启算命模式。检索 common 的 qmdj 典籍，再用 corpus_read 核对相关原文，标注书名、资料 ID 和来源，区分盘面字段、原典说法与推测。缺少必要参数时先问我。

统一 MCP 0.3.x 起 `system="qimen"` 开放全部六个引擎（`options.engine`：sanmeta / bigfish / jelly / taobi / kinqimen / mingfa），以及四层（`layer`：时家 / 日家 / 月家 / 年家）与六种定局法（`method`：拆补 / 茅山 / 置闰 / 均分 / 鸣法 / 固定）中该引擎支持的组合；合法组合与年份范围（jelly 为 1901–2099，其余 1900–2100）以 `system_catalog.families` 中 qimen 的 `engineVariants` 为准。网页的占类用神和年命定位辅助分析仍未接入 MCP。`question` 是研究与检索主题，不是定局参数。`chart_calculate` 的选项直接放 `options`；`prepare_reading` 按系统分组，例如 `options={"qimen":{"engine":"sanmeta","method":"拆补","layer":"时家"}}`。

普通占事必须提供 `eventTime`，不需要无关的生日或性别。时间须明确公历日期、时分和时区（IANA 名或固定偏移，二者在夏令时日期可能不同）；启用真太阳时须明确提供 `eventTime.longitude`，不能由 AI 猜测。common 的奇门典籍由 `qmdj-ts-lib` 提供；只有明确设置 `fortuneMode=true` 并另提供完整 `birth`，才联查人生主题命例，生日不能替代起局时间。默认 `practice` 不读取案例答案；只有明确要求参考答案时，才使用 `corpus_read` 的 `mode="reference"` 与 `includeAnswers=true`。

## 特性

- **四层盘**：时家（最常用）· 日家 · 月家 · 年家（观一年吉凶）——bigfish / jelly 引擎支持年月日家
- **两大流派**：时家转盘（拆补 / 茅山 / 置闰 / 均分四种定局法）、飞盘鸣法
- **六个引擎**：3meta（默认）· 鲲侯 bigfishmarquis-qimen · 鲸落 qimendunjia-standalone · 道盘 taobi · 堅奇門 kinqimen · 鸣法 qimen-mingfa
- **完整盘面**：九宫（神/星/门/天地盘干/暗干/辖支/旺衰角标/吉凶指示条/符使角标）、四柱竖卡、局数三元、值符值使、旬首符首、空亡马星、击刑/门迫/入墓标记、格局断验（含鸣法古籍断语）
- **断局指引**：三吉门/三凶门方位、值符值使方位、马空刑迫墓要点、格局统计自动提取
- **九宫详解**：每宫星（含辅星别名）/门/神组合、天地盘干、落宫格局、星门神简义
- **真太阳时**：全国省市区经度库 / 时区自动 / 手动经度三种定位，经度修正 + 均时差（Spencer 公式），修正明细全程可见
- **导出 & AI**：下载/复制 MD（紧凑省 token）、复制 JSON（完整）、一键 AI Prompt（内嵌盘面与分析框架）；均附排盘口径与地理/时间上下文（地名、经度、时区、真太阳时明细）
- **典籍库**：内置《奇門遁甲秘笈大全》（附《金函玉鏡》残卷）、《遁甲演義》《奇門遁甲統宗》《奇门宝鉴》（[qmdj-ts-lib](https://github.com/hackninety/common-ts-lib/tree/main/packages/qmdj-ts-lib) 独立包），抽屉式阅读 + 全文检索，书卷按需懒加载不占首屏
- **暗/亮主题**：按时段自动 + 手动切换
- 跨引擎一致性测试兜底：基准盘由四家独立算法互证，另有 taobi↔3meta 多时辰扫描对照

## 命例参考

在数据导出面板手动开启「算命模式」，再展开「命例库」，可检索人生主题案例。当前使用 `mingli-cases-ts-lib` / `mingli-cases-react` 独立 Release `0.1.1`。点击「用于 AI 参考（不含答案）」会附入独立命例及来源；如需答案，先揭晓，再明确点击「用于 AI 参考（含已揭晓答案）」。隐藏答案会撤销含答案的引用。两种引用均只追加到 AI Prompt，纯盘面 MD / TOON 不附加命例。

案例显示出生资料注记、钟点精度与来源；「钟点未核实」和「区间中点」不能视为已证实的精确出生时刻，也不能直接替当前求测人填表。

开关默认关闭，不记忆开启状态。普通占事不加载命例界面或数据；关闭模式、换盘会清除引用。既有占类、年命与起局时间含义不变，命例不会替代本盘用神、古法或排盘算法，也不能当作当前求测人的经历。

门控回归：`npm run test:e2e` 会构建后启动独立临时预览，通过 Playwright 截获真实复制文本，验证默认关闭、仅开启时均不加载资源，展开后按需加载，关闭后复制恢复原文。结果写入忽略目录 `test-results/`。默认使用 Windows 系统 Chrome；其他环境先运行 `npx playwright install chromium`，或用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定浏览器。`E2E_BASE_URL` 可指向已有预览。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:6699
npm test           # 引擎冒烟 + 跨引擎一致性测试
node scripts/engines-smoke.mjs "2024-06-15T14:30"   # 打印各引擎原始输出
```

典籍包由 `common-ts-lib` 单仓库独立发布。升级语料时执行
`npm run sync:corpus -- <新发布的 qmdj-ts-lib 包地址>`，地址取自
[qmdj-ts-lib 的独立发布页](https://github.com/hackninety/common-ts-lib/releases/tag/qmdj-ts-lib-v0.2.0)，
再运行测试与构建，提交更新后的依赖和锁文件。
附加 `--dry-run` 可先查看安装来源；不传地址会使用 `package.json` 当前来源，不会自动跟随旧仓库 `main`。

## 文档

- [docs/SCHOOLS.md](docs/SCHOOLS.md) — 流派/盘类/定局法区别详解 + **用 AI 分析解读的流派推荐排序**
- [docs/RESEARCH.md](docs/RESEARCH.md) — GitHub 奇门开源项目全景调研、选型理由、避雷清单、流派覆盖矩阵与二期路线
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 插件式引擎架构、统一模型、新增引擎步骤、关键决策与坑

## 技术栈

Vite 7 · React 19 · TypeScript · Tailwind CSS 4 · Vitest，纯前端静态应用。

## 声明

排盘算法均来自开源上游库（见各引擎面板内的仓库链接与许可证）；本项目仅供学习研究。
