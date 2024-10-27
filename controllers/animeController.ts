import { ObjectId } from "https://deno.land/x/web_bson@v0.2.5/mod.ts";
import { Router } from "../deps.ts";
import animes from "../models/anime.ts";

const router = new Router();

router.get("/animes", async (ctx) => {
  const allAnimes = await animes.find().toArray();
  ctx.response.body = allAnimes;
});

router.post("/animes", async (ctx) => {
  const { title, genre, youtubeLink, insight } = await ctx.request.body().value;
  if (!title || !genre || !youtubeLink || !insight) {
    ctx.response.status = 400;
    ctx.response.body = { message: "All fields are required" };
    return;
  }
  const newAnime = await animes.insertOne({
    title,
    genre,
    youtubeLink,
    insight,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  ctx.response.body = newAnime;
});

router.delete("/animes/:id", async (ctx) => {
  const id = ctx.params.id;
  const deletedAnime = await animes.deleteOne({ _id: new ObjectId(id) });
  ctx.response.body = deletedAnime;
});


export default router;