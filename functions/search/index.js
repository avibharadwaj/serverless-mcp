const express = require('express');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config(); // Optional if you're using .env

const app = express();
const ES_HOST = process.env.ES_HOST || 'http://localhost:9200';

const client = new Client({ node: ES_HOST });

app.use(express.json());

app.post('/search', async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).send("❌ 'query' field is required in request body.");
  }

  console.log("🔍 Received search query:", query);

  try {
    const result = await client.search({
      index: 'games',
      query: {
        query_string: {
          query: `*${query}*`,
          fields: ['title']
        }
      }
    });

    const hits = result.hits.hits;
    console.log(`✅ Found ${hits.length} result(s)`);
    res.json(hits);
  } catch (err) {
    console.error("❌ ElasticSearch error:", err.message);
    res.status(500).send("Search error: " + err.message);
  }
});

app.listen(3000, () => {
  console.log("🚀 Search function running on http://localhost:3000");
  console.log("📡 Connecting to ElasticSearch at:", ES_HOST);
});
