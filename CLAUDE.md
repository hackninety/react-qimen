# CLAUDE.md

react-qimen —— 奇门遁甲排盘（React 19 + Vite + TypeScript + Tailwind 4），插件式多引擎架构，支持时家转盘（拆补/茅山/置闰/均分）与飞盘鸣法，年/月/日/时四盘。

## 协作要求

- **语言**：始终用中文与用户对话；代码注释、文档同样用中文。
- **提交**：commit message 用中文，简洁描述改动。
- **存档式推送**：每次处理完任务，自动 commit 并推送到主分支 `main`（类似存档），无需询问。
- **姊妹库**：项目引用同一 GitHub 账号（hackninety）下的 `*-ts-lib` 库（本项目当前为 `qmdj-ts-lib`，git 依赖跟 main 分支）。如任务需要改动这些库，可同步修改并推送到对应仓库。

## 常用命令

- `npm run dev` 开发预览；`npm run build` 构建（先跑 tsc -b）
- `npm test` 单测（vitest）；`npm run lint` 检查

## 结构速览

- `src/engines/` 多引擎适配层，统一输出 `UnifiedQimenChart`（registry 注册，types 定义）
- `src/utils/export.ts` MD/JSON/TOON 导出（AI 分析素材）；`prompt-template.ts` 六步法 AI Prompt
- `src/utils/` relations（生克预计算）、yongshen（用神定位）、cross-check（双引擎校验）、true-solar-time（真太阳时）
- `src/hooks/useCanonRefs`、`useZhanFa` 典籍检索（动态导入 qmdj-ts-lib，不进首屏包）
- `src/components/` 各面板组件；`src/App.tsx` 内 `Section` 玻璃卡片布局；配色为暗色金系（`--color-gold`）
