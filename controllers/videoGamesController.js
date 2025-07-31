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

exports.editGameGet = async (req, res) => {
  const id = req.params.id;
  try {
    const gameResult = await db.query(
      "SELECT * FROM video_games WHERE game_id = $1",
      [id]
    );
    if (gameResult.rows.length === 0) {
      return res.status(404).send("Game not found");
    }

    const [allGenres, allDevs, gameGenres, gameDevs] = await Promise.all([
      db.query("SELECT * FROM genres ORDER BY name"),
      db.query("SELECT * FROM developers ORDER BY name"),
      db.query("SELECT genre_id FROM game_genres WHERE game_id = $1", [id]),
      db.query("SELECT developer_id FROM game_developers WHERE game_id = $1", [
        id,
      ]),
    ]);

    const selectedGenreIds = gameGenres.rows.map((row) => String(row.genre_id));
    const selectedDevIds = gameDevs.rows.map((row) => String(row.developer_id));

    res.render("videogames/edit", {
      title: "Edit Game",
      game: gameResult.rows[0],
      genres: allGenres.rows,
      developers: allDevs.rows,
      selectedGenreIds,
      selectedDevIds,
      errors: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading edit game form");
  }
};

exports.editGamePost = [
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("release_year")
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage("Enter a valid year."),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number."),

  body("genres").custom((value) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      throw new Error("At least one genre must be selected.");
    }
    return true;
  }),

  body("developers").custom((value) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      throw new Error("At least one developer must be selected.");
    }
    return true;
  }),

  async (req, res) => {
    const id = req.params.id;
    const errors = validationResult(req);

    const selectedGenres = Array.isArray(req.body.genres)
      ? req.body.genres.map(String)
      : req.body.genres
      ? [String(req.body.genres)]
      : [];

    const selectedDevelopers = Array.isArray(req.body.developers)
      ? req.body.developers.map(String)
      : req.body.developers
      ? [String(req.body.developers)]
      : [];

    const game = {
      game_id: id,
      title: req.body.title,
      release_year: req.body.release_year,
      price: req.body.price,
    };

    if (!errors.isEmpty()) {
      const [allGenres, allDevs] = await Promise.all([
        db.query("SELECT * FROM genres ORDER BY name"),
        db.query("SELECT * FROM developers ORDER BY name"),
      ]);

      return res.render("videogames/edit", {
        title: "Edit Game",
        game,
        genres: allGenres.rows,
        developers: allDevs.rows,
        selectedGenreIds: selectedGenres,
        selectedDevIds: selectedDevelopers,
        errors: errors.array(),
      });
    }

    try {
      await db.query(
        "UPDATE video_games SET title = $1, release_year = $2, price = $3 WHERE game_id = $4",
        [game.title, game.release_year, game.price, id]
      );

      // Clear old associations
      await db.query("DELETE FROM game_genres WHERE game_id = $1", [id]);
      await db.query("DELETE FROM game_developers WHERE game_id = $1", [id]);

      // Add new genre/developer links
      for (const genreId of selectedGenres) {
        await db.query(
          "INSERT INTO game_genres (game_id, genre_id) VALUES ($1, $2)",
          [id, genreId]
        );
      }

      for (const devId of selectedDevelopers) {
        await db.query(
          "INSERT INTO game_developers (game_id, developer_id) VALUES ($1, $2)",
          [id, devId]
        );
      }

      res.redirect(`/games/${id}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error editing game");
    }
  },
];
