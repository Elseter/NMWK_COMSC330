// index.js 
// MAIN control file for backend 

const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/api');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

app.use(bodyParser.json());

app.use('/api', routes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
