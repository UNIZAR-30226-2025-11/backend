CREATE TABLE IF NOT EXISTS users (
    -- Identity and auth
    id uuid UNIQUE PRIMARY KEY,
    username varchar(128) UNIQUE NOT NULL,
    password varchar(128) NOT NULL,

    -- Statistics
    games_played integer NOT NULL CHECK (games_played >= 0) DEFAULT 0,
    games_won integer NOT NULL CHECK (games_won >= 0) DEFAULT 0,

    -- Currency available
    coins integer NOT NULL CHECK (coins >= 0) DEFAULT 0
);

-- Create the lobbies table
CREATE TABLE IF NOT EXISTS lobbies (
    id TEXT PRIMARY KEY NOT NULL,
    game JSONB,
    leader TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    num_max_players INT NOT NULL CHECK (num_max_players BETWEEN 2 AND 4),
    active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS users_in_lobby (
    lobby_id TEXT NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    id_in_game INT,
    PRIMARY KEY(username, lobby_id)
);

CREATE TABLE shop_products (
    product_id INT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    category TEST NOT NULL,
    price INT NOT NULL
)

CREATE TABLE user_products (
    id_user INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_product INT NOT NULL REFERENCES shop_products(product_id) ON DELETE CASCADE
)

-- DO THIS AT THE END, CREATE A TESTING DB THAT IS A COPY OF THE ACTUAL ONE
DROP DATABASE IF EXISTS katboom_testing;
CREATE DATABASE katboom_testing WITH TEMPLATE katboom;
