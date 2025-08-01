require("dotenv").config();
const { Client } = require("pg");

// Use --remote flag to connect to remote DB, otherwise local (e.g. "node populatedb.js --remote")
const isRemote = process.argv.includes("--remote");
const connectionString = isRemote
  ? process.env.DATABASE_URL_REMOTE
  : process.env.DATABASE_URL_LOCAL;

const client = new Client({ connectionString });

async function seed() {
  try {
    await client.connect();
    console.log(`Connected to ${isRemote ? "REMOTE" : "LOCAL"} database`);

    // Clean existing data
    await client.query(`
      TRUNCATE game_developers, game_genres, video_games, genres, developers
      RESTART IDENTITY CASCADE
    `);

    const genres = [
      "Action",
      "Adventure",
      "RPG",
      "Simulation",
      "Strategy",
      "Puzzle",
    ];
    const genreIds = [];

    for (const name of genres) {
      const res = await client.query(
        "INSERT INTO genres(name) VALUES ($1) RETURNING genre_id",
        [name]
      );
      genreIds.push(res.rows[0].genre_id);
    }

    const devs = [
      { name: "Nintendo", country: "Japan" },
      { name: "Valve", country: "USA" },
      { name: "Bethesda", country: "USA" },
      { name: "FromSoftware", country: "Japan" },
      { name: "CD Projekt Red", country: "Poland" },
    ];
    const devIds = [];

    for (const dev of devs) {
      const res = await client.query(
        "INSERT INTO developers(name, country) VALUES ($1, $2) RETURNING developer_id",
        [dev.name, dev.country]
      );
      devIds.push(res.rows[0].developer_id);
    }

    const games = [
      {
        title: "The Legend of Zelda: Breath of the Wild",
        year: 2017,
        price: 59.99,
      },
      { title: "Elden Ring", year: 2022, price: 69.99 },
      { title: "The Witcher 3: Wild Hunt", year: 2015, price: 39.99 },
      { title: "Half-Life 2", year: 2004, price: 9.99 },
      { title: "Stardew Valley", year: 2016, price: 14.99 },
    ];
    const gameIds = [];

    for (const game of games) {
      const res = await client.query(
        "INSERT INTO video_games(title, release_year, price) VALUES ($1, $2, $3) RETURNING game_id",
        [game.title, game.year, game.price]
      );
      gameIds.push(res.rows[0].game_id);
    }

    await client.query(`
      INSERT INTO game_genres (game_id, genre_id) VALUES
      (${gameIds[0]}, ${genreIds[0]}), -- Zelda -> Action
      (${gameIds[0]}, ${genreIds[1]}), -- Zelda -> Adventure
      (${gameIds[1]}, ${genreIds[0]}), -- Elden Ring -> Action
      (${gameIds[1]}, ${genreIds[2]}), -- Elden Ring -> RPG
      (${gameIds[2]}, ${genreIds[2]}), -- Witcher 3 -> RPG
      (${gameIds[2]}, ${genreIds[1]}), -- Witcher 3 -> Adventure
      (${gameIds[3]}, ${genreIds[0]}), -- Half-Life 2 -> Action
      (${gameIds[3]}, ${genreIds[1]}), -- Half-Life 2 -> Adventure
      (${gameIds[4]}, ${genreIds[3]}), -- Stardew -> Simulation
      (${gameIds[4]}, ${genreIds[2]})  -- Stardew -> RPG
    `);

    await client.query(`
      INSERT INTO game_developers (game_id, developer_id) VALUES
      (${gameIds[0]}, ${devIds[0]}), -- Zelda -> Nintendo
      (${gameIds[1]}, ${devIds[3]}), -- Elden Ring -> FromSoftware
      (${gameIds[2]}, ${devIds[4]}), -- Witcher 3 -> CDPR
      (${gameIds[3]}, ${devIds[1]}), -- Half-Life 2 -> Valve
      (${gameIds[4]}, ${devIds[2]})  -- Stardew -> Bethesda (placeholder)
    `);

    console.log("Populating complete.");
  } catch (err) {
    console.error("Error populating database:", err);
  } finally {
    await client.end();
  }
}

seed();
