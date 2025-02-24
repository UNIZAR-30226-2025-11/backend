import {db} from "./db.js";

export const add_coins = async (user_id:number, coins:number) => {
    const query = 
        `UPDATE users
         SET coins = coins + $1
         WHERE id = $2
         RETURNING coins`;
    
    const values = [coins, user_id];

    try {
        const result = await db.query(query, values);

        if(result.rowCount === 0) {
            throw new Error("User not found");
        }
        return result.rows[0];
    } catch (error) {
        throw error;
    }

}

export const get_coins = async (user_id:number) => {
    const query = 
        `SELECT coins
         FROM users
         WHERE id = $1`;

    const values = [user_id];

    try {
        const result = await db.query(query, values);

        if(result.rowCount === 0) {
            throw new Error("User not found");
        }
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

export const subtract_coins = async (user_id:number, coins:number) => {
    const query = 
        `UPDATE users
         SET coins = coins - $1
         WHERE id = $2
         RETURNING coins`;

    const values = [coins, user_id];

    try {
        const result = await db.query(query, values);

        if(result.rowCount === 0) {
            throw new Error("User not found");
        }
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

export const add_win = async (user_id:number) => {
    const query = 
        `UPDATE users
         SET games_won = games_won + 1
         WHERE id = $1
         RETURNING wins`;

    const values = [user_id];

    try {
        const result = await db.query(query, values);

        if(result.rowCount === 0) {
            throw new Error("User not found");
        }
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

export const add_played_game = async (user_id:number) => {
    const query = 
        `UPDATE users
         SET games_played = games_played + 1
         WHERE id = $1
         RETURNING games_played`;

    const values = [user_id];

    try {
        const result = await db.query(query, values);

        if(result.rowCount === 0) {
            throw new Error("User not found");
        }
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

export const get_stats = async (user_id:number) => {
    const query = 
        `SELECT games_played, games_won
         FROM users
         WHERE id = $1`;

    const values = [user_id];

    try {
        const result = await db.query(query, values);

        if(result.rowCount === 0) {
            throw new Error("User not found");
        }
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

export const get_leaderboard_most_played = async () => {
    const query = 
        `SELECT username, games_played
         FROM users
         ORDER BY games_played DESC
         LIMIT 10`;

    try {
        const result = await db.query(query);

        return result.rows;
    } catch (error) {
        throw error;
    }
}

export const  get_most_winrate = async () => {
    const query = 
        `SELECT username, games_won, games_played
         FROM users
         ORDER BY games_won/games_played DESC
         LIMIT 10`;

    try {
        const result = await db.query(query);

        return result.rows;
    } catch (error) {
        throw error;
    }
}

export const get_leaderboard_most_won = async () => {
    const query = 
        `SELECT username, games_won
         FROM users
         ORDER BY games_won DESC
         LIMIT 10`;

    try {
        const result = await db.query(query);

        return result.rows;
    } catch (error) {
        throw error;
    }
}

export const create_room = async (user_id:number, room_name:string, max_player:number) => {
    const query = 
        `INSERT INTO rooms (max_players, creator_id, active)
         VALUES ($1, $2, $3)
         RETURNING id`;
    
    const values = [max_player, user_id, true];

    try {
        const result = await db.query(query, values);

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

export const get_number_player_in_room = async (room_id:number) => {
    const query = 
        `SELECT COUNT(*)
         FROM room_users
         WHERE room_id = $1`;

    const values = [room_id];

    try {
        const result = await db.query(query, values);

        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

export const can_enter_room = async (room_id:number) => {
    const query = 
        `SELECT id, max_players, active
         FROM rooms
         WHERE id = $1`;
    
    const values = [room_id];

    try {
        const result = await db.query(query, values);

        if(result.rowCount === 0) {
            throw new Error("Room not found");
        }
        const num_players_room:number = await get_number_player_in_room(room_id);
        const room = result.rows[0];
        if(room.active === false) {
            throw new Error("Room is not active");
        }
        if(num_players_room >= room.max_players) {
            throw new Error("Room is full");
        }
        return room;
    } catch (error) {
        throw error;
    }

}

export const enter_room = async (user_id:number, room_id:number) => {
    const query = 
        `INSERT INTO room_users (user_id, room_id)
         VALUES ($1, $2)`;

    const values = [user_id, room_id];

    try {
        await db.query(query, values);
    } catch (error) {
        throw error;
    }
}

export const deactivate_room = async (room_id:number) => {
    const query = 
        `UPDATE rooms
         SET active = false
         WHERE id = $1`;

    const values = [room_id];

    try {
        await db.query(query, values);
    } catch (error) {
        throw error;
    }
}
    