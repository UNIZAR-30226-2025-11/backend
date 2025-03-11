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
CREATE TABLE lobbies (
    id TEXT PRIMARY KEY NOT NULL,
    game JSONB,
    leader_socket TEXT NOT NULL,
    num_max_players INT NOT NULL CHECK (num_max_players BETWEEN 2 AND 4),
    active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE lobbies_sockets (
    lobby_id TEXT NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    socket_id TEXT NOT NULL,
    player_id INT,
    PRIMARY KEY(socket_id)
);

-- DO THIS AT THE END, CREATE A TESTING DB THAT IS A COPY OF THE ACTUAL ONE
CREATE DATABASE katboom_testing WITH TEMPLATE katboom;
