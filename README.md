# pi-subagent-model-policy

A Pi extension filling in a missing `model` argument on calls to the tool named exactly `Agent`.

## Install

Remove the old local `~/.pi/agent/extensions/subagent-model-policy.ts` and any explicit configuration pointing to it **before installing**, to avoid duplicate handlers. If using a different agent directory, remove the copy there instead.

Once the repository and `v0.1.0` tag are available:

```sh
pi install git:github.com/MateoGreil/pi-subagent-model-policy@v0.1.0
```

## Policy and limitations

- Preserves any truthy explicit `input.model`.
- When the parent provider is exactly `anthropic`, defaults to `anthropic/claude-haiku-4-5`.
- For other providers with a parent model ID, defaults to the parent's `provider/id`.
- Leaves calls unchanged when the input or parent model is unavailable. An empty model string is treated as missing.
- Mutates tool input in place and preserves other arguments. Other tools, including `SubagentWorkflow`, are ignored.
- Does not provide the `Agent` tool, validate model availability, configure authentication, or guarantee cost savings. The tool must accept a `model` string in this format; otherwise the policy has no useful effect.

Tested for Pi **1.5.0** using offline API fakes. Pi apps, other Pi versions, and third-party `Agent` implementations are not certified; no live-provider integration is tested.

## Tests

Requires Node.js **>=22.22.0**. Run `npm test`; no package installation is needed for these tests. `node:test` uses fake tool-call events and model contexts, without launching subagents, network calls, or credentials. Only `src/index.ts` is loaded by the Pi manifest.

## License

No license has been selected (`UNLICENSED`). This public Git package is marked `private: true` to prevent accidental npm publication.
