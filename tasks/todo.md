# Docs: progress tracker improvement note

- [x] Locate README / changelog docs for agentic-harness
- [x] Add concise note about structured progress tracker improvements
- [x] Verify wording and file diff

## Review

Updated:
- `CHANGELOG.md` — added Unreleased improvement note for structured progress tracking, live task transitions, session replay, and serialized same-run mutations.
- `README.md` — updated Highlights progress tracker bullet.
- `extensions/agentic-harness/README.md` — added feature bullet for structured progress tracking.

Verification:
- Reviewed `git diff` for the three docs files.
- Grep confirmed the new wording appears in each target file.

---

# Current: Commit and Push to main

- [x] Confirm repository, branch, remote, and working tree
- [x] Run verification before commit
- [x] Commit all requested changes
- [x] Integrate commit onto `main`
- [x] Push `main` to remote
- [x] Verify remote status and summarize

## Review

Completed.
- Repository: `/Users/roach/.pi/agent/git/github.com/tmdgusya/pi-engineering-discipline-extension`
- Remote: `origin https://github.com/tmdgusya/roach-pi.git`
- Verification: `cd extensions/agentic-harness && npm run build && npm test` — PASS, 59 files / 682 tests
- Commit: `290a420 feat: add structured harness state tools`
- Integration: fast-forwarded local `main` from `edd10fe` to `290a420`
- Push: `origin/main` updated to `290a420`

