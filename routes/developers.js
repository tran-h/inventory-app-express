const express = require("express");
const router = express.Router();
const developerController = require("../controllers/developersController");

router.get("/", developerController.home);
router.get("/new", developerController.createDeveloperGet);
router.post("/new", developerController.createDeveloperPost);
router.get("/:id", developerController.show);

module.exports = router;
