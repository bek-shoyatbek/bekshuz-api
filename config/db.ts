import type { Database } from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import { MongoClient, load } from "../deps.ts";

let db;

try {
  const env = await load();
  const MONGODB_URI = env["MONGODB_URI"] || Deno.env.get("MONGODB_URI");

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  console.log("MONGODB_URI ", MONGODB_URI);

  const client = new MongoClient();

  await client.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  db = client.database("blog_admin");
} catch (error) {
  console.error("MongoDB connection error:", error);
}

export default db as Database;