import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import entry from '../src/index.ts';

interface Tool {
  name: string;
  parameters: unknown;
  execute(id: string, params: unknown): Promise<{ content: { type: string; text: string }[] }>;
}

/** Registers the plugin against a minimal host and returns the tool it registered. */
function load(pluginConfig: Record<string, unknown> | undefined, answer: string) {
  const runs: { sessionKey: string; message: string }[] = [];
  const tools: { tool: Tool; options: unknown }[] = [];
  const api = {
    pluginConfig,
    runtime: {
      subagent: {
        async run(params: { sessionKey: string; message: string }) {
          runs.push(params);
          return { runId: 'run-1' };
        },
        async waitForRun() {
          return { status: 'ok' };
        },
        async getSessionMessages() {
          return { messages: [{ role: 'assistant', content: answer }] };
        },
      },
    },
    registerTool(factory: () => Tool, options: unknown) {
      tools.push({ tool: factory(), options });
    },
  };
  // @ts-expect-error The host's full API is far larger than this minimal stand-in.
  entry.register(api);
  return { runs, tools };
}

test('registers one ask_research tool whose manifest contract matches', async () => {
  const { tools } = load(undefined, 'a');
  assert.equal(tools.length, 1);
  assert.equal(tools[0]?.tool.name, 'ask_research');
  assert.deepEqual(tools[0]?.options, { name: 'ask_research' });
  const manifest = JSON.parse(await readFile(new URL('../openclaw.plugin.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.contracts.tools, ['ask_research']);
  assert.equal(manifest.id, entry.id);
});

test('the tool returns the answer as text content and sends the question unchanged to the configured agent', async () => {
  const { runs, tools } = load({ agentId: 'scholar' }, 'The answer.');
  const result = await tools[0]?.tool.execute('call-1', { question: 'What is sparse attention?' });
  assert.deepEqual(result?.content, [{ type: 'text', text: 'The answer.' }]);
  assert.equal(runs[0]?.message, 'What is sparse attention?');
  assert.match(runs[0]?.sessionKey ?? '', /^agent:scholar:subagent:ask-/);
});

test('a missing or blank question asks for one and starts no run', async () => {
  const { runs, tools } = load(undefined, 'unused');
  for (const params of [{}, { question: '  ' }, { question: 3 }, null]) {
    const result = await tools[0]?.tool.execute('call-1', params);
    assert.equal(result?.content[0]?.text, 'ask_research needs a non-empty question');
  }
  assert.equal(runs.length, 0);
});
