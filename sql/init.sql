CREATE TABLE IF NOT EXISTS users (
    -- Identity and auth
    id uuid UNIQUE PRIMARY KEY,
    username varchar(128) UNIQUE NOT NULL,
    password varchar(128) NOT NULL,
    avatar TEXT NOT NULL DEFAULT 'default',
    background TEXT NOT NULL DEFAULT 'default',

    -- Statistics
    games_played integer NOT NULL CHECK (games_played >= 0) DEFAULT 0,
    games_won integer NOT NULL CHECK (games_won >= 0) DEFAULT 0,
    current_streak integer NOT NULL CHECK (current_streak >= 0) DEFAULT 0,
    max_streak integer NOT NULL CHECK (max_streak >= 0) DEFAULT 0,
    total_time_played integer NOT NULL CHECK (total_time_played >= 0) DEFAULT 0,
    total_turns_played integer NOT NULL CHECK (total_turns_played >= 0) DEFAULT 0,
    -- Currency available
    coins integer NOT NULL CHECK (coins >= 0) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_history (
    player TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    lobby_id TEXT NOT NULL,
    win BOOLEAN NOT NULL,
    game_date TIMESTAMP NOT NULL,
    PRIMARY KEY(player, lobby_id)
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


CREATE TABLE IF NOT EXISTS shop_products (
    id INT PRIMARY KEY NOT NULL,
    price INT NOT NULL,
    product_name TEXT NOT NULL,
    product_url TEXT NOT NULL,
    category_url TEXT NOT NULL,
    category_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_products (
    username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    id_product INT NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friends (
    applier_username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    applied_username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    is_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY(applier_username, applied_username)
);

INSERT INTO shop_products (id, product_url, product_name, category_url, category_name, price) VALUES
                    (0,'default', 'Default', 'avatar', 'Avatar', 0),
                    (1,'scared_cat', 'Scared Cat', 'avatar', 'Avatar', 500),
                    (2, 'angry_cat', 'Angry Cat', 'avatar', 'Avatar', 1000),
                    (3, 'mad_cat', 'Mad Cat', 'avatar', 'Avatar', 1500),
                    (4, 'default', 'Default', 'background', 'Background', 0),
                    (5, 'blue', 'Blue', 'background', 'Background', 100),
                    (6, 'green', 'Green', 'background', 'Background', 100),
                    (8, 'rainbow', 'Rainbow', 'background', 'Background', 300);

-- DO THIS AT THE END, CREATE A TESTING DB THAT IS A COPY OF THE ACTUAL ONE
DROP DATABASE IF EXISTS katboom_testing;
CREATE DATABASE katboom_testing WITH TEMPLATE katboom;
