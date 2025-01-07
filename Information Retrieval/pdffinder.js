const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

const fetchPDFLinks = async (find, count = 5) => {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(find)}+filetype:pdf`;

            try {
                const { data } = await axios.get(searchUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                const $ = cheerio.load(data);
                const pdfLinks = [];

                $('.tF2Cxc').each((index, element) => {
                    if (index < count) {
                        const title = $(element).find('.DKV0Md').text() || 'No title found';
                        const url = $(element).find('.yuRUbf a').attr('href') || 'No URL found';
                        const snippet = $(element).find('.VwiC3b').text() || 'No snippet found';

                        pdfLinks.push({ title, url, snippet });
                    }
                });

                return pdfLinks;
            } catch (error) {
                console.error('Error while fetching PDF links:', error);
                return [];
            }
        };

        app.get('/pdf', async (req, res) => {
            try {
                const { find, count } = req.query;

                if (!find) {
                return res.status(400).json({ error: 'Find parameter is required.' });
            }

        const pdfLinks = await fetchPDFLinks(find, count);

        const response = {
            api_name: "PDF Search - The PDF Book Finder API",
            description: "An API to find PDF books based on provided keywords.",
            author: "JohnDev19",
            query: find,
            results_count: pdfLinks.length,
            results: pdfLinks
        };

        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
