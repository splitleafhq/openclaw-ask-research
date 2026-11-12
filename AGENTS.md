# AGENTS.md

Rules for working in this repo. Git and pull request flow follows the shared [CONTRIBUTING.md](https://github.com/splitleafhq/.github/blob/main/CONTRIBUTING.md); this file states only what differs.

Install `npm ci --ignore-scripts`. Before a pull request run `scripts/check` (lint, typecheck, test, build and a current `dist/`, as CI does); `git config core.hooksPath .githooks` once per clone runs it on every push. Source is `src/`, tests `test/`, the committed build `dist/`, details `docs/`.

1. Give an agent one tool, `ask_research`: one self-contained question to one target agent, its last assistant text back verbatim. No other tools, hooks, retries or answer rewriting.
2. Hard-code no setup detail: the target agent id (`agentId`, default `research`) and the wait (`timeoutMs`, default 600000) come from config.
3. Keep everything setup-agnostic: no agent names, hostnames, paths, chat ids or job names from any real setup, in code, tests, docs, commits, issues or pull requests.
4. Build fixtures from synthetic values: reserved domains (RFC 2606) and made-up ids.
5. Ship a fix with a test you have watched fail without it.
6. Before writing or changing a test, read https://github.com/splitleafhq/.github/blob/main/docs/testing.md.
7. Cite the OpenClaw version, and a docs page or source file, for any claim about OpenClaw behaviour, and label anything not yet checked on a live gateway as unverified in `docs/verification.md`.
8. Pin every tool, action and dependency to an exact version or commit.
9. Commit `dist/` after `npm run build`: OpenClaw installs run npm without scripts, so it is what runs. CI fails when it is stale.
10. A comment states a constraint the code can't show, never what the next line does.
11. Write terse, factual prose.
12. Commit, push and open pull requests on the user's behalf; merging, tagging and releasing each need their own approval. Cut no release or tag without it.
13. Keep agent-session links and session trailers out of commit messages, issues and pull request bodies.
