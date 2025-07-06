# 🧠 Serverless Game Search Platform

A modular, AI-powered, **serverless search architecture** for video games — powered by ElasticSearch, OpenAI, and GameBrain's MCP protocol. This platform intelligently routes user queries like _"Find me games like Baldur’s Gate"_ to the appropriate internal service (`/search`, `/similar`, `/suggest`) using LLMs or MCP-based inference.

---

## 🚀 Overview

This project demonstrates a **complete serverless search system** that:

- Extracts **user intent** via ChatGPT (OpenAI) or GameBrain's MCP agent
- Routes queries to the right microservice (`/search`, `/similar`, or `/suggest`)
- Uses **ElasticSearch** as the backend index
- Is fully containerized and orchestrated using **Docker Compose**

---

## 📦 Architecture

                         +----------------+
                         |   User Query   |
                         +--------+-------+
                                  |
                       ┌──────────▼──────────┐
                       |   Gateway (GoLang)  |
                       └──────────┬──────────┘
                 ┌───────────────┴───────────────┐
                 |                               |
    +------------▼-------------+     +-----------▼------------+
    |   OpenAI Chat Completion |     |   GameBrain MCP Fallback|
    |   (Intent Extraction)    |     |   (via `npx mcp-remote`) |
    +------------+-------------+     +-----------+-------------+
                 |                               |
         ┌───────▼────────┐       ┌──────────────▼─────────────┐
         | JSON Intent    |       | JSON Intent from MCP Agent |
         └───────┬────────┘       └──────────────┬─────────────┘
                 |                               |
   ┌─────────────▼────────────┐      ┌───────────▼──────────┐
   | /search (full text)     |      | /similar (title match)|
   | /suggest (autocomplete) |      |                       |
   | Node.js + ElasticSearch |      | Node.js + ElasticSearch|
   └─────────────┬───────────┘      └───────────┬───────────┘
                 ▼                               ▼
         +---------------+               +-----------------+
         |  ElasticSearch|<-------------►| Init Bootstrap  |
         +---------------+               +-----------------+

---

## 🔧 Stack & Tools

| Component            | Tech Used                        |
|---------------------|----------------------------------|
| Gateway             | GoLang + godotenv                |
| Intent Routing      | OpenAI (ChatGPT), GameBrain MCP  |
| Fallback Execution  | `npx mcp-remote` subprocess      |
| Search Backend      | ElasticSearch                    |
| Microservices       | Node.js + Express.js             |
| Deployment          | Docker + Docker Compose          |
| Environment Config  | `.env` (with API keys)           |

---

## 🧠 Intelligent Query Routing

### User Query:
```json
{ "query": "Find me games like Baldur's Gate" }
```
