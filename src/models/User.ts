import crypto from "node:crypto";
import bcrypt from "bcrypt";

export interface UserEntity {
  id: crypto.UUID;
  username: string;
  password: string;

  gamesPlayed: number;
  gamesWon: number;

  coins: number;
  
}


export class User implements UserEntity {
    id = crypto.randomUUID();
    gamesPlayed = 0;
    gamesWon = 0;
    coins = 0;
  
    /** Create a brand-new user */
    constructor(
      public username: string,
      public password: string,
    ) {
      this.username = username;
      this.password = password;
    }
  
    publicUser = () => {
      const { password: _, ...publicUser } = this;
      return publicUser;
    };
}

export async function createNewUser(
    username: string,
    password: string,
  ): Promise<UserEntity> {
    return {
        id: crypto.randomUUID(),
        username,
        password: await bcrypt.hash(password, 10),
        gamesPlayed: 0,
        gamesWon: 0,
        coins: 0,
    };
}
  
/** Return user without sensitive data */
export function getPublicUser(user: UserEntity) {
    const { password: _, ...publicUser } = user;
    return publicUser;
}
