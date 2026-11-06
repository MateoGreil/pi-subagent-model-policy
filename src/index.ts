import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const ANTHROPIC_SUBAGENT_MODEL = "anthropic/claude-haiku-4-5";

interface AgentToolInput {
	model?: string;
	[key: string]: unknown;
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", (event, ctx) => {
		if (event.toolName !== "Agent") return;
		const parent = ctx.model;
		const provider = parent?.provider;
		const input = event.input as AgentToolInput | undefined;
		if (!input || input.model) return;

		if (provider === "anthropic") {
			input.model = ANTHROPIC_SUBAGENT_MODEL;
		} else if (parent?.id) {
			input.model = `${parent.provider}/${parent.id}`;
		}
	});
}