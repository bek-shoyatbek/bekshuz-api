import db from "../config/db.ts";

export interface AnimeSchema {
  _id: { $oid: string };
  title: string;
  description: string;
  genre: string[];
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const animes = db.collection<AnimeSchema>("animes");

export default animes;