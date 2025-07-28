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
