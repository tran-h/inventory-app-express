const db = require("../db");

exports.home = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM video_games ORDER BY title");
    res.render("videogames/index", { games: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading games page");
  }
};

exports.show = async (req, res) => {
  try {
    let game_id = req.params.id;
    const game = await db.query("SELECT * FROM video_games WHERE game_id = $1", [
      game_id,
    ]);
    const genres = await db.query(
      "SELECT g.genre_id, g.name AS genre_name FROM genres g JOIN game_genres gg ON g.genre_id = gg.genre_id WHERE gg.game_id = $1",
      [game_id]
    );
    res.render("videogames/show", { game: game.rows, genres: genres.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading games page");
  }
};
