const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/refseek/:searchKeyword', async (req, res) => {
  try {
    const { searchKeyword } = req.params;
    const url = `https://www.refseek.com/search?q=${encodeURIComponent(searchKeyword)}`;

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const results = {
      mainResults: [],
      images: [],
      definition: {},
      stickySectionLinks: []
    };

    $('.sticky').each((i, element) => {
      const title = $(element).find('.sticky__title a').text().trim();
      const link = $(element).find('.sticky__title a').attr('href');
      const source = $(element).find('.sticky__link').text().trim();
      const description = $(element).find('.sticky__description').text().trim();

      const completeLink = link.startsWith('/') ? `https://www.refseek.com${link}` : link;

      results.mainResults.push({ title, link: completeLink, source, description });
    });

    $('img').each((i, element) => {
      const imageUrl = $(element).attr('src');
      if (imageUrl && imageUrl.startsWith('https://en.wikipedia.org/wiki/File:')) {
        results.images.push({ imageUrl });
      }
    });

    $('a').each((i, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('https://en.wikipedia.org/wiki/File:')) {
        results.images.push({ imageUrl: href });
      }

      const text = $(element).text().trim();
      const hrefLink = $(element).attr('href');
      if (text && hrefLink && hrefLink.startsWith('https://en.wikipedia.org/wiki/')) {
        results.stickySectionLinks.push({ text, href: hrefLink });
      }
    });

    const definitionBlock = $('.definition.sidebar__block');
    results.definition = {
      term: definitionBlock.find('.sidebar__title strong').text().trim(),
      text: definitionBlock.find('.definition__text').text().trim(),
      additionalLinks: definitionBlock.find('.definition__additional a').map((i, el) => ({
        text: $(el).text(),
        href: $(el).attr('href')
      })).get()
    };

    res.json({
      api_information: {
        api_name: 'Refseek',
        description: 'The Refseek Search API allows you to search for information, images, definitions, and more using the Refseek search engine.',
        author: 'JohnDev19'
      },
      results: results
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while fetching data' });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
