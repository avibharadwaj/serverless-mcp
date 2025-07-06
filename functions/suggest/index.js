require('dotenv').config();
const express = require('express');
const { Client } = require('@elastic/elasticsearch');

const app = express();
app.use(express.json());

const ES_HOST = process.env.ES_HOST || 'http://localhost:9200';
const client = new Client({ node: ES_HOST });

app.post('/suggest', async (req, res) => {
  try {
    const { input } = req.body;

    const result = await client.search({
      index: 'games',
      body: {
        suggest: {
          game_suggestions: {
            prefix: input.toLowerCase(),
            completion: {
              field: 'suggest',
              fuzzy: {
                fuzziness: "auto"
              }
            }
          }
        }
      }
    });

    const options = result.suggest.game_suggestions[0].options.map(opt => opt.text);
    res.json(options);
  } catch (err) {
    console.error("Suggestion error:", err.message);
    res.status(500).send("Suggest error: " + err.message);
  }
});

app.listen(3002, () => console.log("Suggest function running on port 3002"));
