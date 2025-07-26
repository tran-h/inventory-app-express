const express = require("express");
const app = express();
const port = 3000;
const homeRoutes = require('./routes/home');

app.set('view engine', 'ejs');

app.use('/', homeRoutes);

app.listen(port, () => {
  console.log(`Inventory app listening on port ${port}`);
});
