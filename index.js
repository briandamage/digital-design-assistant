// server.js

// 1. Import Express Module
const express = require('express');

// 2. Create an Express application instance
const app = express();

// 3. Define the port the server will listen on
// Use the environment variable PORT if available (common for deployment),
// otherwise default to 3000
const PORT = process.env.PORT || 3000;


// 4. Statische Dateien aus /public bereitstellen
app.use(express.static('public'));

// 4. Define a simple route for the homepage (GET request to '/')
app.get('/', (req, res) => {
  // req: request object (contains information about the incoming request)
  // res: response object (used to send a response back to the client)
  res.status(200).send('Hello World! This is my first Express app.');
});

// 5. Define another example route
app.get('/about', (req, res) => {
  res.send('This is the About page.');
});

// 6. Make the server listen on the defined port
app.listen(PORT, () => {
  console.log(`Server is running and listening on http://localhost:${PORT}`);
});
