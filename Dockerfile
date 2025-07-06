FROM node:20-alpine

WORKDIR /app

COPY mcp-gamebrain.sh .
RUN chmod +x mcp-gamebrain.sh

CMD ["sh", "./mcp-gamebrain.sh"]
