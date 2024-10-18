import db from "../config/db.ts";



export interface ArticleSchema {
  _id: { $oid: string };
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

const articles = db.collection<ArticleSchema>("articles");

export default articles;