# inventory-app-express

A full-stack web application for managing a collection of video games, including their genres and developers. Built using **Node.js**, **Express**, **PostgreSQL**, and **EJS**, this app demonstrates full CRUD operations, relational data handling, and deployment on **Render**.

## Features

- Create, read, update, and delete video games, genres, and developers
- Associate games with multiple genres
- Associate games with multiple developers
- Form validation with user-friendly error messages
- Hosted backend and database using Render
- Seed script to populate the database with sample data

## Technologies Used

- **Node.js** + **Express** – Web server and routing
- **PostgreSQL** – Relational database
- **pg** – PostgreSQL client for Node.js
- **EJS** – Templating engine for dynamic HTML rendering
- **dotenv** – Environment variable management
- **Render** – Free cloud hosting for backend and PostgreSQL

## What I Learned

This project helped me:

- Understand relational database design with foreign key constraints
- Work with many-to-many relationships using join tables
- Use express-validator to validate and sanitize form inputs
- Perform full CRUD operations with proper RESTful routing
- Deploy both backend and PostgreSQL on a cloud platform (Render)
- Use psql and .env to manage local and remote environments

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
