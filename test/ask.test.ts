import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  DEFAULT_AGENT_ID,
  DEFAULT_TIMEOUT_MS,
  type SubagentRuntime,
  askResearch,
  lastAssistantText,
  readConfig,
} from '../src/ask.ts';

interface Fake {
  runtime: SubagentRuntime;
  /** Agent ids that received a run. */
  agents: string[];
}

/** A research agent that takes `durationMs` and then leaves `transcript` in the session it was given. */
function fakeAgent(options: { transcript?: unknown[]; durationMs?: number; failure?: string }): Fake {
  const sessions = new Map<string, string>();
  const agents: string[] = [];
  const runtime: SubagentRuntime = {
    async run({ sessionKey }) {
      agents.push(sessionKey.split(':')[1] ?? '');
      const runId = `run-${sessions.size + 1}`;
      sessions.set(runId, sessionKey);
      return { runId };
    },
    async waitForRun({ timeoutMs }) {
      if (options.failure) {
        return { status: 'error', error: options.failure };
      }
      return (options.durationMs ?? 0) > timeoutMs ? { status: 'timeout' } : { status: 'ok' };
    },
    async getSessionMessages() {
      return { messages: options.transcript ?? [] };
    },
  };
  return { runtime, agents };
}

const config = readConfig(undefined);
const reply = 'Sparse attention:\n\n- one\n- two  \n';

test('the answer is the last assistant text, verbatim', async () => {
  const { runtime } = fakeAgent({
    transcript: [
      { role: 'user', content: 'a question' },
      { role: 'assistant', content: 'earlier note' },
      { role: 'assistant', content: [{ type: 'text', text: reply }] },
      { role: 'tool', content: 'ignored' },
    ],
  });
  assert.equal(await askResearch(runtime, config, 'a question'), reply);
});

test('text parts of the last assistant message are joined, and non-text parts are dropped', () => {
  const content = [
    { type: 'text', text: 'first' },
    { type: 'toolCall', name: 'web_search' },
    { type: 'text', text: 'second' },
  ];
  assert.equal(lastAssistantText([{ role: 'assistant', content }]), 'first\nsecond');
});

test('an assistant message with no text is skipped for the one before it', () => {
  const messages = [
    { role: 'assistant', content: 'the answer' },
    { role: 'assistant', content: [{ type: 'toolCall', name: 'web_search' }] },
    { role: 'assistant', content: '   ' },
  ];
  assert.equal(lastAssistantText(messages), 'the answer');
});

test('a run that is not ok returns a failure line with its status and error', async () => {
  const { runtime } = fakeAgent({ failure: 'model unavailable' });
  assert.equal(await askResearch(runtime, config, 'q'), 'research did not finish: error model unavailable');
});

test('no assistant text returns a clear line instead of an empty answer', async () => {
  for (const transcript of [[], [{ role: 'user', content: 'q' }], [{ role: 'assistant', content: '' }], [null, 'text', { role: 'assistant' }]]) {
    const { runtime } = fakeAgent({ transcript });
    assert.equal(await askResearch(runtime, config, 'q'), 'research returned no text');
  }
});

test('a run slower than the configured timeout reports the timeout, and a longer timeout waits for it', async () => {
  const slow = fakeAgent({ transcript: [{ role: 'assistant', content: reply }], durationMs: 5000 });
  assert.equal(await askResearch(slow.runtime, readConfig({ timeoutMs: 1000 }), 'q'), 'research did not finish: timeout');
  assert.equal(await askResearch(slow.runtime, readConfig({ timeoutMs: 6000 }), 'q'), reply);
});

test('the default timeout is 600000 ms', async () => {
  assert.equal(DEFAULT_TIMEOUT_MS, 600_000);
  const slow = fakeAgent({ transcript: [{ role: 'assistant', content: reply }], durationMs: 600_001 });
  assert.equal(await askResearch(slow.runtime, config, 'q'), 'research did not finish: timeout');
  const fits = fakeAgent({ transcript: [{ role: 'assistant', content: reply }], durationMs: 600_000 });
  assert.equal(await askResearch(fits.runtime, config, 'q'), reply);
});

test('the question goes to the default agent, or to the configured one, which names itself in failures', async () => {
  const fallback = fakeAgent({ transcript: [{ role: 'assistant', content: reply }] });
  await askResearch(fallback.runtime, config, 'q');
  assert.deepEqual(fallback.agents, [DEFAULT_AGENT_ID]);

  const other = fakeAgent({ failure: 'boom' });
  const text = await askResearch(other.runtime, readConfig({ agentId: 'scholar' }), 'q');
  assert.deepEqual(other.agents, ['scholar']);
  assert.equal(text, 'scholar did not finish: error boom');
});

test('an invalid agent id or timeout falls back to its default, and a valid one is kept', () => {
  const defaults = { agentId: 'research', timeoutMs: 600_000 };
  assert.deepEqual(readConfig(undefined), defaults);
  assert.deepEqual(readConfig('text'), defaults);
  assert.deepEqual(readConfig({ agentId: '', timeoutMs: 0 }), defaults);
  assert.deepEqual(readConfig({ agentId: 'a:b', timeoutMs: 1.5 }), defaults);
  assert.deepEqual(readConfig({ agentId: 7, timeoutMs: '10' }), defaults);
  assert.deepEqual(readConfig({ agentId: 'scholar-2', timeoutMs: 90_000 }), { agentId: 'scholar-2', timeoutMs: 90_000 });
});
