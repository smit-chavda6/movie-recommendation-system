const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

// OMDb API key
const OMDB_API_KEY = '5f43212a';

// Google API (commented for future use)
// const GOOGLE_API_KEY = 'AIzaSyBGlIY24D6k5xrdCGHI_XEdpkiy-FyrPmE';
// const GOOGLE_CSE_ID = 'd65bfc0d1e48e4676';

// Simple in-memory cache for image URLs
const imageCache = {};

app.get('/', (req, res) => {
  res.send('Backend is running! Use /get-movie-image?title=MovieName');
});

app.get('/get-movie-image', async (req, res) => {
  const title = req.query.title;
  if (!title) {
    return res.status(400).json({ error: 'No title provided' });
  }
  // Check cache first
  if (imageCache[title]) {
    return res.json({ image_url: imageCache[title] });
  }
  try {
    // OMDb API usage
    const omdbUrl = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}`;
    const response = await axios.get(omdbUrl);
    const data = response.data;
    if (data.Poster && data.Poster !== 'N/A') {
      imageCache[title] = data.Poster; // Cache the result
      res.json({ image_url: data.Poster });
    } else {
      res.status(404).json({ error: 'No image found' });
    }

    // Google Custom Search fallback (commented for now)
    /*
    const params = {
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CSE_ID,
      q: `${title} movie poster`,
      searchType: 'image',
      num: 1,
      imgType: 'photo',
    };
    const googleResponse = await axios.get('https://www.googleapis.com/customsearch/v1', { params });
    const googleData = googleResponse.data;
    if (googleData.items && googleData.items.length > 0) {
      const image_url = `/proxy-image?url=${encodeURIComponent(googleData.items[0].link)}`;
      imageCache[title] = image_url; // Cache the result
      res.json({ image_url });
    } else {
      res.status(404).json({ error: 'No image found' });
    }
    */
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch image', details: error.message });
  }
});

app.get('/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send('No image URL provided');
  }
  try {
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Failed to fetch image');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 