import db from "../config/db.ts";

export interface AnimeSchema {
  _id: { $oid: string };
  title: string;
  genre: string;
  youtubeLink: string;
  insight: string;
  createdAt: Date;
  updatedAt: Date;
}

const animes = db.collection<AnimeSchema>("animes");

export default animes;