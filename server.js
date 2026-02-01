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

// Helper to read routes
const getRoutes = () => {
  try {
    if (!fs.existsSync(ROUTES_PATH)) {
      return [];
    }
    const data = fs.readFileSync(ROUTES_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading routes:', error);
    return [];
  }
};

// Helper to save routes
const saveRoute = (route) => {
  try {
    const routes = getRoutes();
    // Check if route already exists
    if (!routes.find(r => r.slug === route.slug)) {
      routes.push(route);
      fs.writeFileSync(ROUTES_PATH, JSON.stringify(routes, null, 2));
    }
  } catch (error) {
    console.error('Error saving route:', error);
  }
};

// Distance Matrix API endpoint (updated to save to DB)
app.post('/api/calculate-distance', async (req, res) => {
  try {
    const { origin, destination, mode, units } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: origin,
        destinations: destination,
        mode: mode || 'driving',
        units: units || 'metric', // Changed default to metric
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(response.data.error_message || 'Failed to calculate distance');
    }

    const result = response.data?.rows?.[0]?.elements?.[0];
    if (!result || result.status !== 'OK') {
      throw new Error('No valid route found between locations');
    }

    const originAddr = response.data?.origin_addresses?.[0] || origin;
    const destAddr = response.data?.destination_addresses?.[0] || destination;
    const distanceTxt = result.distance?.text || 'Unknown distance';
    const durationTxt = result.duration?.text || 'Unknown duration';

    const slug = `${originAddr.toLowerCase().replace(/[^a-z0-9]/g, '-')}-to-${destAddr.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const routeData = {
      origin: originAddr,
      destination: destAddr,
      distance: distanceTxt,
      duration: durationTxt,
      slug: slug,
      timestamp: new Date().toISOString()
    };

    saveRoute(routeData);

    res.json(routeData);
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Programmatic SEO route
app.get('/udaljenost/:slug', async (req, res) => {
  const { slug } = req.params;
  const routes = getRoutes();
  let route = routes.find(r => r.slug === slug);

  if (!route) {
    // Attempt to calculate on-the-fly
    const parts = slug.split('-to-');
    if (parts.length === 2) {
      const origin = parts[0].replace(/-/g, ' ');
      const destination = parts[1].replace(/-/g, ' ');

      console.log(`Route not found in DB. Calculating on-the-fly for: ${origin} to ${destination}`);

      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
          params: {
            origins: origin,
            destinations: destination,
            mode: 'driving',
            units: 'metric',
            key: process.env.GOOGLE_MAPS_API_KEY
          }
        });

        if (response.data.status === 'OK') {
          const result = response.data?.rows?.[0]?.elements?.[0];
          if (result && result.status === 'OK') {
            const originAddr = response.data?.origin_addresses?.[0] || origin;
            const destAddr = response.data?.destination_addresses?.[0] || destination;

            route = {
              origin: originAddr,
              destination: destAddr,
              distance: result.distance?.text || 'Unknown',
              duration: result.duration?.text || 'Unknown',
              slug: slug,
              timestamp: new Date().toISOString()
            };

            saveRoute(route);
          }
        }
      } catch (error) {
        console.error('Error calculating route on-the-fly:', error.message);
      }
    }
  }

  // Load and inject into distance.html
  try {
    let html = fs.readFileSync(path.join(__dirname, 'distance.html'), 'utf8');

    // Simple template injection
    const title = `Distance from ${route.origin} to ${route.destination}`;
    const description = `Find out the exact distance between ${route.origin} and ${route.destination}. Travel time is approximately ${route.duration}. Driving distance and directions.`;
    const url = `https://www.calculatortrip.com/udaljenost/${route.slug}`;

    html = html.replace(/<title>.*?<\/title>/, `<title>${title} | Travel Calculator</title>`);
    html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);

    // Inject OG Tags and JSON-LD
    const advancedSEO = `
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:url" content="${url}">
      <meta property="og:type" content="website">
      <meta name="twitter:card" content="summary_large_image">
      
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Distance",
        "name": "${title}",
        "description": "${description}",
        "url": "${url}",
        "origin": {
          "@type": "Place",
          "name": "${route.origin}"
        },
        "destination": {
          "@type": "Place",
          "name": "${route.destination}"
        },
        "distance": "${route.distance}"
      }
      </script>

      <script>
        window.PSEO_DATA = ${JSON.stringify(route)};
      </script>
    `;
    html = html.replace('</head>', `${advancedSEO}</head>`);

    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading page');
  }
});

// Dynamic Sitemap
app.get('/sitemap-dynamic.xml', (req, res) => {
  const routes = getRoutes();
  const baseUrl = 'https://www.calculatortrip.com'; // Change to actual domain if needed

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
  </url>`;

  routes.forEach(route => {
    xml += `
  <url>
    <loc>${baseUrl}/udaljenost/${route.slug}</loc>
    <lastmod>${route.timestamp ? route.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.8</priority>
  </url>`;
  });

  xml += '\n</urlset>';
  res.type('application/xml');
  res.send(xml);
});

// Popular Routes API
app.get('/api/popular-routes', (req, res) => {
  const routes = getRoutes().slice(-10).reverse(); // Last 10 searches
  res.json(routes);
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.redirect(301, '/');
});

app.get('/distance', (req, res) => {
  res.sendFile(path.join(__dirname, 'distance.html'));
});

app.get('/distance.html', (req, res) => {
  res.redirect(301, '/distance');
});

// Footer page routes (clean URLs)
const pages = ['about', 'privacy', 'terms', 'contact', 'turnaround-time-calculator', 'places'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, `${page}.html`));
  });
});

// Sitemap routes (Index of all sitemaps)
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = 'https://www.calculatortrip.com';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemaps.org/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-main.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-dynamic.xml</loc>
  </sitemap>
</sitemapindex>`;
  res.type('application/xml');
  res.send(xml);
});

app.get('/sitemap-main.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'sitemap-main.xml'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}. Handling API, pSEO, and HTML.`);
});
