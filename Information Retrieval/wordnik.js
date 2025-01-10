// Example:

// http://localhost:8000/wordnik/love

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/wordnik/:word', async (req, res) => {
  try {
    const { word } = req.params;
    const url = `https://www.wordnik.com/words/${encodeURIComponent(word)}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      }
    });
    const html = response.data;
    const $ = cheerio.load(html);

    const api_info = {
      api_name: "Wordnik",
      description: "Wordnik, a nonprofit organization, is an online English dictionary and language resource that provides dictionary and thesaurus content. Some of the content is based on print dictionaries such as the Century Dictionary, the American Heritage Dictionary, WordNet, and GCIDE.",
      author: "JohnDev19"
    };

    const result = {
      api_info: api_info,
      word,
      definitions: [],
      etymologies: [],
      examples: [],
      relatedWords: {
        synonyms: [],
        rhymes: [],
        variants: [],
        crossReferences: []
      },
      sourceUrl: url
    };

    const definitionsBySource = {};
    $('.word-module.module-definitions .guts ul').each((index, element) => {
      const source = $(element).prev('h3.source').text().trim();
      const sourceUrl = $(element).prev('h3.source').find('a').attr('href');

      $(element).find('li').each((i, li) => {
        const definition = {
          partOfSpeech: $(li).find('abbr').text().trim() || 'N/A',
          text: $(li).text().replace($(li).find('abbr').text(), '').trim() || 'N/A'
        };

        if (!definitionsBySource[source]) {
          definitionsBySource[source] = {
            source: source || 'N/A',
            definitions: []
          };
        }

        definitionsBySource[source].definitions.push(definition);
      });
    });

    result.definitions = Object.values(definitionsBySource);

    $('.word-module.module-etymologies .guts .sub-module').each((index, element) => {
      const etymology = $(element).text().trim();
      result.etymologies.push(etymology || 'N/A');
    });

    $('.examples-module .exampleItem').each((index, element) => {
      const example = {
        text: $(element).find('.text').text().trim() || 'N/A',
        source: $(element).find('.source').text().trim() || 'N/A',
        sourceUrl: $(element).find('.source a').attr('href') || 'N/A'
      };
      result.examples.push(example);
    });

    $('.related-group').each((index, element) => {
      const type = $(element).find('h3').text().trim().split(' ')[0];
      $(element).find('.list li').each((i, li) => {
        const word = $(li).text().trim();
        switch (type) {
          case 'synonyms':
            result.relatedWords.synonyms.push(word);
            break;
          case 'rhymes':
            result.relatedWords.rhymes.push(word);
            break;
          case 'variants':
            result.relatedWords.variants.push(word);
            break;
          case 'cross-references':
            result.relatedWords.crossReferences.push(word);
            break;
        }
      });
    });

    for (const key in result.relatedWords) {
      if (result.relatedWords[key].length === 0) {
        result.relatedWords[key] = ['N/A'];
      }
    }

    if (
      result.definitions.length === 0 &&
      result.etymologies.length === 0 &&
      result.examples.length === 0 &&
      result.relatedWords.synonyms[0] === 'N/A' &&
      result.relatedWords.rhymes[0] === 'N/A' &&
      result.relatedWords.variants[0] === 'N/A' &&
      result.relatedWords.crossReferences[0] === 'N/A'
    ) {
      return res.status(404).json({ error: `No results found for word "${word}"` });
    }

    if (result.definitions.length === 0) result.definitions = ['N/A'];
    if (result.etymologies.length === 0) result.etymologies = ['N/A'];
    if (result.examples.length === 0) result.examples = ['N/A'];

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while fetching data' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
