import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--single-process',
    '--disable-extensions',
    '--remote-debugging-port=9222'
  ],
  executablePath: process.env.CHROME_BIN || puppeteer.executablePath(),
});


const app = express();

// Konfiguracja CORS
app.use(cors());
app.use(express.json());

// Endpoint ping
app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Backend is up and running!' });
});

// Endpoint scrape
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

// Nasłuchujemy na porcie, który Heroku przypisuje dynamicznie
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
