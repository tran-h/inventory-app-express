const db = require("../db");

exports.home = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM genres ORDER BY name");
    res.render("genres/index", { genres: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading home page");
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
    res.status(500).send("Error loading home page");
  }
};
