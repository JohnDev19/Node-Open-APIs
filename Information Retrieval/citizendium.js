// Example:

// http://localhost:8000/citizendium/science

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/citizendium/:searchKeyword', async (req, res) => {
  try {
    const { searchKeyword } = req.params;
    const url = `https://citizendium.org/wiki/${searchKeyword}`;

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const apiInfo = [
      {
        api_name: "Citizendium",
        description: "Welcome to Citizendium, a wiki for providing free knowledge where authors use their real names. We regard information as a public good and welcome anyone who wants to share their knowledge on virtually any subject. ",
        author: "JohnDev19"
      }
    ];

    const result = {
      api_information: apiInfo,
      title: $('h1#firstHeading').text().trim(),
      all_content: ''
    };

    $('div#mw-content-text').find('p, h1, h2, h3, h4, h5, ul, ol').each((i, el) => {
      const text = $(el).text().trim();
      if (text && 
          !text.includes('addthis_pub') && 
          !text.includes('Main Article') && 
          !text.includes('Discussion') &&
          !text.includes('Related Articles') &&
          !text.includes('Bibliography') &&
          !text.includes('External Links') &&
          !text.includes('Citable Version') &&
          !text.includes('Works') &&
          !text.includes('Timelines')) {

        if (el.name.match(/h[1-5]/)) {
          result.all_content += `${el.name.toUpperCase()}: ${text}\n\n`;
        } else {
          result.all_content += `${text}\n\n`;
        }
      }
    });

    result.all_content = result.all_content.trim();

    Object.keys(result).forEach(key => {
      if (key !== 'api_information' && typeof result[key] === 'string' && result[key].trim() === '') {
        delete result[key];
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      api_information: [
        {
          api_name: "Citizendium",
          description: "Welcome to Citizendium, a wiki for providing free knowledge where authors use their real names. We regard information as a public good and welcome anyone who wants to share their knowledge on virtually any subject.",
          author: "JohnDev19"
        }
      ],
      error: 'An error occurred while fetching the data' 
    });
  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
