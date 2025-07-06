require('dotenv').config();
const axios = require('axios');
const { Client } = require('@elastic/elasticsearch');

const ES_HOST = process.env.ES_HOST || 'http://localhost:9200';
const API_KEY = process.env.GAMEBRAIN_API_KEY;

const client = new Client({
  node: ES_HOST
});

(async () => {
  if (!API_KEY) {
    console.error("❌ No API key provided. Set GAMEBRAIN_API_KEY in .env");
    return;
  }

  try {
    const response = await axios.get(
      `https://api.gamebrain.co/v1/games?api-key=${API_KEY}`
    );

    const games = response.data.results;

    if (!Array.isArray(games)) {
      console.error("❌ Could not extract 'results' array from GameBrain response");
      return;
    }

    console.log(`✅ Fetched ${games.length} games from GameBrain`);

    for (let game of games) {
      if (!game.name) continue;

      await client.index({
        index: 'games',
        document: {
          title: game.name,
          description: game.short_description || '',
          tags: game.genre ? game.genre.split(" ") : []
        }
      });

      console.log(`🔹 Indexed: ${game.name}`);
    }

    await client.indices.refresh({ index: 'games' });
    console.log("✅ All games indexed!");

  } catch (err) {
    console.error("❌ Error during populate:", err.message);
    console.error(err.response?.data || err.stack);
  }
})();
