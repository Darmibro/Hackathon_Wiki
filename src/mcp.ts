import * as path from "path";
import * as fs from "fs/promises";
import { existsSync } from "fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const VAULT_PATH = path.resolve(process.env.OBSIDIAN_VAULT_PATH || "D:\\obsidian\\test");

/**
 * Validates and resolves a relative file path within the Obsidian vault.
 * Ensures that the resolved path does not escape the vault directory.
 */
function resolvePath(relativePath: string): string {
  const absolutePath = path.resolve(VAULT_PATH, relativePath);
  const relative = path.relative(VAULT_PATH, absolutePath);
  
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Access Denied: Path "${relativePath}" resolves outside the vault directory.`);
  }
  
  return absolutePath;
}

/**
 * Recursively scans a directory for markdown (.md) files and returns their relative paths.
 */
async function listNotesRecursively(dir: string, baseDir: string = VAULT_PATH): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listNotesRecursively(fullPath, baseDir)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.relative(baseDir, fullPath));
    }
  }

  return files;
}

// Create the MCP server instance
const server = new McpServer({
  name: "obsidian-local-server",
  version: "1.0.0",
});

/**
 * Register 'list_notes' tool.
 * Lists all Markdown notes recursively in the vault.
 */
server.tool(
  "list_notes",
  "Lists all notes (.md files) in the vault recursively",
  {},
  async () => {
    try {
      await fs.mkdir(VAULT_PATH, { recursive: true });
      const notes = await listNotesRecursively(VAULT_PATH);
      return {
        content: [{ type: "text", text: JSON.stringify(notes, null, 2) }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error listing notes: ${error.message}` }],
      };
    }
  }
);

/**
 * Register 'read_note' tool.
 * Reads the content of a markdown file inside the vault.
 */
server.tool(
  "read_note",
  "Reads the contents of a specific markdown note inside the vault",
  {
    path: z.string().describe("The relative path of the note to read (e.g. 'folder/note.md')")
  },
  async ({ path: notePath }) => {
    try {
      const resolved = resolvePath(notePath);
      const content = await fs.readFile(resolved, "utf-8");
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error reading note: ${error.message}` }],
      };
    }
  }
);

/**
 * Register 'write_note' tool.
 * Creates a new note or replaces the content of an existing one in the vault.
 */
server.tool(
  "write_note",
  "Creates a new note or overwrites an existing note in the vault with the specified content",
  {
    path: z.string().describe("The relative path of the note to write (e.g. 'folder/note.md')"),
    content: z.string().describe("The full markdown content of the note")
  },
  async ({ path: notePath, content }) => {
    try {
      const resolved = resolvePath(notePath);
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, content, "utf-8");
      return {
        content: [{ type: "text", text: `Successfully wrote note: ${notePath}` }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error writing note: ${error.message}` }],
      };
    }
  }
);

/**
 * Register 'append_to_note' tool.
 * Appends content to the end of an existing note or creates it if it doesn't exist.
 */
server.tool(
  "append_to_note",
  "Appends text/content to an existing note or creates it if it does not exist",
  {
    path: z.string().describe("The relative path of the note to append to (e.g. 'folder/note.md')"),
    content: z.string().describe("The markdown content to append to the note")
  },
  async ({ path: notePath, content }) => {
    try {
      const resolved = resolvePath(notePath);
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      
      let existingContent = "";
      if (existsSync(resolved)) {
        existingContent = await fs.readFile(resolved, "utf-8");
        if (existingContent && !existingContent.endsWith("\n")) {
          existingContent += "\n";
        }
      }
      
      await fs.writeFile(resolved, existingContent + content, "utf-8");
      return {
        content: [{ type: "text", text: `Successfully appended to note: ${notePath}` }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error appending to note: ${error.message}` }],
      };
    }
  }
);

/**
 * Register 'search_notes' tool.
 * Performs a keyword search across all notes in the vault.
 */
server.tool(
  "search_notes",
  "Searches for a keyword or string inside all markdown notes in the vault",
  {
    query: z.string().describe("The search query / keyword")
  },
  async ({ query }) => {
    try {
      await fs.mkdir(VAULT_PATH, { recursive: true });
      const notes = await listNotesRecursively(VAULT_PATH);
      const results: { path: string; matchCount: number; snippet: string }[] = [];
      const lowerQuery = query.toLowerCase();

      for (const note of notes) {
        const resolved = resolvePath(note);
        const fileContent = await fs.readFile(resolved, "utf-8");
        
        if (fileContent.toLowerCase().includes(lowerQuery)) {
          const lines = fileContent.split("\n");
          let matchCount = 0;
          let firstSnippet = "";

          for (const line of lines) {
            if (line.toLowerCase().includes(lowerQuery)) {
              matchCount++;
              if (!firstSnippet) {
                firstSnippet = line.trim();
              }
            }
          }

          results.push({
            path: note,
            matchCount,
            snippet: firstSnippet
          });
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error searching notes: ${error.message}` }],
      };
    }
  }
);

/**
 * Connects the MCP server using standard input/output transport.
 */
async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Obsidian MCP Server running on Stdio transport.");
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
