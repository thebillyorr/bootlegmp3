// If you want to test on your local machine:
// - Assign your service account key to the GOOGLE_APPLICATION_CREDENTIALS env variable
//   (or use `gcloud auth application-default login`). Note: signing URLs locally
//   requires a service account; on App Engine the default SA signs automatically.

// server.js
const express = require('express');
const { Storage } = require('@google-cloud/storage');

const app = express();
const storage = new Storage();

const AUDIO_BUCKET = 'bootlegmp3database';
const COVER_BASE = 'https://storage.googleapis.com/bootlegmp3bucket/albumCovers';
const SIGNED_URL_TTL_MS = 60 * 60 * 1000; // 1 hour
const ALBUM_CACHE_TTL_MS = 10 * 60 * 1000; // re-list the bucket at most every 10 min

// Serve static files
app.use(express.static('public'));

// --- Album listing cache -----------------------------------------------------
// Listing the bucket on every request is wasteful, so cache the grouped result.
let albumCache = { data: null, expires: 0 };

// Dev-only: lets us preview the UI locally without Cloud credentials.
// Enabled with MP3_MOCK=1; never set in production (App Engine).
function mockAlbums() {
  const folders = ['lycorisrecoil', 'apothecary', 'aonohako', 'medalist', 'kaoruhana'];
  return folders.map((folder) => ({
    folder,
    cover: `${COVER_BASE}/${folder}.jpeg`,
    tracks: Array.from({ length: 8 }, (_, i) => ({
      name: `track ${String(i + 1).padStart(2, '0')}`,
      path: `${folder}/track-${i + 1}`,
    })),
  }));
}

async function listAlbums() {
  if (process.env.MP3_MOCK === '1') return mockAlbums();

  const now = Date.now();
  if (albumCache.data && now < albumCache.expires) {
    return albumCache.data;
  }

  const [files] = await storage.bucket(AUDIO_BUCKET).getFiles();

  // Group files by their top-level "folder" (album). Skip the zero-byte folder
  // placeholder objects (their name ends with "/").
  const byFolder = files.reduce((acc, file) => {
    const parts = file.name.split('/');
    if (parts.length === 2 && parts[1] !== '') {
      const [folder, fileName] = parts;
      (acc[folder] ||= []).push({ name: fileName, path: file.name });
    }
    return acc;
  }, {});

  const albums = Object.entries(byFolder).map(([folder, tracks]) => ({
    folder,
    cover: `${COVER_BASE}/${folder}.jpeg`,
    tracks, // { name, path } — NOT signed; we sign on play
  }));

  albumCache = { data: albums, expires: now + ALBUM_CACHE_TTL_MS };
  return albums;
}

// Track listing — fast, no signed URLs generated up front.
app.get('/api/albums', async (req, res) => {
  try {
    res.json(await listAlbums());
  } catch (error) {
    console.error('Failed to list albums:', error);
    res.status(500).send('Error fetching album list');
  }
});

// Sign a single track URL on demand, the moment a user presses play.
app.get('/api/track', async (req, res) => {
  try {
    const path = String(req.query.path || '');

    // Safety: the path must be a real "folder/file" key in our bucket and must
    // not try to traverse out of it.
    if (!path || path.includes('..') || path.split('/').length !== 2) {
      return res.status(400).send('Invalid track path');
    }

    const [url] = await storage
      .bucket(AUDIO_BUCKET)
      .file(path)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + SIGNED_URL_TTL_MS,
      });

    // Tell intermediaries not to cache the signed URL beyond its lifetime.
    res.set('Cache-Control', 'private, no-store');
    res.json({ url });
  } catch (error) {
    console.error('Failed to sign track URL:', error);
    res.status(500).send('Error signing track');
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
