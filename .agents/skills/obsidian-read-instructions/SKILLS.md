---
name: obsidian-reader
description: Always load this skill. Retrieve all instructions relevant to the current project and technology in an Obsidian vault.
---

## Purpose
This skill instructs AI agents how to retrieve and apply active user-facing instructions and behavioral customizations stored in an Obsidian vault. By reading these notes, the agent ensures it adheres to custom guidelines, constraints, and preferences defined for the current project and technology.

## When to run
- *Initially (Once)*: At the very beginning of a new session or task to retrieve initial behavioral rules.
- *MCP Tool Invocation Check*: Every time the agent is about to execute or interact with an MCP (Model Context Protocol) tool, to ensure no new, modified, or safety-critical instructions have been added since the start of the session.

## Implementation / MCP integration
- Use the project's MCP implementation at `src/mcp.ts` for all interactions with the Obsidian vault. Do not call external MCPs or ad-hoc fetchers.
- When the agent reaches a step that requires reading Obsidian content, import or invoke the MCP entrypoint from `src/mcp.ts` and use its documented API to list, fetch, and parse vault notes.
- The MCP call should include context describing the task (e.g., "load active instructions"), and should validate that any retrieved instructions are not stale before applying them.

## How to Use the MCP

Follow these steps to run and call the local Obsidian MCP implemented in `src/mcp.ts`:

- **Set the vault path:** Set `OBSIDIAN_VAULT_PATH` to your vault root (optional — defaults to `D:\\obsidian\\test`).

- **Start the MCP server:** Run the MCP process so it exposes the registered tools over stdio transport. From the workspace root run:

```
node src/mcp.ts
```

- **Available tools:** The server exposes these tool names and behaviors:
	- `list_notes` — returns an array of markdown file paths in the vault.
	- `read_note` — accepts `{ path: string }` and returns the note contents.
	- `write_note` — accepts `{ path: string, content: string }` to create/overwrite notes.
	- `append_to_note` — accepts `{ path: string, content: string }` to append to a note.
	- `search_notes` — accepts `{ query: string }` and returns match metadata and snippets.

- **Calling the tools (example):** Use your MCP client (or the `@modelcontextprotocol` SDK) to connect to the server and call tools by name. Pseudocode:

```
// Pseudocode - adapt to your MCP client implementation
const client = new McpClient();
await client.connect(new StdioClientTransport(process.stdin, process.stdout));

// list notes
const listRes = await client.callTool('list_notes');

// read a note
const readRes = await client.callTool('read_note', { path: 'path/to/note.md' });

// search notes
const searchRes = await client.callTool('search_notes', { query: 'active instructions' });
```

- **Error handling:** Tools return an error shape with `isError: true` and a textual message on failure — always check for `isError` before consuming `content`.

- **Security:** The MCP enforces vault path confinement; do not pass absolute paths that escape the vault. Use relative note paths (e.g., `folder/note.md`).

Use these instructions whenever you need to load or update project-facing instructions from the Obsidian vault.

## Example (informational)
- Node/TS usage (conceptual): `const mcp = require('../../src/mcp.ts')` or `import mcp from '../../src/mcp.ts'` and then `mcp.fetchVaultNotes({path: 'obsidian'});`

## Safety and precedence
- When Obsidian-derived instructions conflict with higher-priority project policies or runtime safety checks, prefer enforced project policies. Always surface conflicts for human review.

# Obsidian Reader Skill
