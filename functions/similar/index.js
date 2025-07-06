const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const app = express();

const ES_HOST = process.env.ES_HOST || 'http://localhost:9200';
const client = new Client({
  node: ES_HOST
});

app.use(express.json());

app.post('/similar', async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).send("Missing 'title' in request body");
  }

  try {
    // Step 1: Find the original game
    const result = await client.search({
      index: 'games',
      query: {
        match: { title }
      }
    });

    if (result.hits.hits.length === 0) {
      return res.status(404).send("Game not found");
    }

    const original = result.hits.hits[0]._source;

    // Step 2: Search for similar games
    const similar = await client.search({
      index: 'games',
      size: 10,
      query: {
        bool: {
          must: [
            {
              more_like_this: {
                fields: ['description'],
                like: original.description,
                min_term_freq: 1,
                max_query_terms: 12
              }
            }
          ],
          should: [
            {
              terms: { tags: original.tags }
            }
          ],
          must_not: [
            {
              match: { title }
            }
          ]
        }
      }
    });

    res.json(similar.hits.hits.map(hit => hit._source));
  } catch (err) {
    console.error(err);
    res.status(500).send("Similarity search failed: " + err.message);
  }
});

app.listen(3001, () => console.log("Similar function running on port 3001"));
