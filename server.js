require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: true
}));

app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Private-Network', 'true');
  res.sendStatus(200);
});
app.use(express.json());

// Distance Matrix API endpoint
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
        units: units || 'imperial',
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

    res.json({
      origin: response.data?.origin_addresses?.[0] || 'Unknown origin',
      destination: response.data?.destination_addresses?.[0] || 'Unknown destination',
      distance: result.distance?.text || 'Unknown distance',
      duration: result.duration?.text || 'Unknown duration',
      status: response.data?.status || 'UNKNOWN_ERROR'
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
