// const db = require("../db");

exports.home = async (req, res) => {
  try {
    // const result = await db.query("SELECT * FROM genres ORDER BY name");
    const result = {
      rows: [
        { id: 1, name: "Action" },
        { id: 2, name: "Adventure" },
        { id: 3, name: "RPG" },
      ],
    };
    res.render("home", { genres: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading home page");
  }
};
