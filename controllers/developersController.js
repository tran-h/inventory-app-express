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

exports.editDeveloperGet = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query(
      "SELECT * FROM developers WHERE developer_id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("Developer not found");
    }
    res.render("developers/edit", {
      title: "Edit Developer",
      developer: result.rows[0],
      errors: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading edit developer form");
  }
};

exports.editDeveloperPost = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Developer name is required")
    .custom(async (value, { req }) => {
      const id = req.params.id;
      const result = await db.query(
        "SELECT * FROM developers WHERE name = $1 AND developer_id != $2",
        [value, id]
      );

      if (result.rows.length > 0) {
        throw new Error("Another developer with that name already exists.");
      }

      return true;
    }),
  body("country").trim(),

  async (req, res) => {
    const id = req.params.id;
    const errors = validationResult(req);

    const developer = {
      developer_id: id,
      name: req.body.name.trim(),
      country: req.body.country.trim(),
    };

    if (!errors.isEmpty()) {
      return res.render("developers/edit", {
        title: "Edit developer",
        developer,
        errors: errors.array(),
      });
    }

    try {
      await db.query(
        "UPDATE developers SET name = $1 WHERE developer_id = $2",
        [developer.name, id]
      );
      await db.query(
        "UPDATE developers SET country = $1 WHERE developer_id = $2",
        [developer.country, id]
      );
      res.redirect(`/developers/${id}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error editing developer");
    }
  },
];

exports.deleteDeveloperGet = async (req, res) => {
  const id = req.params.id;

  try {
    const [developerResult, gameResult] = await Promise.all([
      db.query("SELECT * FROM developers WHERE developer_id = $1", [id]),
      db.query(
        `
        SELECT vg.game_id, vg.title
        FROM video_games vg
        JOIN game_developers gd ON vg.game_id = gd.game_id
        WHERE gd.developer_id = $1
      `,
        [id]
      ),
    ]);

    if (developerResult.rows.length === 0) {
      return res.status(404).send("Developer not found");
    }

    res.render("developers/delete", {
      title: "Delete Developer",
      developer: developerResult.rows[0],
      associatedGames: gameResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error getting developer(s)/game(s) to delete");
  }
};

exports.deleteDeveloperPost = async (req, res) => {
  const id = req.params.id;

  try {
    // Double-check if developer exists
    const result = await db.query(
      "SELECT * FROM developers WHERE developer_id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("Developer not found");
    }

    // Delete developer (will also remove from game_developers since ON DELETE CASCADE is set)
    await db.query("DELETE FROM developers WHERE developer_id = $1", [id]);

    res.redirect("/developers");
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send("Could not delete developer (possibly still referenced).");
  }
};
