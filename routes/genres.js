const express = require("express");
const router = express.Router();
const genreController = require("../controllers/genresController");

router.get("/", genreController.home);

module.exports = router;
