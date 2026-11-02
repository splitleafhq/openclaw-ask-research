# How it works

Checked against OpenClaw 2026.10.8.

## The tool

The plugin registers one tool, `ask_research`, with one required string parameter, `question`, through `api.registerTool` (`plugins/building-plugins.md`; the tool is also listed in `contracts.tools` of `openclaw.plugin.json`, which that page requires for runtime tools). Whether an agent may call it is that agent's tool policy, not this plugin's.

## One call

| Step | Call (`plugins/sdk-runtime/background-work.md`, `api.runtime.subagent`) | Detail |
| --- | --- | --- |
| 1 | `run({ sessionKey, message: question, deliver: false })` | a fresh session `agent:<agentId>:subagent:ask-<uuid>`; the target sees only the question |
| 2 | `waitForRun({ runId, timeoutMs })` | `status` is `ok`, `timeout`, `error` or `pending` (`AgentWaitResult` in the SDK types) |
| 3 | `getSessionMessages({ sessionKey, limit: 20 })` | the last assistant message with non-blank text is the answer |

The answer is returned as text content, unchanged. A message's `content` is a string, or a list of parts of which the `text` parts are joined with a newline; other parts are dropped.

## Failures

The tool returns a line of text and does not throw for these:

| Case | Text |
| --- | --- |
| `status` is not `ok` | `<agentId> did not finish: <status>` and the run's `error`, when there is one |
| no assistant text in the last 20 messages | `<agentId> returned no text` |
| `question` is missing, not a string or blank | `ask_research needs a non-empty question`; no run starts |

An error thrown by `run`, `waitForRun` or `getSessionMessages` is not caught; the host handles a tool that throws.

## Config

`plugins.entries.ask-research.config`, read once at registration.

| Key | Default | Rule |
| --- | --- | --- |
| `agentId` | `research` | letters, digits, `_` and `-`, starting with a letter or digit; anything else falls back |
| `timeoutMs` | `600000` | a positive integer; anything else falls back |

The manifest schema states the same limits. Whether the host rejects a config that breaks them or passes it through (and so reaches the fallback) is unverified, see [verification.md](verification.md).

## Not done

The session each call creates is not deleted (`deleteSession` exists, `plugins/sdk-runtime/background-work.md`). The behaviour matches the spike this plugin was ported from; see [verification.md](verification.md).
