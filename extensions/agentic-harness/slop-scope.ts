import { execFile } from "child_process";
import { createHash } from "crypto";
import { access, readFile } from "fs/promises";
import { join } from "path";

export interface SlopScopeSnapshot {
  head: string | null;
  fileHashes: Record<string, string | null>;
}

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"]);
const LOCK_FILES = new Set(["package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml"]);

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function basename(path: string): string {
  const normalized = normalizePath(path);
  return normalized.slice(normalized.lastIndexOf("/") + 1);
}

function extension(path: string): string {
  const name = basename(path);
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index);
}

export function isSourceCodePath(path: string): boolean {
  const normalized = normalizePath(path);
  const name = basename(normalized);

  if (normalized.startsWith("docs/") || normalized.includes("/docs/")) return false;
  if (normalized.startsWith("tests/") || normalized.includes("/tests/")) return false;
  if (normalized.includes("/node_modules/") || normalized.startsWith("node_modules/")) return false;
  if (normalized.startsWith("dist/") || normalized.includes("/dist/")) return false;
  if (normalized.startsWith("build/") || normalized.includes("/build/")) return false;
  if (normalized.startsWith("coverage/") || normalized.includes("/coverage/")) return false;
  if (LOCK_FILES.has(name)) return false;
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(name)) return false;
  if (name.endsWith(".config.ts") || name.endsWith(".config.js") || name.endsWith(".config.mjs") || name.endsWith(".config.cjs")) return false;

  return SOURCE_EXTENSIONS.has(extension(name));
}

function git(args: string[], cwd: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile("git", args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
      if (error) resolve(null);
      else resolve(stdout.replace(/(?:\r?\n)+$/, ""));
    });
  });
}

function parseStatusFiles(output: string | null): string[] {
  if (!output) return [];
  const files = new Set<string>();
  for (const line of output.split("\n")) {
    if (!line.trim()) continue;
    const status = line.slice(0, 2);
    let path = line.slice(3).trim();
    if ((status.includes("R") || status.includes("C")) && path.includes(" -> ")) {
      path = path.split(" -> ").pop() ?? path;
    }
    if (path) files.add(normalizePath(path));
  }
  return [...files].sort();
}

function parseNameOnly(output: string | null): string[] {
  if (!output) return [];
  return output
    .split("\n")
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean)
    .sort();
}

async function fileHash(cwd: string, path: string): Promise<string | null> {
  try {
    const content = await readFile(join(cwd, path));
    return createHash("sha256").update(content).digest("hex");
  } catch {
    return null;
  }
}

async function pathExists(cwd: string, path: string): Promise<boolean> {
  try {
    await access(join(cwd, path));
    return true;
  } catch {
    return false;
  }
}

async function hashFiles(cwd: string, files: string[]): Promise<Record<string, string | null>> {
  const hashes: Record<string, string | null> = {};
  for (const file of files) {
    hashes[file] = await fileHash(cwd, file);
  }
  return hashes;
}

export async function captureSlopScopeSnapshot(cwd: string): Promise<SlopScopeSnapshot> {
  const head = await git(["rev-parse", "HEAD"], cwd);
  const statusFiles = parseStatusFiles(await git(["status", "--porcelain=v1"], cwd));
  return {
    head,
    fileHashes: await hashFiles(cwd, statusFiles),
  };
}

export async function getChangedSourceFilesForSlopCleaner(cwd: string, before: SlopScopeSnapshot): Promise<string[]> {
  const changed = new Set<string>();
  const afterHead = await git(["rev-parse", "HEAD"], cwd);

  if (before.head && afterHead && before.head !== afterHead) {
    for (const file of parseNameOnly(await git(["diff", "--name-only", `${before.head}..${afterHead}`], cwd))) {
      changed.add(file);
    }
  }

  const afterStatusFiles = parseStatusFiles(await git(["status", "--porcelain=v1"], cwd));
  const afterHashes = await hashFiles(cwd, afterStatusFiles);
  for (const file of afterStatusFiles) {
    if (!(file in before.fileHashes) || before.fileHashes[file] !== afterHashes[file]) {
      changed.add(file);
    }
  }

  const sourceFiles: string[] = [];
  for (const file of [...changed].sort()) {
    if (isSourceCodePath(file) && await pathExists(cwd, file)) {
      sourceFiles.push(file);
    }
  }
  return sourceFiles;
}
