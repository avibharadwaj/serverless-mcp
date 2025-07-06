const { Client } = require('@elastic/elasticsearch');
const ES_HOST = process.env.ES_HOST || 'http://localhost:9200';
const client = new Client({ node: ES_HOST });
(async () => {
  
  await client.indices.create({
    index: 'games',
    body: {
      mappings: {
        properties: {
          title: { type: 'text' },
          description: { type: 'text' },
          tags: { type: 'keyword' },
          suggest: { type: 'completion' }  // Important fix
        }
      }
    }
  });
  console.log("✅ Index with suggest mapping created");
})();
