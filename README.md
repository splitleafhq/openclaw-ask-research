# openclaw-ask-research

An [OpenClaw](https://docs.openclaw.ai) plugin (id `ask-research`) that gives an agent one tool, `ask_research(question)`. The tool runs the research agent on that one question and returns its answer verbatim. It is for an agent that cannot use `sessions_send` but needs a researched answer.

**Status:** experimental, private. Built against OpenClaw 2026.10.8. What has and hasn't been checked on a live gateway is in [docs/verification.md](docs/verification.md).

## Get started

```sh
npm ci --ignore-scripts
scripts/check
```

Install into a gateway from a checkout, then allow the tool for the agent that should have it:

```sh
openclaw plugins install --link <path-to-checkout> --accept-capabilities
openclaw plugins enable ask-research
openclaw plugins inspect ask-research --runtime --json
```

## Config

At `plugins.entries.ask-research.config`; both keys are optional.

| Key | Default | Meaning |
| --- | --- | --- |
| `agentId` | `research` | Id of the agent that answers |
| `timeoutMs` | `600000` | How long to wait for the answer |

An invalid value falls back to its default.

## Docs

- [docs/how-it-works.md](docs/how-it-works.md): the run, the answer, failures, config.
- [docs/verification.md](docs/verification.md): what is tested, what is not yet checked on a live gateway, known gaps.
- [docs/CHANGELOG.md](docs/CHANGELOG.md): changes.

## License

All rights reserved; see [LICENSE](LICENSE).
