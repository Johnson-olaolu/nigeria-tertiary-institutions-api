import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "../mcp/server.js";

// Stateless Streamable HTTP: every POST gets its own server and transport, so it works on serverless hosts
const router = express.Router();

router.post("/", async (req, res, next) => {
    try {
        const server = createMcpServer(req);
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
        res.on("close", () => {
            transport.close();
            server.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        next(error);
    }
});

// No sessions, so there's no SSE stream to open (GET) or session to end (DELETE)
router.all("/", (req, res) =>
    res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null })
);

export default router;
