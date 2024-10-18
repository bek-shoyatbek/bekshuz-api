import { Router } from "../deps.ts";
import articles from "../models/article.ts";

const router = new Router();

router.get("/articles", async (ctx) => {
  const allArticles = await articles.find().toArray();
  ctx.response.body = allArticles;
});

router.post("/articles", async (ctx) => {
  const { title, content, author } = await ctx.request.body().value;
  const newArticle = await articles.insertOne({
    title,
    content,
    author,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  ctx.response.body = newArticle;
});


export default router;