# Glyph

**An AI coding agent for your terminal.**

Glyph works alongside you in your codebase: read and search files, plan changes, edit code, run commands, and verify results. Use the interactive terminal UI for ongoing work, a single prompt for a focused task, or structured output for scripts and CI.

Glyph is a terminal-focused fork of [Cline](https://github.com/cline/cline), built on its CLI and agent runtime. Cline's contributors created the foundation this project builds on, and deserve full credit for that work.

## What Glyph Offers

- **Interactive terminal UI:** streaming responses, Markdown, highlighted diffs, scrollable conversations, file mentions, and a command palette.
- **Plan and Act:** explore an approach before execution, then switch modes without leaving the conversation.
- **Provider and model choice:** sign in to supported services, bring API credentials, or configure a local or OpenAI-compatible endpoint.
- **Reasoning controls:** choose model-supported effort levels in the UI or from the command line.
- **Session continuity:** resume history, fork conversations, compact context, and restore workspace checkpoints.
- **Project-aware instructions:** rules, skills, workflows, plugins, and MCP tools.
- **Parallel and background work:** subagents, teams, detached Git worktrees, scheduled tasks, and hub-backed background sessions.
- **Automation:** one-shot prompts, piped input, newline-delimited JSON output, and chat connectors.

## Get Started

### Run From Source

Use **Bun 1.4.2** and **Node.js 22 or newer**. From the root of this checkout:

```sh
bun install
bun run build:sdk
bun run cli
```

The shared runtime packages must be built before running the CLI. After changing their source, rebuild with `bun run build:sdk` and restart the CLI.

To run a task directly:

```sh
bun run cli -i "Help me understand this repository"
bun run cli "Run the tests and explain any failures"
```

To make the source checkout available as `glyph`, run this from `apps/cli` after the initial setup:

```sh
bun link
```

The remaining examples assume `glyph` is on your PATH. Without linking or installing a build, use `bun run cli` from the repository root instead.

### Windows Installer

Build the per-user installer on Windows from the repository root:

```powershell
bun run --cwd apps/cli build:installer:windows
```

The repository shortcut `.\build-cli.ps1` runs the same build command. Installer output goes to `apps/cli/dist/installers/`.

The installer defaults to `%USERPROFILE%\cline`, adds its `bin` directory to your user PATH, and does not require administrator access. Reopen your terminal application after installation. Before upgrading or uninstalling, close running Glyph sessions and stop the hub with `glyph hub stop`.

### Native Builds

Build for the current platform, or build all supported targets:

```sh
bun run --cwd apps/cli build:platforms:single
bun run --cwd apps/cli build:platforms
```

Build targets cover **Windows, macOS, and Linux**, on **x64 and arm64**. Generated platform artifacts live under `apps/cli/dist/`; internal binary names still use `cline` or `cline.exe`.

**Distribution note:** this fork has not migrated to a Glyph registry package. Installing upstream `cline` does not install this Glyph checkout, and `bun add --global glyph` is not a documented installation path. Build or link this repository to use Glyph. The current updater still targets upstream Cline packages; rebuild this fork rather than using `glyph update` to preserve it.

## Connect a Provider

An agent task requires a configured provider with valid credentials, or an accessible local endpoint. Open the interactive setup:

```sh
glyph auth
```

Supported sign-in flows include Cline, ChatGPT Subscription (`openai-codex`), and OCA. For example:

```sh
glyph auth cline
glyph auth openai-codex
```

API-key providers include Anthropic, OpenAI, Google Gemini, OpenRouter, Groq, Cerebras, and others. Bedrock and Vertex use their provider-specific credential configuration. For explicit setup, replace the placeholders:

```sh
glyph auth --provider anthropic --apikey <api-key> --modelid <model-id>
glyph auth --provider openai-compatible --apikey <api-key> --modelid <model-id> --baseurl http://localhost:8000/v1
```

Common credential environment variables retain their upstream names, including `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, and `CLINE_API_KEY`. Avoid putting real credentials into shared scripts or shell history.

Use `/model` in an interactive session to switch models or configure providers. OpenAI-compatible setup lets you choose **Chat Completions** or **Responses**; select the API your endpoint actually supports. Local endpoints can be configured through the interactive setup without an API key when their server does not require one.

Authenticate before launching unattended jobs. Headless runs fail if the selected provider needs credentials that have not been configured.

## Everyday Usage

```sh
# Open an interactive session
glyph

# Start an interactive conversation with a prompt
glyph -i "Plan a refactor of the authentication module"

# Run a single task and exit
glyph "Run the tests and fix any failures"

# Start in Plan mode
glyph --plan "Propose an implementation for this feature"

# Require tool approval
glyph --auto-approve false -i "Review and improve this module"

# Review piped input
git diff | glyph "Review these changes for bugs"

# Stream newline-delimited JSON events
glyph --json "Summarize this repository"

# Resume an existing session
glyph --id <session-id>

# Work in a separate Git worktree
glyph --worktree "Implement this feature with tests"

# Send a task to the background hub
glyph --zen "Investigate the failing integration tests"
```

**Approval defaults:** Glyph starts in Act mode with tool auto-approval enabled unless your saved settings or flags override it. Use `--auto-approve false` when you want to review tool actions. Worktrees start from committed `HEAD`, not your uncommitted changes. An isolated `--data-dir` separates application state; it is not a filesystem security sandbox.

The CLI automatically starts its background hub when needed. You do not need to launch it separately.

```sh
glyph history
glyph hub status
glyph hub stop
glyph doctor
glyph --help
```

## Reasoning Effort

Use `/reasoning`, the command palette, or **Alt+E / Option+E** to change the current model's reasoning effort. The picker shows advertised model controls and offers manual choices for custom models.

```sh
glyph --reasoning-effort high "Review this change carefully"
glyph -i --thinking low
```

`--thinking` and `--reasoning-effort` are aliases. Accepted CLI levels are `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, and `max`; support depends on the model and endpoint.

Interactive choices persist without discarding the conversation. **Provider default** clears the saved override; **Off** disables reasoning where supported. When no flag is supplied, Glyph uses saved settings, then the provider default. For OpenAI-compatible endpoints, effort is sent as `reasoning_effort` with Chat Completions or `reasoning.effort` with Responses.

## Terminal Controls

| Shortcut | Action |
| --- | --- |
| `Enter` | Send a prompt, or queue it while the agent is running |
| `Shift+Enter` | Insert a newline |
| `Ctrl+S` | Steer the running agent with your input |
| `Tab` | Toggle Plan / Act |
| `Shift+Tab` | Toggle tool auto-approval |
| `Ctrl+P` | Open the command palette when idle |
| `Alt+M` / `Option+M` | Open the model picker |
| `Alt+E` / `Option+E` | Open reasoning controls |
| `Escape` | Close a dialog or abort the current run |
| `Page Up` / `Page Down` | Scroll the conversation |
| `Ctrl+C` | Clear nonempty input; otherwise exit |
| `Ctrl+D` | Exit when idle with empty input |

Modifier-key support varies by terminal. Slash commands provide an alternative:

| Command | Purpose |
| --- | --- |
| `/model`, `/reasoning` | Model and reasoning selection |
| `/settings`, `/theme`, `/account` | Preferences, appearance, and account |
| `/mcp`, `/plugins`, `/skills` | Tools and extensions |
| `/history`, `/fork` | Session history and conversation branching |
| `/compact` | Reduce conversation context |
| `/undo` | Restore a workspace checkpoint |
| `/clear` | Start a new session |
| `/team` | Team controls |
| `/help`, `/quit` | Help and exit |

## Customize and Extend

Glyph retains Cline's configuration paths for compatibility. The default configuration home is `~/.cline`, with application data under `~/.cline/data`. Use `--config <directory>` to change the configuration home, or `--data-dir <directory>` for isolated local state.

Project instructions can live in `AGENTS.md` or `.cline/rules/`; legacy `.clinerules` discovery is retained. Skills can live in `.cline/skills/` or `.agents/skills/`. Workflows, plugins, and hooks use `.cline/workflows/`, `.cline/plugins/`, and `.cline/hooks/`.

```sh
glyph config rules
glyph config skills
glyph config workflows
glyph config tools
glyph mcp
glyph plugin --help
```

MCP connects the agent to additional tools and services. Manage servers in the interactive `glyph mcp` flow or with its subcommands. Plugins provide additional tools and lifecycle behavior.

Schedules support recurring tasks, and connectors bridge messaging threads into agent sessions. Available connector adapters include Discord, Slack, Telegram, Google Chat, WhatsApp, and Linear.

```sh
glyph schedule --help
glyph schedule list
glyph connect --help
glyph connect telegram --help
```

## Changes From Cline

Glyph's development baseline is commit [`de0f74cafc7f509467f65f57dc6d784b26004db9`](https://github.com/cline/cline/commit/de0f74cafc7f509467f65f57dc6d784b26004db9). Changes since that baseline include:

- **Glyph identity:** updated CLI branding, terminal titles, prompts, help, and user-facing messages; `glyph` is the canonical command, with `cline` retained as an alias.
- **Reasoning selection:** a dedicated picker, `/reasoning`, keyboard and palette actions, expanded effort levels, and saved model-specific preferences carried through requests and compaction.
- **Provider setup improvements:** revised onboarding and model-selection flows, with clearer reasoning choices and handling for custom endpoints.
- **Terminal presentation:** animated thinking orbs, revised robot animation rendering, compact layouts for small terminals, and spinner/loading reliability fixes.
- **Model metadata:** cached LiteLLM catalog enrichment for model limits, capabilities, reasoning controls, and pricing estimates, retaining valid cached data if refresh fails.
- **Windows distribution:** native build handling and a per-user installer/uninstaller with a `glyph` command shim and user PATH management.
- **Runtime and packaging fixes:** provider reasoning payload corrections, hub build-identity reporting, and additional regression and compiled-terminal smoke tests.

The underlying agent, Plan/Act workflow, MCP support, checkpoints, rules, skills, teams, schedules, and connectors are inherited from Cline. They are capabilities of Glyph, not claimed as new inventions of this fork.

## CLI Development

The CLI source lives in `apps/cli/`. After the initial dependency setup and shared-runtime build, use these focused checks from the repository root:

```sh
bun run build:sdk
bun run --cwd apps/cli typecheck
bun run --cwd apps/cli test:unit
bun run --cwd apps/cli test:tui:smoke
bun run --cwd apps/cli test:windows-installer
```

The installer tests cover Windows packaging behavior; creating the installer itself requires Windows. See the CLI [distribution notes](apps/cli/DISTRIBUTION.md) for packaging details. Internal `@cline/*` package names, provider IDs, service URLs, and `CLINE_*` environment variables remain in use.

## Credits and License

Glyph is based on [Cline](https://github.com/cline/cline). Thank you to Cline Bot Inc. and the Cline contributors for the open-source CLI and agent infrastructure that make this fork possible. The terminal UI uses [OpenTUI](https://github.com/sst/opentui).

Licensed under [Apache License 2.0](LICENSE). Original Cline copyright and license notices are retained.
