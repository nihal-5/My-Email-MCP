import http from 'http';
import { WhatsAppClient } from './whatsapp-client.js';
import { tools, executeTool } from './tools/index.js';
import { logger } from './utils/logger.js';
import { getConfig } from './utils/config.js';

export class MCPServer {
  private server: http.Server;
  private config = getConfig();

  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Handle GET /health
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          ready: true, // Email-only version is always ready
        })
      );
      return;
    }

    // Handle GET /tools
    if (req.method === 'GET' && req.url === '/tools') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        })
      );
      return;
    }

    // Handle POST /execute
    if (req.method === 'POST' && req.url === '/execute') {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const request = JSON.parse(body);
          const { tool, params } = request;

          if (!tool) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing tool name' }));
            return;
          }

          const result = await executeTool(null as any, tool, params || {});

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, result }));
        } catch (error: any) {
          logger.error('Request error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: error.message || 'Internal server error',
            })
          );
        }
      });

      return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.mcpPort, () => {
        logger.info(`MCP Server listening on port ${this.config.mcpPort}`);
        logger.info(`Health check: http://localhost:${this.config.mcpPort}/health`);
        logger.info(`List tools: http://localhost:${this.config.mcpPort}/tools`);
        logger.info(`Execute tool: POST http://localhost:${this.config.mcpPort}/execute`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          logger.info('MCP Server stopped');
          resolve();
        }
      });
    });
  }
}
