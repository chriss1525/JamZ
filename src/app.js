// root of my JamZ application

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.get('/', (req, res) => {
  res.send('JamZ is running');
});

// listen
app.listen(port, () => {
  console.log(`JamZ is listening on port ${port}`);
});
