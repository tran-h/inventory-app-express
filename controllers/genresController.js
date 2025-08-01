const db = require("../db");
const { body, validationResult } = require("express-validator");

exports.home = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM genres ORDER BY name");
    res.render("genres/index", { genres: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading list of genres");
  }
};

exports.show = async (req, res) => {
  try {
    let genre_id = req.params.id;
    const genre = await db.query("SELECT * FROM genres WHERE genre_id = $1", [
      genre_id,
    ]);
    const games = await db.query(
      "SELECT * FROM video_games vg JOIN game_genres g ON vg.game_id = g.game_id WHERE g.genre_id = $1 ORDER BY vg.title",
      [genre_id]
    );
    res.render("genres/show", { genre: genre.rows, games: games.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading selected genre");
  }
};

exports.createGenreGet = (req, res) => {
  try {
    res.render("genres/new", { title: "Create Genre", genre: {}, errors: [] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading form to create genre");
  }
};

exports.createGenrePost = [
  body("name", "Genre name is required").trim().isLength({ min: 1 }).escape(),

  (req, res) => {
    const errors = validationResult(req);
    const genre = { name: req.body.name };

    if (!errors.isEmpty()) {
      return res.render("genres/new", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
    }

    const result = db.query("INSERT INTO genres (name) VALUES ($1)", [
      genre.name,
    ]);
    res.redirect("/genres/");
  },
];

exports.editGenreGet = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query("SELECT * FROM genres WHERE genre_id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).send("Genre not found");
    }
    res.render("genres/edit", {
      title: "Edit Genre",
      genre: result.rows[0],
      errors: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading edit genre form");
  }
};

exports.editGenrePost = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Genre name is required")
    .custom(async (value, { req }) => {
      const id = req.params.id;
      const result = await db.query(
        "SELECT * FROM genres WHERE name = $1 AND genre_id != $2",
        [value, id]
      );

      if (result.rows.length > 0) {
        throw new Error("Another genre with that name already exists.");
      }

      return true;
    }),

  async (req, res) => {
    const id = req.params.id;
    const errors = validationResult(req);

    const genre = {
      genre_id: id,
      name: req.body.name.trim(),
    };

    if (!errors.isEmpty()) {
      return res.render("genres/edit", {
        title: "Edit Genre",
        genre,
        errors: errors.array(),
      });
    }

    try {
      await db.query("UPDATE genres SET name = $1 WHERE genre_id = $2", [
        genre.name,
        id,
      ]);
      res.redirect(`/genres/${id}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error editing genre");
    }
  },
];

exports.deleteGenreGet = async (req, res) => {
  const id = req.params.id;

  try {
    const [genreResult, gameResult] = await Promise.all([
      db.query("SELECT * FROM genres WHERE genre_id = $1", [id]),
      db.query(
        `
        SELECT vg.game_id, vg.title
        FROM video_games vg
        JOIN game_genres gg ON vg.game_id = gg.game_id
        WHERE gg.genre_id = $1
      `,
        [id]
      ),
    ]);

    if (genreResult.rows.length === 0) {
      return res.status(404).send("Genre not found");
    }

    res.render("genres/delete", {
      title: "Delete Genre",
      genre: genreResult.rows[0],
      associatedGames: gameResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error getting genre(s)/game(s) to delete");
  }
};

exports.deleteGenrePost = async (req, res) => {
  const id = req.params.id;

  try {
    // Double-check if genre exists
    const result = await db.query("SELECT * FROM genres WHERE genre_id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).send("Genre not found");
    }

    // Delete genre (will also remove from game_genres since ON DELETE CASCADE is set)
    await db.query("DELETE FROM genres WHERE genre_id = $1", [id]);

    res.redirect("/genres");
  } catch (err) {
    console.error(err);
    res.status(500).send("Could not delete genre (possibly still referenced).");
  }
};
