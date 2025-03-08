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
)

-- DO THIS AT THE END, CREATE A TESTING DB THAT IS A COPY OF THE ACTUAL ONE
CREATE DATABASE katboom_testing WITH TEMPLATE katboom
