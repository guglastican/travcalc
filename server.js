require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
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
    console.error('API Error Details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    let errorMessage = 'An unexpected error occurred while calculating distance.';
    if (error.response) {
      console.error('Google API Error Response Data:', error.response.data);
      console.error('Google API Error Response Status:', error.response.status);
      errorMessage = error.response.data?.error_message || error.response.data?.message || (error.response.data?.status ? `Google Maps API Error: ${error.response.data.status}` : errorMessage);
    } else if (error.request) {
      console.error('Google API No Response:', error.request);
      errorMessage = 'No response received from Google Maps API. Check server connectivity and API key quotas.';
    } else {
      console.error('Google API Request Setup Error:', error.message);
      errorMessage = error.message || errorMessage;
    }
    res.status(500).json({ error: errorMessage });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/distance.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'distance.html'));
});

app.get('/calculator.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'calculator.html'));
});

// Blog routes
app.get('/blog.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'blog.html'));
});

// Post routes (support both with and without .html extension)
app.get('/flying-vs-driving', (req, res) => {
  res.sendFile(path.join(__dirname, 'posts/flying-vs-driving.html'));
});

app.get('/flying-vs-driving.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'posts/flying-vs-driving.html'));
});

app.get('/road-trip-tips', (req, res) => {
  res.sendFile(path.join(__dirname, 'posts/road-trip-tips.html'));
});

app.get('/road-trip-tips.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'posts/road-trip-tips.html'));
});

// Keep old /posts/ routes for backward compatibility
app.get('/posts/:postname', (req, res) => {
  res.sendFile(path.join(__dirname, 'posts', `${req.params.postname}.html`));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}. Handles API and HTML serving.`);
});
