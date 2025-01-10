const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/webster/:word', async (req, res) => {
  try {
    const word = req.params.word;
    const url = `https://www.merriam-webster.com/dictionary/${word}`;

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const api_info = {
      api_name: "Merriam Webster",
      description: "Merriam-Webster is the most reliable, trusted, easy-to-use dictionary and thesaurus online. Find definitions for over 300,000 words from the most authoritative English dictionary. Continuously updated with new words and meanings.",
      author: "JohnDev19"
    };

    const result = {
      api_info: api_info,
      wordOfTheDay: {
        word: '',
        url: ''
      },
      word: $('.hword').first().text(),
      partOfSpeech: $('.important-blue-link').first().text(),
      pronunciation: {
        spelled: $('.word-syllables-entry').first().text(),
        phonetic: $('.prons-entries-list-inline .prons-entry-list-item').first().text().trim(),
        audioUrl: $('.prons-entries-list-inline .prons-entry-list-item').first().attr('data-url')
      },
      definitions: [],
      examples: []
    };

    $('.dtText').each((i, elem) => {
      let definition = $(elem).text().trim();
      if (definition.startsWith(':')) {
        definition = `${i + 1}. ${definition.slice(1).trim()}`;
      }
      result.definitions.push(definition);
    });

    $('#examples .t').each((i, elem) => {
      result.examples.push(`${i + 1}. ${$(elem).text().trim()}`);
    });

    const wotdWord = $('.wotd-side__headword').first().text().trim();
    const wotdUrl = 'https://www.merriam-webster.com' + $('.wotd-side__headword a').first().attr('href');

    result.wordOfTheDay = {
      word: wotdWord,
      url: wotdUrl,
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching the data' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
