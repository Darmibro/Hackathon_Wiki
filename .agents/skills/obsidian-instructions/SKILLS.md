# Skill: Obsidian Instruction Logging for Agents (agent-customization)

## Purpose
This skill instructs AI agents (Copilot-style agents) how to record any user-facing instruction or agent-behavior modification into an Obsidian vault. Each instruction must be saved as its own note and linked into two existing (or newly-created) Obsidian nodes: the current project and the current technology. If either node does not exist, the agent must create it.

## When to run
- When an agent receives a directive that affects how it behaves, documents processes, or changes its default action.
- When the user asks the agent to remember, persist, or document instructions relevant to a project or technology.

## Inputs
- `instruction_text` (string): The raw instruction or behavior change to document.
- `project` (string): The current project name (if unknown, agent should ask user for project or infer from context).
- `technology` (string): The primary technology/topic (e.g., Jira, Confluence, Go, React). If unknown, agent should ask or infer.
- `vault_path` (string, optional): Path to the Obsidian vault root. If not provided, use configured default or ask user.
- `user_meta` (object, optional): { `author`, `source`, `user_id` }.

## Outputs
- A new Obsidian note representing the instruction (filename convention below).
- Both the project note and technology note updated to link to the instruction note (Obsidian wiki-links `[[...]]`).
- If project or technology notes did not exist, newly created notes for them with minimal frontmatter and an index section linking the new instruction.

## Filename & Frontmatter conventions
- Filename: `{YYYYMMDD_HHMMSS} - {project_slug} - {technology_slug} - instruction.md`
- Frontmatter YAML (required):
  ---
  title: "Short title or first line of instruction"
  created: YYYY-MM-DDTHH:MM:SSZ
  project: <project>
  technology: <technology>
  tags: [instruction, agent-note, <technology>, <project>]
  author: <author>
  source: <source>
  type: instruction
  status: active
  ---

- Body: full `instruction_text`, a short summary, the `rationale` (if provided), `example prompts` (if any), and `change_log` (empty on first save).

## Step-by-step process (agent behavior)
1. Validate inputs. If `project` or `technology` missing, attempt to infer; if inference confidence < threshold, ask user.
2. Normalize `project` and `technology` to simple slugs (lowercase, hyphens).
3. Build filename and frontmatter as per convention.
4. Save the new instruction note into vault under `Notes/Instructions/` (or a configured folder).
5. Locate the project note: `Projects/{project}.md` (or a configured index). If not found, create it with frontmatter `{project, created, tags: [project]}` and a short description.
6. Locate the technology note: `Technologies/{technology}.md` (or a configured index). If not found, create it with frontmatter `{technology, created, tags: [technology]}` and a short description.
7. In both the project note and the technology note, add a link section (e.g., "Instructions") and insert a wiki-link to the newly-created instruction note `[[{filename_without_ext}]]`.
8. Append a one-line entry to each index: `- [[{instruction_note}]] — {short summary} ({created})`.
9. Return a success message summarizing created files and inserted links.

## Decision points & branching logic
- Missing `vault_path`: use agent-configured default; if none, ask the user.
- Missing `project` or `technology`: attempt to infer from context (file paths, open repo, user-specified current task). If inference fails, prompt the user.
- Conflicting instructions in the same project/technology: create a new instruction note and add cross-references. Add tag `conflict` if user explicitly says to override previous instruction.
- Sensitive or private content: do NOT write into the vault if instruction contains secrets or PII. Instead, return a request to the user to redact or confirm storage permission.

## Quality criteria / completion checks
- New instruction note exists and contains the full `instruction_text` with frontmatter.
- `Projects/{project}.md` contains a `## Instructions` section with a wiki-link to the new note.
- `Technologies/{technology}.md` contains a `## Instructions` section with a wiki-link to the new note.
- Timestamps and author/source metadata present.
- No duplicate note created if an identical instruction (exact text, same project & technology) already exists; instead link to existing note and report "already documented".

## Handling user-issued overrides or AI-behavior changes
- If the user instructs the AI to behave differently, the agent must still document the instruction as above and add a special `override` tag in frontmatter.
- Add a `change_log` entry in the instruction note describing: who requested the change, when, and short context.
- If the instruction conflicts with existing policy or higher-priority rules, add `needs-review` tag and notify the user.

## Example prompts for the agent
- "Document this instruction: Always run tests before merging into `project-x` using `Jenkins`. Vault: /path/to/vault."
- "Save the user override that agents should format Jira tickets as 'TYPE: short summary' under project 'MarketApp' and technology 'Jira'."

## Example produced notes (short)
- Instruction note frontmatter and content as described above.
- Project note snippet:
  ## Instructions
  - [[20260610_142300 - marketapp - jira - instruction]] — Enforce ticket format (2026-06-10)

## Ambiguities and clarifying questions (what the agent should ask the user when ambiguous)
- Which Obsidian vault path should I use? (or use default configured vault)
- Preferred location for instruction notes? (default `Notes/Instructions/`)
- Project naming convention and allowed characters?
- Technology taxonomy (should I normalize 'Jira' and 'Atlassian Jira' to the same node?)
- Should the agent automatically publish links into shared vaults or ask for confirmation when vault is remote?

## Privacy & permissions
- Before writing to any vault, confirm the agent has permission to write to that filesystem path.
- Do not store secrets or credentials. If instruction contains sensitive data, prompt the user to redact or confirm secure storage.

## Iteration & review
1. Draft the instruction note and create links (automated).
2. Ask the user to review the created note and confirm correctness.
3. On user feedback, update the note's `change_log` and `status` frontmatter.

## Related customizations (next skills to create)
- Skill: Obsidian Vault Setup — configure default vault path and folders.
- Skill: Instruction Inference — heuristic for inferring project and technology from context.
- Skill: Instruction Audit — run periodic checks for conflicting instructions and surface `needs-review` items.

---

If anything in this draft should behave differently (naming conventions, folder locations, metadata fields), tell me which parts to change and I will update the skill.
