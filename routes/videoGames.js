const express = require("express");
const router = express.Router();
const gameController = require("../controllers/videoGamesController");

router.get("/", gameController.home);
router.get("/new", gameController.createGameGet);
router.post("/new", gameController.createGamePost);
router.get("/:id/edit", gameController.editGameGet);
router.post("/:id/edit", gameController.editGamePost);
router.get("/:id", gameController.show);

module.exports = router;
