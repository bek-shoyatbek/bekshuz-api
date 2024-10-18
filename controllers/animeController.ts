import { Router } from "../deps.ts";
import animes from "../models/anime.ts";

const router = new Router();

router.get("/animes", async (ctx) => {
  const allAnimes = await animes.find().toArray();
  ctx.response.body = allAnimes;
});

router.post("/animes", async (ctx) => {
  const { title, description, genre, rating } = await ctx.request.body().value;
  const newAnime = await animes.insertOne({
    title,
    description,
    genre,
    rating,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  ctx.response.body = newAnime;
});


export default router;