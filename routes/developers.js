const express = require("express");
const router = express.Router();
const developerController = require("../controllers/developersController");

router.get("/", developerController.home);
router.get("/new", developerController.createDeveloperGet);
router.post("/new", developerController.createDeveloperPost);
router.get("/:id/edit", developerController.editDeveloperGet);
router.post("/:id/edit", developerController.editDeveloperPost);
router.get("/:id", developerController.show);

module.exports = router;
