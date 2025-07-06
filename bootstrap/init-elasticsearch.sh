#!/bin/sh

echo "⏳ Waiting for Elasticsearch to be ready..."
until curl -s http://elasticsearch:9200 >/dev/null; do
  sleep 2
done
echo "✅ Elasticsearch is up"

# Check if index exists
if curl -s -o /dev/null -w "%{http_code}" http://elasticsearch:9200/games | grep -q "200"; then
  echo "⚠️  Index 'games' already exists. Skipping creation."
else
  echo "⚙️ Creating index with suggest mapping..."
  node /app/createIndex.js
fi

echo "📥 Populating Elasticsearch with GameBrain data..."
node /app/populate_test.js

echo "✅ Initialization complete."
