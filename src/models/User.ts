import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/userRepository.js";
import { RecordJSON, UserJSON } from "../api/restAPI.js";

export interface UserEntity {
  id: crypto.UUID;
  username: string;
  password: string;

  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  totalTimePlayed: number;
  totalTurnsPlayed: number;

  coins: number;
  avatar: string;
  background: string;
}

export class User implements UserEntity {
    id = crypto.randomUUID();
    gamesPlayed = 0;
    gamesWon = 0;
    coins = 0;
    currentStreak = 0;
    maxStreak = 0;
    totalTimePlayed = 0;
    totalTurnsPlayed = 0;

    avatar = "default";
    background = "default";
  
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
        currentStreak: 0,
        maxStreak: 0,
        totalTimePlayed: 0,
        totalTurnsPlayed: 0,
        avatar: "default",
        background: "default",
    };
}
  
/** Return user without sensitive data */
export function getPublicUser(user: UserEntity) {
    const { password: _, ...publicUser } = user;
    return publicUser;
}
  
export async function getUserData(username: string) : Promise<UserJSON | undefined> {
  const user = await UserRepository.findByUsername(username);
  if (!user) {
    return undefined;
  }

  const lastFiveGames: RecordJSON[] = await UserRepository.getLastFiveGames(username);
  const userData: UserJSON = {
    username: user.username,
    coins: user.coins,
    statistics: {
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      currentStreak: user.currentStreak,
      bestStreak: user.maxStreak,
      totalTimePlayed: user.totalTimePlayed,
      totalTurnsPlayed: user.totalTurnsPlayed,
      lastFiveGames: lastFiveGames,
    },
    userPersonalizeData: {
      avatar: user.avatar,
      background: user.background,
    },
  };

  return userData;
} 
