const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/wiktionary', async (req, res) => {
  try {
    const { word } = req.query;
    if (!word) {
      return res.status(400).json({ error: 'Word parameter is required' });
    }

    const url = `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`;
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const api_info = {
      api_name: "Wiktionary",
      author: "JohnDev19",
      description: "Wiktionary is a multilingual, web-based project to create a free content dictionary of all words in all languages. It is collaboratively edited via a wiki, and its name is a portmanteau of the words wiki and dictionary."
    };

    const result = {
      api_info: api_info,
      word,
      definitions: [],
      etymology: '',
      pronunciation: '',
      sourceUrl: url
    };

    result.etymology = $('#Etymology').parent().next('p').text().trim();

    const pronunciationSpan = $('span.IPA').first();
    result.pronunciation = pronunciationSpan.text().trim();

    $('ol:first').children('li').each((index, element) => {
      const definition = $(element).text().trim();
      if (definition) {
        result.definitions.push(definition);
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while fetching data' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
