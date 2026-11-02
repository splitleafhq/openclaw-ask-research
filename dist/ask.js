import { randomUUID } from 'node:crypto';
export const PLUGIN_ID = 'ask-research';
export const TOOL_NAME = 'ask_research';
export const DEFAULT_AGENT_ID = 'research';
export const DEFAULT_TIMEOUT_MS = 600_000;
const AGENT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
/** Reads `plugins.entries.ask-research.config`; a missing or invalid value falls back to its default. */
export function readConfig(raw) {
    const source = typeof raw === 'object' && raw !== null ? raw : {};
    const agentId = 'agentId' in source ? source.agentId : undefined;
    const timeoutMs = 'timeoutMs' in source ? source.timeoutMs : undefined;
    return {
        agentId: typeof agentId === 'string' && AGENT_ID.test(agentId) ? agentId : DEFAULT_AGENT_ID,
        timeoutMs: typeof timeoutMs === 'number' && Number.isInteger(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
    };
}
function messageText(content) {
    if (typeof content === 'string') {
        return content;
    }
    if (!Array.isArray(content)) {
        return '';
    }
    return content
        .flatMap((part) => (typeof part === 'object' && part !== null && 'type' in part && part.type === 'text' && 'text' in part && typeof part.text === 'string' ? [part.text] : []))
        .join('\n');
}
/** The text of the last assistant message that has any, or an empty string. */
export function lastAssistantText(messages) {
    for (const message of messages.toReversed()) {
        if (typeof message !== 'object' || message === null || !('role' in message) || message.role !== 'assistant') {
            continue;
        }
        const text = messageText('content' in message ? message.content : undefined);
        if (text.trim()) {
            return text;
        }
    }
    return '';
}
/** Runs the target agent on one question in a fresh session and returns its last assistant text verbatim, or a failure line. */
export async function askResearch(subagent, config, question) {
    const sessionKey = `agent:${config.agentId}:subagent:ask-${randomUUID()}`;
    const { runId } = await subagent.run({ sessionKey, message: question, deliver: false });
    const result = await subagent.waitForRun({ runId, timeoutMs: config.timeoutMs });
    if (result.status !== 'ok') {
        return `${config.agentId} did not finish: ${result.status}${result.error ? ` ${result.error}` : ''}`;
    }
    const { messages } = await subagent.getSessionMessages({ sessionKey, limit: 20 });
    return lastAssistantText(messages) || `${config.agentId} returned no text`;
}
