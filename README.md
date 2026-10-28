# react-qimen 奇门遁甲排盘

奇门遁甲在线排盘。**插件式多引擎架构**：算法层全部来自 npm 开源上游（零 fork），
通过适配器归一为统一盘面模型，支持流派与定局法一键切换、多家引擎互相验证。

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

在数据导出面板手动开启「算命模式」，再展开「命例库」，可检索人生主题案例。选中「用于 AI 参考」后，AI Prompt 末尾会附上独立命例及来源；纯盘面 MD / TOON 不附加命例。

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
