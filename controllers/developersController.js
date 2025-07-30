const db = require("../db");
const { body, validationResult } = require("express-validator");

exports.home = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM developers ORDER BY name");
    res.render("developers/index", { developers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading list of developers");
  }
};

exports.show = async (req, res) => {
  try {
    let developer_id = req.params.id;
    const developer = await db.query(
      "SELECT * FROM developers WHERE developer_id = $1",
      [developer_id]
    );
    res.render("developers/show", { developer: developer.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading selected developer");
  }
};

exports.createDeveloperGet = (req, res) => {
  try {
    res.render("developers/new", {
      title: "Create Developer",
      developer: {},
      errors: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading form to create developer");
  }
};

exports.createDeveloperPost = [
  body("name", "Developer name is required")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("country").optional({ checkFalsy: true }).trim().escape(),

  (req, res) => {
    const errors = validationResult(req);
    const developer = {
      name: req.body.name,
      country: req.body.country || null,
    };

    if (!errors.isEmpty()) {
      return res.render("developers/new", {
        title: "Create Developer",
        developer,
        errors: errors.array(),
      });
    }

    const result = db.query(
      "INSERT INTO developers (name, country) VALUES ($1, $2)",
      [developer.name, developer.country]
    );
    res.redirect("/developers/");
  },
];
