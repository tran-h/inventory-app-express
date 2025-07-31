const express = require("express");
const router = express.Router();
const genreController = require("../controllers/genresController");

router.get("/", genreController.home);
router.get("/new", genreController.createGenreGet);
router.post("/new", genreController.createGenrePost);
router.get("/:id/edit", genreController.editGenreGet);
router.post("/:id/edit", genreController.editGenrePost);
router.get("/:id", genreController.show);

module.exports = router;
