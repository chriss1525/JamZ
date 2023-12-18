// root of my JamZ application

// server.js

const express = require('express');
const routes = require('./routes/index');

require('dotenv').config();
const app = express();
const port = 3000;

app.use(routes);
app.get('/', (req, res) => res.send('Jamz is running!'));
app.get('/api/', (req, res) => res.send('Jamz API is running!'));

app.listen(port, () => console.log(`Server listening on port ${port}!`));

