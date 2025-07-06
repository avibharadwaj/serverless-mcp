require('dotenv').config();
const axios = require('axios');
const { Client } = require('@elastic/elasticsearch');

const ES_HOST = process.env.ES_HOST || 'http://localhost:9200';
const API_KEY = process.env.GAMEBRAIN_API_KEY;

const client = new Client({ node: ES_HOST });

const LIMIT = 50;
const TOTAL_PAGES = 5;

(async () => {
  if (!API_KEY) {
    console.error("❌ No API key provided. Set GAMEBRAIN_API_KEY in .env");
    return;
  }

  let totalIndexed = 0;
  let totalSkipped = 0;

  try {
    for (let page = 0; page < TOTAL_PAGES; page++) {
      const offset = page * LIMIT;
      console.log(`📥 Fetching page ${page + 1} (offset=${offset})...`);

      const response = await axios.get(
        `https://api.gamebrain.co/v1/games?api-key=${API_KEY}&limit=${LIMIT}&offset=${offset}`
      );

      const games = response.data.results;

      if (!Array.isArray(games)) {
        console.error("❌ Unexpected response format");
        continue;
      }

      for (let game of games) {
        if (!game.name) continue;

        const titleQuery = {
          index: 'games',
          query: {
            match_phrase: { title: game.name }
          }
        };

        const { hits } = await client.search(titleQuery);

        if (hits.total.value > 0) {
          console.log(`⏭️ Skipped (already indexed): ${game.name}`);
          totalSkipped++;
          continue;
        }

        await client.index({
          index: 'games',
          document: {
            title: game.name,
            description: game.short_description || '',
            tags: game.genre ? game.genre.split(" ") : [],
            suggest: { input: [game.name] }
          }
        });

        console.log(`🔹 Indexed: ${game.name}`);
        totalIndexed++;
      }
    }

    await client.indices.refresh({ index: 'games' });
    console.log(`✅ Indexed ${totalIndexed} new games, skipped ${totalSkipped} duplicates.`);
  } catch (err) {
    console.error("❌ Error during populate:", err.message);
    console.error(err.response?.data || err.stack);
  }
})();
