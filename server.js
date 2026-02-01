require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.static(__dirname));
app.use((req, res, next) => {
  if (req.url.endsWith('.xml')) {
    res.type('application/xml');
  }
  next();
});
app.use(express.json());

const ROUTES_PATH = path.join(__dirname, 'data', 'routes.json');
const PLACES_PATH = path.join(__dirname, 'data', 'places.json');

// Helper to read data
const readData = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

// Helper to save data
const saveData = (filePath, item) => {
  try {
    const data = readData(filePath);
    if (!data.find(r => r.slug === item.slug)) {
      data.push(item);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error(`Error saving to ${filePath}:`, error);
  }
};

// Distance Matrix API endpoint
app.post('/api/calculate-distance', async (req, res) => {
  try {
    const { origin, destination, mode, units } = req.body;
    if (!origin || !destination) return res.status(400).json({ error: 'Locations required' });

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: { origins: origin, destinations: destination, mode: mode || 'driving', units: units || 'metric', key: process.env.GOOGLE_MAPS_API_KEY }
    });

    if (response.data.status !== 'OK') throw new Error(response.data.error_message || 'API Error');

    const result = response.data?.rows?.[0]?.elements?.[0];
    if (!result || result.status !== 'OK') throw new Error('Route not found');

    const routeData = {
      origin: response.data.origin_addresses[0],
      destination: response.data.destination_addresses[0],
      distance: result.distance.text,
      duration: result.duration.text,
      slug: `${response.data.origin_addresses[0].toLowerCase().replace(/[^a-z0-9]/g, '-')}-to-${response.data.destination_addresses[0].toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      timestamp: new Date().toISOString()
    };

    saveData(ROUTES_PATH, routeData);
    res.json(routeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Distance pSEO route
app.get('/udaljenost/:slug', async (req, res) => {
  const { slug } = req.params;
  let route = readData(ROUTES_PATH).find(r => r.slug === slug);

  if (!route) {
    const parts = slug.split('-to-');
    if (parts.length === 2) {
      const origin = parts[0].replace(/-/g, ' ');
      const destination = parts[1].replace(/-/g, ' ');
      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
          params: { origins: origin, destinations: destination, mode: 'driving', units: 'metric', key: process.env.GOOGLE_MAPS_API_KEY }
        });
        const result = response.data?.rows?.[0]?.elements?.[0];
        if (result && result.status === 'OK') {
          route = {
            origin: response.data.origin_addresses[0],
            destination: response.data.destination_addresses[0],
            distance: result.distance.text,
            duration: result.duration.text,
            slug,
            timestamp: new Date().toISOString()
          };
          saveData(ROUTES_PATH, route);
        }
      } catch (e) { }
    }
  }

  if (!route) return res.status(404).send('Ruta nije pronađena.');

  let html = fs.readFileSync(path.join(__dirname, 'distance.html'), 'utf8');
  const title = `Distance from ${route.origin} to ${route.destination}`;
  const description = `The distance between ${route.origin} and ${route.destination} is ${route.distance}. Travel time is approx ${route.duration}.`;

  html = html.replace(/<title>.*?<\/title>/, `<title>${title} | Travel Calculator</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);
  html = html.replace('</head>', `<script>window.PSEO_DATA = ${JSON.stringify(route)};</script></head>`);
  res.send(html);
});

// Places pSEO route
app.get('/places/:slug', async (req, res) => {
  const { slug } = req.params;
  // slug format: hotels-in-paris or airports-near-london
  const type = slug.includes('hotels-in-') ? 'hotels' : slug.includes('airports-near-') ? 'airports' : null;
  const city = slug.replace('hotels-in-', '').replace('airports-near-', '').replace(/-/g, ' ');

  if (!type) return res.status(404).send('Invalid place category');

  let html = fs.readFileSync(path.join(__dirname, 'places.html'), 'utf8');
  const title = type === 'hotels' ? `Best Hotels in ${city}` : `Airports near ${city}`;
  const description = type === 'hotels' ? `Find the best rated hotels in ${city} with our Travel Calculator tool.` : `Locate international and local airports near ${city}.`;

  html = html.replace(/<title>.*?<\/title>/, `<title>${title} | Travel Calculator</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);

  // Inject data for the frontend to pick up and trigger search
  html = html.replace('</head>', `
    <script>
      window.PLACES_PSEO = { type: "${type}", city: "${city}", slug: "${slug}" };
    </script>
  </head>`);

  // Log to places.json for sitemap
  saveData(PLACES_PATH, { slug, city, type, timestamp: new Date().toISOString() });

  res.send(html);
});

// Combined Dynamic Sitemap
app.get('/sitemap-dynamic.xml', (req, res) => {
  const routes = readData(ROUTES_PATH);
  const places = readData(PLACES_PATH);
  const baseUrl = 'https://www.calculatortrip.com';

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  routes.forEach(r => {
    xml += `\n  <url><loc>${baseUrl}/udaljenost/${r.slug}</loc><priority>0.8</priority></url>`;
  });
  places.forEach(p => {
    xml += `\n  <url><loc>${baseUrl}/places/${p.slug}</loc><priority>0.7</priority></url>`;
  });

  xml += '\n</urlset>';
  res.type('application/xml').send(xml);
});

// Popular Routes API
app.get('/api/popular-routes', (req, res) => {
  res.json(readData(ROUTES_PATH).slice(-12).reverse());
});

// Redirects and Static serving
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/distance', (req, res) => res.sendFile(path.join(__dirname, 'distance.html')));
app.get('/turnaround-time-calculator', (req, res) => res.sendFile(path.join(__dirname, 'turnaround-time-calculator.html')));
app.get('/places', (req, res) => res.sendFile(path.join(__dirname, 'places.html')));

const pages = ['about', 'privacy', 'terms', 'contact'];
pages.forEach(p => app.get(`/${p}`, (req, res) => res.sendFile(path.join(__dirname, `${p}.html`))));

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = 'https://www.calculatortrip.com';
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemaps.org/0.9">
  <sitemap><loc>${baseUrl}/sitemap-main.xml</loc></sitemap>
  <sitemap><loc>${baseUrl}/sitemap-dynamic.xml</loc></sitemap>
</sitemapindex>`);
});

app.get('/sitemap-main.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap-main.xml')));

// SEEDING LOGIC - Populate some top routes if empty
const seedData = async () => {
  const routes = readData(ROUTES_PATH);
  const places = readData(PLACES_PATH);

  const topCities = ["London", "Paris", "New York", "Zagreb", "Belgrade", "Sarajevo", "Tokyo", "Berlin", "Rome", "Madrid", "Vienna", "Prague", "Budapest", "Ljubljana", "Split", "Dubai", "Singapore", "Sydney", "Toronto", "Istanbul"];

  // Seed Distance
  if (routes.length < 10) {
    const seeds = [
      { origin: "London", destination: "Paris" },
      { origin: "New York", destination: "Los Angeles" },
      { origin: "Zagreb", destination: "Belgrade" },
      { origin: "Berlin", destination: "Munich" },
      { origin: "Sarajevo", destination: "Zagreb" },
      { origin: "Split", destination: "Zagreb" },
      { origin: "Vienna", destination: "Budapest" },
      { origin: "Rome", destination: "Milan" }
    ];
    seeds.forEach(s => {
      const slug = `${s.origin.toLowerCase().replace(/[^a-z0-9]/g, '-')}-to-${s.destination.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      saveData(ROUTES_PATH, { ...s, distance: "Calculating...", duration: "Calculating...", slug, timestamp: new Date().toISOString() });
    });
  }

  // Seed Places
  if (places.length < 10) {
    topCities.forEach(city => {
      const hotelSlug = `hotels-in-${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const airportSlug = `airports-near-${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      saveData(PLACES_PATH, { slug: hotelSlug, city, type: "hotels", timestamp: new Date().toISOString() });
      saveData(PLACES_PATH, { slug: airportSlug, city, type: "airports", timestamp: new Date().toISOString() });
    });
  }
};
seedData();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
