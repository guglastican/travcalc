require('dotenv').config();
const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

const ROUTES_PATH = path.join(__dirname, 'data', 'routes.json');
const PLACES_PATH = path.join(__dirname, 'data', 'places.json');

const migrate = async () => {
  if (!process.env.POSTGRES_URL) {
    console.error("No POSTGRES_URL environment variable found. Set it in .env to run this script.");
    return;
  }

  console.log("Initializing tables in Neon DB...");
  await sql`
    CREATE TABLE IF NOT EXISTS routes (
      slug VARCHAR(255) PRIMARY KEY,
      origin VARCHAR(255),
      destination VARCHAR(255),
      distance VARCHAR(50),
      duration VARCHAR(50),
      timestamp TIMESTAMP
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS places (
      slug VARCHAR(255) PRIMARY KEY,
      city VARCHAR(255),
      type VARCHAR(50),
      timestamp TIMESTAMP
    );
  `;

  console.log("Tables created/verified.");

  try {
    const routes = JSON.parse(fs.readFileSync(ROUTES_PATH, 'utf8') || '[]');
    console.log(`Migrating ${routes.length} routes...`);
    for (const r of routes) {
      await sql`
        INSERT INTO routes (slug, origin, destination, distance, duration, timestamp)
        VALUES (${r.slug}, ${r.origin}, ${r.destination}, ${r.distance}, ${r.duration}, ${r.timestamp})
        ON CONFLICT (slug) DO NOTHING;
      `;
    }

    const places = JSON.parse(fs.readFileSync(PLACES_PATH, 'utf8') || '[]');
    console.log(`Migrating ${places.length} places...`);
    for (const p of places) {
      await sql`
        INSERT INTO places (slug, city, type, timestamp)
        VALUES (${p.slug}, ${p.city}, ${p.type}, ${p.timestamp})
        ON CONFLICT (slug) DO NOTHING;
      `;
    }

    console.log("Migration to Neon Database complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
