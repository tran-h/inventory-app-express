# inventory-app-express

## Database Table Schemas
```
CREATE TABLE genres (
    genre_id  SERIAL PRIMARY KEY,
    name      TEXT NOT NULL UNIQUE
);

CREATE TABLE developers (
    developer_id  SERIAL PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE,
    country       TEXT
);

CREATE TABLE video_games (
    game_id       SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    release_year  INTEGER NOT NULL CHECK (release_year >= 1950 AND release_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
    price         NUMERIC(10,2) CHECK (price >= 0)
);

CREATE TABLE game_genres (
    game_id   INTEGER NOT NULL REFERENCES video_games(game_id) ON DELETE CASCADE,
    genre_id  INTEGER NOT NULL REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, genre_id)
);

CREATE TABLE game_developers (
    game_id       INTEGER NOT NULL REFERENCES video_games(game_id) ON DELETE CASCADE,
    developer_id  INTEGER NOT NULL REFERENCES developers(developer_id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, developer_id)
);
```