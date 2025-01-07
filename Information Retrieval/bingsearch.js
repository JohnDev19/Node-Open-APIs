const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

const bingSearchURL = 'https://www.bing.com/search';

async function fetchSearchResults(query) {
    try {
        const response = await axios.get(bingSearchURL, {
            params: {
                q: query,
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const searchResults = [];

        $('li.b_algo').each((index, element) => {
            const title = $(element).find('h2').text();
            let description = $(element).find('.b_caption p').text();
            const url = $(element).find('h2 a').attr('href');

            description = description.replace(/WEB/g, '');

            searchResults.push({ title: title, description: description.trim(), url: url });
        });

        return searchResults.slice(0, 10);
    } catch (error) {
        throw new Error('Error fetching search results from Bing.');
    }
}

app.get('/bing-search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).send({ error: 'Query parameter is required.' });
        }

        const searchResults = await fetchSearchResults(q);

        res.json({ 
            query: q, 
            count: searchResults.length, 
            name: "Bing Search", 
            description: "Bing helps you turn information into action, making it faster and easier to go from searching to doing.", 
            author: "JohnDev19", 
            searchResults: searchResults });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
