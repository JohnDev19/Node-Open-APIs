const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/stanford/:keyword', async (req, res) => {
  try {
    const searchKeyword = req.params.keyword;
    const url = `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent(searchKeyword)}`;

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const firstResult = $('.result_listing').first();
    const resultUrl = firstResult.find('.result_url a').attr('href');

    if (!resultUrl) {
      return res.status(404).json({ error: 'No results found' });
    }

    const contentResponse = await axios.get(resultUrl);
    const content$ = cheerio.load(contentResponse.data);

    const title = content$('h1').text().trim();

    const mainContent = content$('#main-text').text().trim()
      .replace(/\s+/g, ' ')
      .replace(/\[[^\]]+\]/g, ''); 

    const apiName = "Stanford Encyclopedia";
        const description = "The Stanford Encyclopedia of Philosophy organizes scholars from around the world in philosophy and related disciplines to create and maintain an up-to-date reference work.";
        const author = "JohnDev19";

    const result = {
      api_name: apiName,
      description: description,
      author: author,
      title,
      url: resultUrl,
      mainContent,
    };

    res.json(result);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching data' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
