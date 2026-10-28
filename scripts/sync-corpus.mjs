/**
 * 按 common-ts-lib 发布的独立包地址更新 qmdj-ts-lib，并刷新 npm lockfile。
 *   npm run sync:corpus -- <包地址>
 *   npm run sync:corpus -- <包地址> --dry-run
 * 不带地址时使用 package.json 当前锁定的来源，不自动跟随 main 或切换到 npm 同名包。
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const usage = '用法：npm run sync:corpus -- [common-ts-lib 发布的 qmdj-ts-lib 包地址] [--dry-run]';

if (args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}

const dryRun = args.includes('--dry-run');
const sources = args.filter((arg) => arg !== '--dry-run');
if (sources.length > 1 || sources.some((arg) => arg.startsWith('-'))) {
  throw new Error(usage);
}

const manifest = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const source = sources[0] ?? manifest.dependencies?.['qmdj-ts-lib'];
if (!source || /hackninety\/qmdj-ts-lib(?:[.#/]|$)/.test(source)) {
  throw new Error('请指定 common-ts-lib 发布的 qmdj-ts-lib 包地址；旧独立仓库已迁移。\n' + usage);
}

console.log(`qmdj-ts-lib 安装来源：${source}`);
if (dryRun) {
  console.log('仅预览；未修改依赖或 lockfile。');
  process.exit(0);
}

// 使用 npm run 提供的 CLI 路径，不经过 shell，包地址不会被解释为命令。
const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error('请通过 npm run sync:corpus 执行，以使用当前项目的 npm。');
}
const result = spawnSync(process.execPath, [
  npmCli, 'install', `qmdj-ts-lib@${source}`, '--save-exact', '--no-fund', '--no-audit',
], { cwd: ROOT, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const lock = JSON.parse(readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'));
const installed = lock.packages?.['node_modules/qmdj-ts-lib'];
if (!installed) throw new Error('安装后 lockfile 缺少 qmdj-ts-lib，请检查 npm 输出。');
console.log(`完成。版本：${installed.version ?? '(本地链接)'}；来源：${installed.resolved ?? source}`);
console.log('下一步：npm test && npm run build，验证后提交 package.json 与 package-lock.json。');
