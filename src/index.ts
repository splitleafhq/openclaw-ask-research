import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';
import { PLUGIN_ID, TOOL_NAME, askResearch, readConfig } from './ask.ts';

export default definePluginEntry({
  id: PLUGIN_ID,
  name: 'Ask Research',
  description: 'Gives an agent one tool, ask_research, to put a single question to the research agent.',
  register(api) {
    const config = readConfig(api.pluginConfig);
    api.registerTool(
      () => ({
        name: TOOL_NAME,
        label: 'Ask research',
        description: 'Ask the research agent one self-contained question and get its answer verbatim.',
        parameters: {
          type: 'object',
          properties: { question: { type: 'string', description: 'One self-contained question; the research agent sees nothing else.' } },
          required: ['question'],
          additionalProperties: false,
        },
        async execute(_id: string, params: unknown) {
          const question = typeof params === 'object' && params !== null && 'question' in params ? params.question : undefined;
          const text =
            typeof question === 'string' && question.trim()
              ? await askResearch(api.runtime.subagent, config, question)
              : 'ask_research needs a non-empty question';
          return { content: [{ type: 'text', text }], details: {} };
        },
      }),
      { name: TOOL_NAME },
    );
  },
});
