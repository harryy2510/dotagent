# The DotAgent pack

This is the canonical source for DotAgent’s shared rules and 16 engineering
skills. [AgentSync](https://github.com/spxrogers/agentsync) renders it into your
selected coding agents’ native configuration, at user or project scope.

```sh
curl -fsSL https://dotagent.dev/install | sh
curl -fsSL https://dotagent.dev/install | sh -s -- --project
```

The guided installer handles dependency setup, agent selection, pack installation,
and a preview before apply. AgentSync’s own commands initialize configuration and
register agents; the installer does not hand-edit your TOML.

Existing pack files are preserved unless you select replacement with `--force`,
which backs them up first. Canonical `mcp/`, `hooks/`, and `memory/AGENTS.md`
content stays untouched. Applying can update the native files owned by AgentSync,
so review its preview before approving.

See the [main README](../README.md) for options, update instructions, and credits.
