const express = require("express");
const app = express();
const port = 3000;
const path = require('path');
const homeRoutes = require('./routes/home');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', homeRoutes);

app.listen(port, () => {
  console.log(`Inventory app listening on port ${port}`);
});
