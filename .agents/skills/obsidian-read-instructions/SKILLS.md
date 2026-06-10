---
name: obsidian-reader
description: Retrieve and apply active user-facing instructions and behavioral customizations stored in an Obsidian vault.
---
## Purpose
This skill instructs AI agents how to retrieve and apply active user-facing instructions and behavioral customizations stored in an Obsidian vault. By reading these notes, the agent ensures it adheres to custom guidelines, constraints, and preferences defined for the current project and technology.

## When to run
- *Initially (Once)*: At the very beginning of a new session or task to retrieve initial behavioral rules.
- *MCP Tool Invocation Check*: Every time the agent is about to execute or interact with an MCP (Model Context Protocol) tool, to ensure no new, modified, or safety-critical instructions have been added since the start of the session.
# Obsidian Reader Skill

This skill enables the agent to query and extract information from the user's Obsidian vault (which is a local directory containing Markdown files).

## When to use this skill
- When the user asks to search, query, find, list, or read notes from their Obsidian vault.
- When the user asks to find tasks, checklist items, or checkboxes (e.g., `- [ ]`) inside Obsidian notes.
- When the user wants to list all tags or find notes containing a specific tag in their Obsidian vault.

## Setup Requirements
To use this skill, the agent must know the path to the Obsidian vault. It can be provided:
1. Via the `--vault <path>` CLI option to the query script.
2. Via the environment variable `OBSIDIAN_VAULT_PATH`.
3. If neither is specified, the script falls back to checking `~/Obsidian/Vault` as a default.

## Usage Guide
The skill is executed by running the Python helper script located at `.agents/skills/obsidian-reader/scripts/query_obsidian.py`.

### Available Commands

1. **List all notes:**
   ```bash
   python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action list
   ```

2. **Search notes by keywords:**
   ```bash
   python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action search --query "search term"
   ```

3. **Read the contents of a specific note:**
   ```bash
   python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action read --query "Note Name"
   ```

4. **Retrieve checklist tasks:**
   - List all tasks:
     ```bash
     python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action tasks --status all
     ```
   - List incomplete tasks (todos) only:
     ```bash
     python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action tasks --status todo
     ```
   - List completed tasks only:
     ```bash
     python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action tasks --status done
     ```

5. **Manage and search tags:**
   - List all tags in the vault (sorted by frequency):
     ```bash
     python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action tags
     ```
   - Find all notes tagged with `#project-a`:
     ```bash
     python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action tags --query "project-a"
     ```

6. **Retrieve project or technology notes and linked instructions:**
   - Retrieve a specific project note and its associated instruction notes:
     ```bash
     python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action get --project "Project Name"
     ```
   - Retrieve a specific technology note and its associated instruction notes:
     ```bash
     python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action get --technology "Technology Name"
     ```
   - Retrieve both project and technology notes and their associated instruction notes simultaneously:
     ```bash
     python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action get --project "Project Name" --technology "Technology Name"
     ```

### Structured Data (JSON Output)
You can append `--format json` to any command to receive structured JSON output, which is useful when programmatic parsing is required:
```bash
python3 .agents/skills/obsidian-reader/scripts/query_obsidian.py --vault <vault_path> --action tasks --status todo --format json
```
