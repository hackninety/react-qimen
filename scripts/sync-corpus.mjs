/**
 * 升级典籍语料库依赖到 qmdj-ts-lib main 最新，并修正 lockfile 的 git 协议。
 *   npm run sync:corpus
 *
 * 背景：依赖跟随 `#main`，但 CI 用 `npm ci` 严格按 lockfile 锁定的 commit，
 * 不会自动拉最新——所以改完语料需跑本脚本刷新 lock 再提交。
 * 另：npm 默认把 GitHub git 依赖的 resolved 写成 `git+ssh://`，而云端 CI
 * 无 SSH 私钥会认证失败，本脚本统一改回 `git+https://`。
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

console.log('▶ 拉取 qmdj-ts-lib main 最新…');
execSync('npm install qmdj-ts-lib --no-fund --no-audit', { stdio: 'inherit' });

// npm 会把 spec 规范化为 github: 简写、resolved 写成 git+ssh，统一改回显式 git+https
for (const file of ['package.json', 'package-lock.json']) {
  const before = readFileSync(file, 'utf8');
  const after = before
    .replaceAll('git+ssh://git@github.com/hackninety/qmdj-ts-lib.git', 'git+https://github.com/hackninety/qmdj-ts-lib.git')
    .replaceAll('"github:hackninety/qmdj-ts-lib#main"', '"git+https://github.com/hackninety/qmdj-ts-lib.git#main"');
  if (after !== before) {
    writeFileSync(file, after);
    console.log(`✓ ${file} 中 qmdj-ts-lib 源已统一为 git+https`);
  } else {
    console.log(`✓ ${file} 已是 git+https`);
  }
}

const lock = readFileSync('package-lock.json', 'utf8');
const commit = (lock.match(/qmdj-ts-lib\.git#([0-9a-f]{7,40})/) ?? [])[1];
console.log(`\n完成。当前锁定 commit: ${commit ?? '(未识别)'}`);
console.log('下一步：npm run build 验证后，提交 package.json 与 package-lock.json 即可触发云端用新语料构建。');
