const db = require("../db");

exports.home = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM developers ORDER BY name");
    res.render("developers/index", { developers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading developers page");
  }
};

exports.show = async (req, res) => {
  try {
    let developer_id = req.params.id;
    const developer = await db.query("SELECT * FROM developers WHERE developer_id = $1", [
      developer_id,
    ]);
    res.render("developers/show", { developer: developer.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading developers page");
  }
};
