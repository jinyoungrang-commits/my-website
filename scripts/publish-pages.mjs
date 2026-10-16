import { execFileSync } from "node:child_process";
import { readdir, lstat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist-pages");
const git = (args, input) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    ...(input === undefined ? {} : { input }),
  }).trim();
await lstat(path.join(output, "index.html"));
await writeFile(path.join(output, ".nojekyll"), "");

// Build a separate artifact commit without moving HEAD or touching the source index.
async function tree(directory) {
  const entries = [];
  for (const name of (await readdir(directory)).sort()) {
    const file = path.join(directory, name);
    const stat = await lstat(file);
    if (stat.isSymbolicLink())
      throw new Error("배포 산출물에는 심볼릭 링크를 넣을 수 없습니다.");
    if (stat.isDirectory())
      entries.push(`040000 tree ${await tree(file)}\t${name}\0`);
    else if (stat.isFile())
      entries.push(
        `100644 blob ${git(["hash-object", "-w", "--", file])}\t${name}\0`,
      );
    else throw new Error("지원하지 않는 배포 파일입니다.");
  }
  return git(["mktree", "-z"], entries.join(""));
}
let parent;
try {
  git(["ls-remote", "--exit-code", "origin", "refs/heads/gh-pages"]);
  git(["fetch", "--no-tags", "origin", "refs/heads/gh-pages"]);
  parent = git(["rev-parse", "FETCH_HEAD"]);
} catch (error) {
  if (error.status !== 2) throw error;
}
const commit = git([
  "commit-tree",
  await tree(output),
  ...(parent ? ["-p", parent] : []),
  "-m",
  "Publish free Dagachi browser demo",
]);
git(["push", "origin", `${commit}:refs/heads/gh-pages`]);
console.log("무료 체험 사이트 빌드를 gh-pages 브랜치에 게시했습니다.");
console.log(
  "공개 주소 사용에는 GitHub Settings → Pages의 브랜치 설정 확인이 필요합니다.",
);
