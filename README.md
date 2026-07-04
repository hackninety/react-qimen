# react-qimen 奇门遁甲排盘

奇门遁甲在线排盘。**插件式多引擎架构**：算法层全部来自 npm 开源上游（零 fork），
通过适配器归一为统一盘面模型，支持流派与定局法一键切换、多家引擎互相验证。

## 特性

- **两大流派**：时家转盘（拆补 / 茅山 / 置闰 / 均分四种定局法）、飞盘鸣法
- **六个引擎**：3meta（默认）· 鲲侯 bigfishmarquis-qimen · 鲸落 qimendunjia-standalone · 道盘 taobi · 堅奇門 kinqimen · 鸣法 qimen-mingfa
- **完整盘面**：九宫（神/星/门/天地盘干/暗干）、四柱、局数三元、值符值使、旬首符首、空亡马星、击刑/门迫/入墓标记、格局断验（含鸣法古籍断语）、旺衰
- **一键复制 JSON**：统一模型可直接投喂 AI 解读
- 跨引擎一致性测试兜底：基准盘由四家独立算法互证

## 快速开始

```bash
npm install
npm run dev        # http://localhost:6699
npm test           # 引擎冒烟 + 跨引擎一致性测试
node scripts/engines-smoke.mjs "2024-06-15T14:30"   # 打印各引擎原始输出
```

## 文档

- [docs/RESEARCH.md](docs/RESEARCH.md) — GitHub 奇门开源项目全景调研、选型理由、避雷清单、流派覆盖矩阵与二期路线
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 插件式引擎架构、统一模型、新增引擎步骤、关键决策与坑

## 技术栈

Vite 7 · React 19 · TypeScript · Tailwind CSS 4 · Vitest，纯前端静态应用。

## 声明

排盘算法均来自开源上游库（见各引擎面板内的仓库链接与许可证）；本项目仅供学习研究。
