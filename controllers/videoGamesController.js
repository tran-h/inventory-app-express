const db = require("../db");
const { body, validationResult } = require("express-validator");

exports.home = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM video_games ORDER BY title");
    res.render("videogames/index", { games: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading list of games");
  }
};

exports.show = async (req, res) => {
  try {
    let game_id = req.params.id;
    const game = await db.query(
      "SELECT * FROM video_games WHERE game_id = $1",
      [game_id]
    );
    const genres = await db.query(
      "SELECT g.genre_id, g.name AS genre_name FROM genres g JOIN game_genres gg ON g.genre_id = gg.genre_id WHERE gg.game_id = $1",
      [game_id]
    );
    const dev = await db.query(
      "SELECT * FROM developers d JOIN game_developers gd ON d.developer_id = gd.developer_id WHERE gd.game_id = $1",
      [game_id]
    );
    res.render("videogames/show", {
      game: game.rows,
      genres: genres.rows,
      developer: dev.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading selected game");
  }
};

exports.createGameGet = async (req, res) => {
  try {
    const [genresResult, developersResult] = await Promise.all([
      db.query("SELECT * FROM genres ORDER BY name"),
      db.query("SELECT * FROM developers ORDER BY name"),
    ]);

    res.render("videogames/new", {
      title: "Add New Video Game",
      game: {},
      genres: genresResult.rows,
      developers: developersResult.rows,
      selectedGenres: [],
      selectedDevelopers: [],
      errors: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading form to create video game");
  }
};

exports.createGamePost = [
  body("title", "Title is required").trim().isLength({ min: 1 }).escape(),
  body("release_year", "Valid release year required")
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .toInt(),
  body("price")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number")
    .toFloat(),
  body("genres", "At least one genre is required").isArray({ min: 1 }),
  body("developers", "At least one developer is required").isArray({ min: 1 }),

  async (req, res) => {
    const errors = validationResult(req);

    const game = {
      title: req.body.title,
      release_year: req.body.release_year,
      price: req.body.price || null,
    };

    const selectedGenres = req.body.genres || [];
    const selectedDevelopers = req.body.developers || [];

    if (!errors.isEmpty()) {
      const [genresResult, developersResult] = await Promise.all([
        db.query("SELECT * FROM genres ORDER BY name"),
        db.query("SELECT * FROM developers ORDER BY name"),
      ]);
      return res.render("videogames/new", {
        title: "Add New Video Game",
        game,
        genres: genresResult.rows,
        developers: developersResult.rows,
        selectedGenres,
        selectedDevelopers,
        errors: errors.array(),
      });
    }

    // db.query(
    //   "INSERT INTO video_games (title, release_year, price) VALUES ($1, $2, $3)",
    //   [game.title, game.release_year, game.price]
    // );
    // res.redirect("/games");
    try {
      const insertGameQuery = `
        INSERT INTO video_games (title, release_year, price)
        VALUES ($1, $2, $3)
        RETURNING game_id
      `;
      const result = await db.query(insertGameQuery, [
        game.title,
        game.release_year,
        game.price,
      ]);
      const game_id = result.rows[0].game_id;

      for (const genre_id of selectedGenres) {
        await db.query(
          "INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2)",
          [game_id, genre_id]
        );
      }

      for (const developer_id of selectedDevelopers) {
        await db.query(
          "INSERT INTO game_developers (game_id, developer_id) VALUES ($1, $2)",
          [game_id, developer_id]
        );
      }

      res.redirect("/games");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error saving game");
    }
  },
];
