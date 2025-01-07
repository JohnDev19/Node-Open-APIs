const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

const goImageExtensions = ['.jpg', '.jpeg', '.png'];

function containsAnyImageFileExtension(s) {
    const lowercase = s.toLowerCase();
    return goImageExtensions.some(ext => lowercase.includes(ext));
}

function addSiteExcludePrefix(s) {
    return '-site:' + s;
}

function collectImageRefs(content, filterOutDomains) {
    const refs = [];
    const re = /\["(http.+?)",(\d+),(\d+)\]/g;
    let result;
    while ((result = re.exec(content)) !== null) {
        if (result.length > 3) {
            let ref = {
                url: result[1],
                width: +result[3],
                height: +result[2]
            };
            if (domainIsOK(ref.url, filterOutDomains)) {
                refs.push(ref);
            }
        }
    }
    return refs;
}

function domainIsOK(url, filterOutDomains) {
    return filterOutDomains.every(skipDomain => url.indexOf(skipDomain) === -1);
}

async function searchGoogleImages(searchTerm, countValue) {
    const googleImageSearchURL = 'https://www.google.com/search?tbm=isch&q=';
    const defaultFilterOutDomains = ['pinterest.com', 'instagram.com'];
    const defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

    let url = `${googleImageSearchURL}${encodeURIComponent(searchTerm)}`;
    const filterOutDomains = defaultFilterOutDomains;

    if (filterOutDomains) {
        url += encodeURIComponent(' ' + filterOutDomains.map(addSiteExcludePrefix).join(' '));
    }

    const reqOpts = {
        url,
        headers: { 'User-Agent': defaultUserAgent }
    };

    try {
        const { data } = await axios(reqOpts);
        const $ = cheerio.load(data);
        const scripts = $('script');
        const scriptContents = [];

        scripts.each((i, script) => {
            if (script.children.length > 0) {
                const content = script.children[0].data;
                if (containsAnyImageFileExtension(content)) {
                    scriptContents.push(content);
                }
            }
        });

        const images = scriptContents.flatMap(content => collectImageRefs(content, filterOutDomains));
        const filteredImages = images.filter(image => !image.url.includes('encrypted-tbn0.gstatic.com'));
        return filteredImages.slice(0, countValue);
    } catch (error) {
        throw error;
    }
}

app.get('/googlesearch/:search', async (req, res) => {
    try {
        const { search } = req.params;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(search)}&gl=us&hl=en&ie=UTF-8`;
        const wikipediaUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(search)}`;

        const googleResponse = await axios.get(googleUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(googleResponse.data);

        const api_info = {
            api_name: "Google Search",
            description: "Search the world's information, including webpages, images, videos and more. Google has many special features to help you find exactly what you're looking for.",
            author: "JohnDev19"
        };

        const searches = [];
        $('.g').each((i, element) => {
            if (searches.length >= 6) return false; // 6 results

            const titleElement = $(element).find('h3');
            const title = titleElement.text().trim();
            const url = $(element).find('a').first().attr('href');
            const descriptionElement = $(element).find('.VwiC3b');
            const description = descriptionElement.text().trim();

            if (title && url && description) {
                searches.push({ title, description, url });
            }
        });

        const wikipediaResponse = await axios.get(wikipediaUrl);
        const wikiData = wikipediaResponse.data.query.pages;
        const wikiPageId = Object.keys(wikiData)[0];
        const wikiExtract = wikiData[wikiPageId].extract;

        const images = await searchGoogleImages(search, 10);

        const result = {
            api_info: api_info,
            search_metadata: {
                id: `search_${Math.random().toString(36).substr(2, 9)}`,
                status: "Success",
                created_at: new Date().toISOString(),
                request_url: googleUrl,
            },
            search_parameters: {
                engine: "google",
                q: search,
                device: "desktop",
                google_domain: "google.com",
                hl: "en",
                gl: "us"
            },
            search_information: {
                query_displayed: $('input[name="q"]').val(),
                total_results: parseInt($('#result-stats').text().match(/[\d,]+/)[0].replace(/,/g, '')),
                time_taken_displayed: parseFloat($('#result-stats').text().match(/(\d+\.\d+) seconds/)[1])
            },
            searches: searches,
            knowledge_graph: {
                title: search,
                type: "Search Result",
                description: wikiExtract || "No description available",
                images: images.map(image => image.url)
            }
        };

        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
