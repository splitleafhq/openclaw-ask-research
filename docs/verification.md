# Verification

## Checked

- **Unit tests** (`npm test`, coverage floor 90 percent) cover:
  - the answer as the last assistant text, verbatim, with text parts joined and non-text parts dropped, and an assistant message without text skipped;
  - a run whose status is not `ok`, returned as a failure line with its status and error;
  - an empty answer: an empty transcript, no assistant message, blank text;
  - a run slower than the configured timeout, and one that fits, including the 600000 ms default;
  - the target agent: the default `research`, a configured id in the session key and in failure lines;
  - invalid `agentId` and `timeoutMs` falling back to their defaults;
  - the registered tool: one `ask_research` tool matching the manifest contract and id, text content, the question passed on unchanged, a blank question refused without a run.
- **Typecheck** against the OpenClaw 2026.10.8 plugin SDK.
- **Spike** (`ask-research`, the plain JavaScript version this plugin was ported from), in an isolated profile on OpenClaw 2026.10.8: a sub-agent without `sessions_send` called `ask_research`, the research agent answered, and it kept its web tools.

## Not yet checked on a live gateway

- This TypeScript build, loaded from `dist/`: `plugins inspect ask-research --runtime --json` reporting `status: loaded` and the tool, and a git install with `dist/` committed (handoff-guard's equivalent check is in its own verification notes).
- The tests use a fake `subagent` runtime. The real `getSessionMessages` message shape (a string or a list of parts with `type: "text"`) is assumed from the spike and the SDK type `unknown[]`, not documented.
- The `limit: 20` window: a long answer run with many tool calls might leave the last text message outside it.
- `waitForRun` with the `timeoutMs` set: that a run still going when it elapses reports `timeout` and keeps running is not checked live; docs/plugins/sdk-runtime/background-work.md says the timeout bounds the wait, so the answer says the run may still be going.
- Sessions are left behind: one `agent:<agentId>:subagent:ask-<uuid>` session per call is never deleted, and what the host does with them is not checked.
- Config validation: from the OpenClaw 2026.10.8 plugin loader source, the host rejects config that breaks the manifest schema before registering the plugin; not seen in a running gateway.
- Other versions: nothing below 2026.10.8 was tried; `peerDependencies` and `compat` say `>=2026.10.8`.
- Failure texts as the calling agent sees them.

## Known open issue

`handoff-guard` (the sibling plugin that blocks secrets and personal data in text sent between agents) inspects only `sessions_send` and `sessions_spawn` (`AGENT_TEXT_TOOLS` in its `src/rules.ts`). Text sent through `ask_research` goes to another agent and is not checked by it. This plugin does not fix that.
