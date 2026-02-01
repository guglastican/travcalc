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

// Helper to clean slug (removes NY, USA, extra hyphens, etc.)
const cleanSlug = (text) => {
  if (!text) return '';
  // Take only the first part before the first comma (usually the city)
  const city = text.split(',')[0].trim();
  return city
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single one
    .replace(/^-|-$/g, ''); // Trim hyphens
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

    const originAddr = response.data.origin_addresses[0];
    const destAddr = response.data.destination_addresses[0];

    const slug = `${cleanSlug(originAddr)}-to-${cleanSlug(destAddr)}`;

    const routeData = {
      origin: originAddr,
      destination: destAddr,
      distance: result.distance.text,
      duration: result.duration.text,
      slug: slug,
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
  const routes = readData(ROUTES_PATH);
  let route = routes.find(r => r.slug === slug);

  if (!route) {
    const parts = slug.split('-to-');
    if (parts.length === 2) {
      const originRaw = parts[0].replace(/-/g, ' ');
      const destRaw = parts[1].replace(/-/g, ' ');

      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
          params: { origins: originRaw, destinations: destRaw, mode: 'driving', units: 'metric', key: process.env.GOOGLE_MAPS_API_KEY }
        });
        const result = response.data?.rows?.[0]?.elements?.[0];
        if (result && result.status === 'OK') {
          const originAddr = response.data.origin_addresses[0];
          const destAddr = response.data.destination_addresses[0];
          const clean = `${cleanSlug(originAddr)}-to-${cleanSlug(destAddr)}`;

          // Redirect to clean slug if current one is messy
          if (slug !== clean) {
            return res.redirect(301, `/udaljenost/${clean}`);
          }

          route = {
            origin: originAddr,
            destination: destAddr,
            distance: result.distance.text,
            duration: result.duration.text,
            slug: clean,
            timestamp: new Date().toISOString()
          };
          saveData(ROUTES_PATH, route);
        }
      } catch (e) { }
    }
  }

  if (!route) return res.status(404).send('Udaljenost nije pronađena.');

  let html = fs.readFileSync(path.join(__dirname, 'distance.html'), 'utf8');
  const title = `Distance from ${route.origin} to ${route.destination}`;
  const description = `Find out the exact distance between ${route.origin} and ${route.destination}. Travel time is approximately ${route.duration}. Driving distance and directions.`;
  const url = `https://www.calculatortrip.com/udaljenost/${route.slug}`;

  // Generate dynamic SEO content
  const dynamicArticle = `
    <article class="dynamic-seo-content" style="margin-top: 40px; padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #eee;">
      <h2>Traveling between ${route.origin} and ${route.destination}</h2>
      <p>Planning a trip from <strong>${route.origin}</strong> to <strong>${route.destination}</strong>? Understanding the travel logistics is key to a smooth journey. Whether you are traveling for business or leisure, knowing the distance and estimated travel time helps you manage your schedule effectively.</p>
      
      <h3>How far is ${route.origin} from ${route.destination}?</h3>
      <p>The total driving distance between these two locations is approximately <strong>${route.distance}</strong>. Depending on traffic conditions, the estimated travel time is about <strong>${route.duration}</strong>. This route connects two vibrant areas, each offering its own unique attractions and atmosphere.</p>

      <h3>Travel Tips for your journey</h3>
      <p>When driving between ${route.origin} and ${route.destination}, it's always a good idea to check for real-time traffic updates. If you are using public transit or other modes of transport, travel times may vary significantly. Make sure to plan for breaks if you are on a long road trip to ensure safety and comfort.</p>
      
      <p>Use our calculator above to explore alternative travel modes like walking, bicycling, or transit if available for this specific route. Safe travels!</p>
    </article>
  `;

  html = html.replace(/<title>.*?<\/title>/, `<title>${title} | Travel Calculator</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);

  // Inject article before the footer or at the end of main
  html = html.replace('</main>', `${dynamicArticle}</main>`);

  // Inject OG Tags and JSON-LD
  const advancedSEO = `
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://www.calculatortrip.com/social-share.jpg">
    <link rel="canonical" href="${url}">
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${title}",
      "description": "${description}",
      "url": "${url}",
      "publisher": {
        "@type": "Organization",
        "name": "Travel Calculator",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.calculatortrip.com/logo.png"
        }
      }
    }
    </script>
  `;

  html = html.replace('</head>', `${advancedSEO}</head>`);
  html = html.replace('</head>', `<script>window.PSEO_DATA = ${JSON.stringify(route)};</script></head>`);
  html = html.replace('</footer>', `${generateFooterLinks()}</footer>`);
  res.send(html);
});

// Places pSEO route
app.get('/places/:slug', async (req, res) => {
  const { slug } = req.params;
  const type = slug.includes('hotels-in-') ? 'hotels' : slug.includes('airports-near-') ? 'airports' : null;
  const city = slug.replace('hotels-in-', '').replace('airports-near-', '').replace(/-/g, ' ');

  if (!type) return res.status(404).send('Invalid place category');

  let html = fs.readFileSync(path.join(__dirname, 'places.html'), 'utf8');
  const title = type === 'hotels' ? `Best Hotels in ${city}` : `Airports near ${city}`;
  const description = type === 'hotels' ? `Find the best rated hotels in ${city}.` : `Locate airports near ${city}.`;

  html = html.replace(/<title>.*?<\/title>/, `<title>${title} | Travel Calculator</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);
  html = html.replace('</head>', `<script>window.PLACES_PSEO = { type: "${type}", city: "${city}", slug: "${slug}" };</script></head>`);
  html = html.replace('</footer>', `${generateFooterLinks()}</footer>`);

  saveData(PLACES_PATH, { slug, city, type, timestamp: new Date().toISOString() });
  res.send(html);
});

// Helper to generate internal links footer
const generateFooterLinks = () => {
  const cities = ["London", "Paris", "New York", "Zagreb", "Belgrade", "Sarajevo", "Berlin", "Rome"];
  const links = cities.map(c => `<li><a href="/turnaround/${cleanSlug(c)}">Turnaround ${c}</a></li>`).join('');
  const hotelLinks = cities.map(c => `<li><a href="/places/hotels-in-${cleanSlug(c)}">Hotels in ${c}</a></li>`).join('');

  return `
    <section class="internal-links" style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #eee; font-size: 0.9em;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <h4>Travel Schedules</h4>
          <ul style="list-style: none; padding: 0;">${links}</ul>
        </div>
        <div>
          <h4>Popular Destinations</h4>
          <ul style="list-style: none; padding: 0;">${hotelLinks}</ul>
        </div>
      </div>
    </section>
  `;
};

// Turnaround pSEO route
app.get('/turnaround/:slug', async (req, res) => {
  const { slug } = req.params;
  const city = slug.replace(/-/g, ' ');

  let html = fs.readFileSync(path.join(__dirname, 'turnaround-time-calculator.html'), 'utf8');
  const title = `Turnaround Time Calculator for ${city}`;
  const description = `Calculate turnaround days and trip schedules for travel to ${city}. Ideal for business and leisure trip planning.`;

  html = html.replace(/<title>.*?<\/title>/, `<title>${title} | Travel Calculator</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);

  // Inject internal links before footer
  const footerLinks = generateFooterLinks();
  html = html.replace('</footer>', `${footerLinks}</footer>`);

  // Inject data to trigger search in turnaround calculator
  html = html.replace('</head>', `<script>window.TURNAROUND_PSEO = { city: "${city}", slug: "${slug}" };</script></head>`);

  res.send(html);
});

// Combined Dynamic Sitemap
app.get('/sitemap-dynamic.xml', (req, res) => {
  const routes = readData(ROUTES_PATH);
  const places = readData(PLACES_PATH);
  const baseUrl = 'https://www.calculatortrip.com';
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Distance routes
  routes.forEach(r => {
    xml += `
  <url>
    <loc>${baseUrl}/udaljenost/${r.slug}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.8</priority>
  </url>`;
  });

  // Places routes
  places.forEach(p => {
    xml += `
  <url>
    <loc>${baseUrl}/places/${p.slug}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
  </url>`;
  });

  // Turnaround routes
  const topCities = ["London", "Paris", "New York", "Zagreb", "Belgrade", "Sarajevo", "Tokyo", "Berlin", "Rome", "Madrid"];
  topCities.forEach(city => {
    xml += `
  <url>
    <loc>${baseUrl}/turnaround/${cleanSlug(city)}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.6</priority>
  </url>`;
  });

  xml += '\n</urlset>';
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('X-Content-Type-Options', 'nosniff');
  res.send(xml.trim());
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
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemaps.org/0.9">
  <sitemap><loc>${baseUrl}/sitemap-main.xml</loc></sitemap>
  <sitemap><loc>${baseUrl}/sitemap-dynamic.xml</loc></sitemap>
</sitemapindex>`.trim();
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('X-Content-Type-Options', 'nosniff');
  res.send(xml);
});

app.get('/sitemap-main.xml', (req, res) => {
  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.sendFile(path.join(__dirname, 'sitemap-main.xml'));
});

// SEEDING LOGIC - Populate some top routes if empty
const seedData = async () => {
  const routes = readData(ROUTES_PATH);
  const places = readData(PLACES_PATH);

  const topCities = ["London", "Paris", "New York", "Zagreb", "Belgrade", "Sarajevo", "Tokyo", "Berlin", "Rome", "Madrid", "Vienna", "Prague", "Budapest", "Ljubljana", "Split", "Dubai", "Singapore", "Sydney", "Toronto", "Istanbul", "Los Angeles", "Chicago", "Miami", "San Francisco", "Amsterdam", "Brussels", "Munich", "Milan", "Barcelona", "Lisbon"];

  // Seed Distance
  if (routes.length < 15) {
    const seeds = [
      { origin: "London", destination: "Paris" },
      { origin: "New York", destination: "Los Angeles" },
      { origin: "Zagreb", destination: "Belgrade" },
      { origin: "Berlin", destination: "Munich" },
      { origin: "Sarajevo", destination: "Zagreb" },
      { origin: "Split", destination: "Zagreb" },
      { origin: "Vienna", destination: "Budapest" },
      { origin: "Rome", destination: "Milan" },
      { origin: "Paris", destination: "Amsterdam" },
      { origin: "New York", destination: "Miami" }
    ];
    seeds.forEach(s => {
      const slug = `${cleanSlug(s.origin)}-to-${cleanSlug(s.destination)}`;
      saveData(ROUTES_PATH, {
        origin: s.origin,
        destination: s.destination,
        distance: "Calculating...",
        duration: "Calculating...",
        slug: slug,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Seed Places
  if (places.length < 20) {
    topCities.forEach(city => {
      const hotelSlug = `hotels-in-${cleanSlug(city)}`;
      const airportSlug = `airports-near-${cleanSlug(city)}`;
      saveData(PLACES_PATH, { slug: hotelSlug, city, type: "hotels", timestamp: new Date().toISOString() });
      saveData(PLACES_PATH, { slug: airportSlug, city, type: "airports", timestamp: new Date().toISOString() });
    });
  }
};
seedData();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
