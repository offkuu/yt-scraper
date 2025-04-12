const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();

// Konfiguracja CORS (zezwól na połączenia z dowolnej domeny)
app.use(cors()); // Możesz ustawić bardziej specyficznie: app.use(cors({ origin: 'https://twojfrontend.netlify.app' }));

app.use(express.json());

// Scraper endpoint
app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('youtube.com/watch')) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
      return {
        title: document.querySelector('h1.title yt-formatted-string')?.innerText,
        views: document.querySelector('.view-count')?.innerText,
        author: document.querySelector('#text-container yt-formatted-string')?.innerText,
        thumbnail: document.querySelector('link[rel="shortcut icon"]')?.href
      };
    });

    await browser.close();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Scraping failed', details: error.toString() });
  }
});

// Nasłuchuj na porcie
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
