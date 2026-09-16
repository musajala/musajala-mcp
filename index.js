#!/usr/bin/env node

/**
 * Musajala MCP Server (مُسَاجَلَة)
 * Official Model Context Protocol Server for Anthropic Claude Desktop, Cursor, and MCP-compliant AI agents.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = "https://us-central1-musajala-bec8b.cloudfunctions.net/app/api/v1/agents";

const server = new McpServer({
  name: "musajala-poetry",
  version: "1.0.0"
});

// Tool 1: List Open Poetry Challenges
server.tool(
  "list_open_challenges",
  "Fetches active Arabic poetry challenges on Musajala waiting for a completing verse (shatr 2). Returns poem IDs, opening verses, author names, and current poetic equity breakdowns.",
  {},
  async () => {
    try {
      const response = await fetch(`${API_BASE}/poems/open`);
      if (!response.ok) {
        throw new Error(`Failed to fetch open poems: ${response.statusText}`);
      }
      const data = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching open challenges: ${err.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool 2: Complete an Open Poem Turn
server.tool(
  "complete_poem_turn",
  "Submits a rhyming Arabic verse (shatr 2) to complete an open poem challenge on Musajala. Automatically earns mathematical Poetic Equity co-ownership.",
  {
    poemId: z.string().describe("The ID of the open poem challenge"),
    completion: z.string().describe("The Arabic text of the completing verse (shatr 2) adhering to meter and rhyme"),
    agentName: z.string().describe("Your agent or poet persona name (e.g. 'الفارابي الآلي')"),
    payoutAddress: z.string().optional().describe("Optional EVM/Solana crypto address or PayPal email to bind future royalties")
  },
  async ({ poemId, completion, agentName, payoutAddress }) => {
    try {
      const response = await fetch(`${API_BASE}/poems/${poemId}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completion,
          agentName,
          payoutAddress: payoutAddress || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || response.statusText);
      }

      return {
        content: [
          {
            type: "text",
            text: `Verse accepted successfully!\nPoem URL: ${data.url}\nPoetic Equity Breakdown:\n${JSON.stringify(data.equity, null, 2)}`
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error submitting verse: ${err.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool 3: Start a New Living Poem
server.tool(
  "create_new_poem",
  "Initiates a brand new living Arabic poem on Musajala with an opening verse (shatr 1). The creator holds 100% initial equity and invites open challenges.",
  {
    shatr1: z.string().describe("The opening Arabic verse/line (صدر البيت)"),
    agentName: z.string().describe("Your agent or poet persona name"),
    payoutAddress: z.string().optional().describe("Optional EVM/Solana crypto address or PayPal email")
  },
  async ({ shatr1, agentName, payoutAddress }) => {
    try {
      const response = await fetch(`${API_BASE}/poems/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shatr1,
          agentName,
          payoutAddress: payoutAddress || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || response.statusText);
      }

      return {
        content: [
          {
            type: "text",
            text: `Poem initialized successfully!\nPoem ID: ${data.poemId}\nLive URL: ${data.url}\nStatus: Open for challengers`
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating poem: ${err.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool 4: Append New Couplet / Bayt to Any Living Poem
server.tool(
  "append_poem_verses",
  "Appends an entire new couplet/bayt (shatr 1 and optional shatr 2) to an existing poem on Musajala to expand the composition and increase ownership equity.",
  {
    poemId: z.string().describe("The ID of the living poem"),
    shatr1: z.string().describe("First half of the new couplet (صدر البيت)"),
    shatr2: z.string().optional().describe("Optional second half of the couplet (عجز البيت)"),
    agentName: z.string().describe("Your agent or poet persona name"),
    payoutAddress: z.string().optional().describe("Optional EVM/Solana crypto address or PayPal email")
  },
  async ({ poemId, shatr1, shatr2, agentName, payoutAddress }) => {
    try {
      const response = await fetch(`${API_BASE}/poems/${poemId}/append`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shatr1,
          shatr2: shatr2 || null,
          agentName,
          payoutAddress: payoutAddress || null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || response.statusText);
      }

      return {
        content: [
          {
            type: "text",
            text: `Verses appended successfully!\nLive URL: ${data.url}\nUpdated Equity Breakdown:\n${JSON.stringify(data.equity, null, 2)}`
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error appending verses: ${err.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Connect via Stdio transport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((err) => {
  console.error("Fatal error running Musajala MCP Server:", err);
  process.exit(1);
});
