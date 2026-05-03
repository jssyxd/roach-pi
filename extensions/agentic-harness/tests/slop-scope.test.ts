import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFile } from "child_process";
import { mkdtemp, mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  captureSlopScopeSnapshot,
  getChangedSourceFilesForSlopCleaner,
  isSourceCodePath,
} from "../slop-scope.js";

function git(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || stdout || error.message));
      else resolve(stdout.trim());
    });
  });
}

async function initRepo(): Promise<string> {
  const repo = await mkdtemp(join(tmpdir(), "pi-slop-scope-test-"));
  await git(["init"], repo);
  await git(["config", "user.email", "test@example.com"], repo);
  await git(["config", "user.name", "Test"], repo);
  await mkdir(join(repo, "src"), { recursive: true });
  await writeFile(join(repo, "src", "existing.ts"), "export const existing = 1;\n", "utf-8");
  await git(["add", "."], repo);
  await git(["commit", "-m", "init"], repo);
  return repo;
}

describe("slop scope helpers", () => {
  let repo: string;

  beforeEach(async () => {
    repo = await initRepo();
  });

  afterEach(async () => {
    await rm(repo, { recursive: true, force: true });
  });

  it("classifies production source files conservatively", () => {
    expect(isSourceCodePath("src/feature.ts")).toBe(true);
    expect(isSourceCodePath("src/feature.tsx")).toBe(true);
    expect(isSourceCodePath("src/feature.js")).toBe(true);
    expect(isSourceCodePath("docs/engineering-discipline/reviews/review.md")).toBe(false);
    expect(isSourceCodePath("src/feature.test.ts")).toBe(false);
    expect(isSourceCodePath("tests/feature.ts")).toBe(false);
    expect(isSourceCodePath("package-lock.json")).toBe(false);
    expect(isSourceCodePath("vitest.config.ts")).toBe(false);
  });

  it("returns no changed source files when the worker makes no changes", async () => {
    const before = await captureSlopScopeSnapshot(repo);

    await expect(getChangedSourceFilesForSlopCleaner(repo, before)).resolves.toEqual([]);
  });

  it("ignores docs-only worker changes", async () => {
    const before = await captureSlopScopeSnapshot(repo);
    await mkdir(join(repo, "docs", "engineering-discipline", "reviews"), { recursive: true });
    await writeFile(
      join(repo, "docs", "engineering-discipline", "reviews", "review.md"),
      "# Review\n\nPASS\n",
      "utf-8",
    );

    await expect(getChangedSourceFilesForSlopCleaner(repo, before)).resolves.toEqual([]);
  });

  it("detects uncommitted source files created by the worker", async () => {
    const before = await captureSlopScopeSnapshot(repo);
    await writeFile(join(repo, "src", "feature.ts"), "export const feature = 1;\n", "utf-8");

    await expect(getChangedSourceFilesForSlopCleaner(repo, before)).resolves.toEqual(["src/feature.ts"]);
  });

  it("detects source files committed by the worker", async () => {
    const before = await captureSlopScopeSnapshot(repo);
    await writeFile(join(repo, "src", "committed.ts"), "export const committed = 1;\n", "utf-8");
    await git(["add", "src/committed.ts"], repo);
    await git(["commit", "-m", "worker change"], repo);

    await expect(getChangedSourceFilesForSlopCleaner(repo, before)).resolves.toEqual(["src/committed.ts"]);
  });

  it("includes a pre-dirty source file when the worker changes that same file", async () => {
    await writeFile(join(repo, "src", "existing.ts"), "export const existing = 2;\n", "utf-8");
    const before = await captureSlopScopeSnapshot(repo);

    await writeFile(join(repo, "src", "existing.ts"), "export const existing = 3;\n", "utf-8");

    await expect(getChangedSourceFilesForSlopCleaner(repo, before)).resolves.toEqual(["src/existing.ts"]);
  });
});
