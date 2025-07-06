# 🧠 serverless-mcp

A serverless, container-native search platform that integrates AI-based intent parsing using OpenAI and GameBrain's MCP protocol — all orchestrated through a modular gateway in Go.

## 🚀 Features

- **Serverless Functions**: `search`, `similar`, and `suggest` endpoints powered by Node.js
- **Intent Parsing**: Fallback chain using OpenAI → GameBrain MCP → Static JSON
- **Vector Search**: Persistent Elasticsearch store (with volume mount)
- **MCP Protocol**: Seamless connection to GameBrain’s remote API via `npx mcp-remote`
- **Go API Gateway**: Intelligent routing based on LLM intent classification
- **Containerized Infrastructure**: Fully Dockerized with multi-service `docker-compose`
- **Environment Isolation**: .env driven config without leaking sensitive keys

## 🛠️ Stack

- **Go** – Gateway logic and MCP fallback routing
- **Node.js** – Search function handlers
- **Elasticsearch** – Vector index persistence
- **Docker Compose** – Service orchestration
- **MCP Protocol** – Machine/Agent intent parsing via GameBrain API
- **OpenAI** – Natural language understanding (intent → JSON)

## 🧪 Running Locally

```bash
# Build and start all containers
docker-compose build
docker-compose up -d
```

# Test via curl
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"query": "Find me games like Baldur'\''s Gate"}'
