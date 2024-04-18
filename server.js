// If you want to test on your local machine:
// - Assign your service account key to the GOOGLE_APPLICATION_CREDENTIALS env variable


// server.js
const express = require('express');
const { Storage } = require('@google-cloud/storage');

const app = express();
const storage = new Storage();
const bucketName = 'bootlegmp3database';

// Serve static files
app.use(express.static('public'));

// Endpoint to get signed URLs for your songs
app.get('/api/songs', async (req, res) => {
    try {
        const [files] = await storage.bucket(bucketName).getFiles();
        const content = files.reduce((acc, file) => {
            const parts = file.name.split('/');
            if (parts.length === 2) { // Ensure file is directly under a "folder"
                const [folder, fileName] = parts;
                if (!acc[folder]) acc[folder] = [];
                acc[folder].push({ name: fileName, path: file.name });
            }
            return acc;
        }, {});

        const songs = await Promise.all(
            Object.entries(content).map(async ([folder, files]) => {
                const fileDetails = await Promise.all(files.map(async ({ name, path }) => {
                    const [url] = await storage.bucket(bucketName).file(path).getSignedUrl({
                        version: 'v4',
                        action: 'read',
                        expires: Date.now() + 1* 60 * 60 * 1000, // 1 Hour Expiry for the URL's
                    });
                    return { name, url };
                }));
                return { folder, songs: fileDetails };
            })
        );

        res.json(songs);
    } catch (error) {
        console.error('Failed to list songs by folder:', error);
        res.status(500).send('Error fetching song list by folder');
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
