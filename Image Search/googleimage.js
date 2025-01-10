// Example:

// With Default Count Results
// -  google/image?search=cat

// With Optional Count Results
// - google/image?search=cat&count=15

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;
const googleImageSearchURL = 'https://images.google.com/search?';
const imageFileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
const defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const defaultFilterOutDomains = ['gstatic.com'];

function containsAnyImageFileExtension(s) {
    const lowercase = s.toLowerCase();
    return imageFileExtensions.some(ext => lowercase.includes(ext));
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

async function searchGoogleImages(opts) {
    let searchTerm;
    let queryStringAddition;
    let filterOutDomains = [...defaultFilterOutDomains];
    let userAgent = defaultUserAgent;

    if (typeof opts === 'string') {
        searchTerm = opts;
    } else {
        searchTerm = opts.searchTerm;
        queryStringAddition = opts.queryStringAddition;
        if (opts.filterOutDomains) {
            filterOutDomains = filterOutDomains.concat(opts.filterOutDomains);
        }
        if (opts.userAgent) {
            userAgent = opts.userAgent;
        }
    }

    let url = `${googleImageSearchURL}tbm=isch&q=${encodeURIComponent(searchTerm)}`;

    if (filterOutDomains) {
        url += encodeURIComponent(' ' + filterOutDomains.map(addSiteExcludePrefix).join(' '));
    }

    if (queryStringAddition) {
        url += queryStringAddition;
    }

    const reqOpts = {
        url,
        headers: { 'User-Agent': userAgent }
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
        return images;
    } catch (error) {
        throw error;
    }
}

app.get('/google/image', async (req, res) => {
    try {
        const { search, count } = req.query;

        if (!search) {
            return res.status(400).send({ error: 'Search parameter is required.' });
        }

        const countValue = Math.min(parseInt(count, 10) || 10, 40);
        const images = await searchGoogleImages({ searchTerm: search });

        res.json({
            api_name: "Google Image Search",
            author: "JohnDev19",
            api_type: "Image Search",
            searchQuery: search,
            count: countValue,
            images: images.slice(0, countValue)
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
