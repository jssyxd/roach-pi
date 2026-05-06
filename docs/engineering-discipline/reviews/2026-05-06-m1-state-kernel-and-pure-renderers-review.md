# M1 State Kernel and Pure Renderers Review

**Date:** 2026-05-06 19:04
**Plan Document:** `docs/engineering-discipline/plans/2026-05-06-m1-state-kernel-and-pure-renderers.md`
**Verdict:** FAIL

---

## 1. File Inspection Against Plan

| Planned File | Status | Notes |
|---|---|---|
| `extensions/agentic-harness/harness-state.ts` | OK | Exists. Exports schema version, state/status/entity types, command/result/event types, state factory, reducer, and selectors. Reducer behavior aligns with the specified milestone/plan/todo operations and clear missing-id errors. |
| `extensions/agentic-harness/harness-render.ts` | OK | Exists. Exports pure markdown renderers for state, plan, and todos. Output is deterministic from `HarnessState` and ends with one trailing newline in covered cases. Unknown plan ids throw a clear error. |
| `extensions/agentic-harness/tests/harness-state.test.ts` | OK | Exists. Covers initialization, reducer actions, idempotent milestone upsert, status preservation, missing-id errors, immutability, selector sorting/counting/active selection, and todo filtering. |
| `extensions/agentic-harness/tests/harness-render.test.ts` | OK | Exists. Covers state/plan/todo markdown output, unknown plan error, single trailing newline, and absence of markdown parser tokens. |
| `extensions/agentic-harness/package.json` | OK | Modified only for the allowed test temp-directory hardening. |

### Acceptance Criteria Check

| Plan Area | Result | Notes |
|---|---|---|
| Canonical state model and reducer | PASS | Required constants/types, state factory, command union, reducer result/event shape, immutable updates, event sequence increment, timestamp updates, upsert/replace/update/clear behavior, and missing-id errors are present. |
| Reducer tests | PASS | Required task 1 and task 2 state tests are present and passed. |
| Selectors | PASS | Required selector exports and tests are present. |
| Pure markdown renderers | PASS | Required renderer exports and tests are present. Renderers do not import parser modules. |
| M1 scope isolation | FAIL | Current working tree contains modified runtime/workflow files outside the expected M1 file list. |

## 2. Test Results

| Test Command | Result | Notes |
|---|---|---|
| `cd extensions/agentic-harness && mkdir -p node_modules/.tmp && TMPDIR=$PWD/node_modules/.tmp npm exec -- vitest run tests/harness-state.test.ts` | PASS | 1 file passed, 15 tests passed. |
| `cd extensions/agentic-harness && mkdir -p node_modules/.tmp && TMPDIR=$PWD/node_modules/.tmp npm exec -- vitest run tests/harness-render.test.ts` | PASS | 1 file passed, 5 tests passed. |
| `cd extensions/agentic-harness && mkdir -p node_modules/.tmp && TMPDIR=$PWD/node_modules/.tmp npm exec -- vitest run tests/harness-state.test.ts tests/harness-render.test.ts` | PASS | 2 files passed, 20 tests passed. |
| `cd extensions/agentic-harness && npm run build && npm test` | PASS | Build passed. Full agentic-harness suite passed: 50 files, 601 tests. |

**Full Test Suite:** PASS (601 passed, 0 failed)

## 3. Code Quality

- [x] No placeholders in planned files
- [x] No debug code in planned files
- [x] No commented-out code blocks in planned files
- [ ] No changes outside plan scope

**Findings:**
- Scope isolation failure: `git status --short` shows modified files outside the plan's expected M1 list: `extensions/agentic-harness/index.ts`, `extensions/agentic-harness/plan-progress-events.ts`, `extensions/agentic-harness/skills/agentic-run-plan/SKILL.md`, `extensions/agentic-harness/tests/extension.test.ts`, and `extensions/agentic-harness/tests/plan-progress-events.test.ts`.
- Runtime/workflow changes are present outside M1's stated scope. Examples include subagent schema/runtime changes in `extensions/agentic-harness/index.ts:331`, fallback plan loading changes in `extensions/agentic-harness/plan-progress-events.ts:37`, and skill workflow documentation changes in `extensions/agentic-harness/skills/agentic-run-plan/SKILL.md:88`.
- Additional untracked documentation artifacts are present outside the expected M1 changed-file list: `docs/engineering-discipline/context/2026-05-06-structured-harness-state-tools-brief.md` and `docs/engineering-discipline/harness/structured-harness-state-tools-2026-05-06/`.

## 4. Git History

| Planned Commit | Actual Commit | Match |
|---|---|---|
| No commits; plan explicitly says do not create git commits. | Recent `git log` shows no new M1 commit; implementation files are uncommitted. | OK |

## 5. Overall Assessment

The M1 state kernel and pure renderer files exist, align with the plan's functional requirements, and all specified tests plus the full agentic-harness suite pass. However, the plan's final verification requires scope isolation and explicitly expects no runtime wiring, storage, tool registration, footer, skill, or parser-path changes in this milestone. The current working tree contains modified runtime/workflow/test files outside the expected M1 file set, including `index.ts`, `plan-progress-events.ts`, and `agentic-run-plan/SKILL.md`. Because scope isolation is a stated M1 acceptance criterion, the overall verdict is FAIL.

## 6. Follow-up Actions

- Revert or separate the out-of-scope runtime/workflow/documentation changes from this M1 worktree.
- Re-run the targeted harness-state/harness-render tests and `cd extensions/agentic-harness && npm run build && npm test` after scope cleanup.
