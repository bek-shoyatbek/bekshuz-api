import type { ObjectId } from "https://deno.land/x/web_bson@v0.2.5/mod.ts";
import db from "../config/db.ts";



export interface ArticleSchema {
  _id?: ObjectId;
  title: string;
  content: string;  // Direct markdown content
  author: string;
  createdAt: Date;
  updatedAt: Date;
  // Optional fields you might want
  description?: string;
  tags?: string[];
  isPublished?: boolean;
}

const articles = db.collection<ArticleSchema>("articles");

export default articles;