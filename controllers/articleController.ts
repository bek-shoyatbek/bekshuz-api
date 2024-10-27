import { Router } from "../deps.ts";
import { ObjectId } from "https://deno.land/x/web_bson@v0.2.5/mod.ts";
import articles, { type ArticleSchema } from "../models/article.ts";


const router = new Router();

// Get all articles
router.get("/articles", async (ctx) => {
  try {
    // You might want to exclude the full content when fetching all articles
    // to reduce payload size
    const allArticles = await articles.find({}, {
      projection: {
        content: 0  // Exclude content from the list view
      }
    }).toArray();

    ctx.response.body = allArticles;
    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Error fetching articles",
      error: error.message
    };
  }
});

// Get single article with full content
router.get("/articles/:id", async (ctx) => {
  try {
    const id = ctx.params.id;
    const article = await articles.findOne({ _id: new ObjectId(id) });

    if (!article) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Article not found" };
      return;
    }

    ctx.response.body = article;
    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Error fetching article",
      error: error.message
    };
  }
});

// Create new article
router.post("/articles", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { title, content, author, description, tags, isPublished = false } = body;

    // Validate required fields
    if (!title || !content || !author) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Missing required fields" };
      return;
    }

    const newArticle = await articles.insertOne({
      title,
      content,
      author,
      description,
      tags,
      isPublished,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    ctx.response.status = 201;
    ctx.response.body = newArticle;
    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Error creating article",
      error: error.message
    };
  }
});

// Update article
router.put("/articles/:id", async (ctx) => {
  try {
    const id = ctx.params.id;
    const body = await ctx.request.body().value;
    const { title, content, author, description, tags, isPublished } = body;

    const article = await articles.findOne({ _id: new ObjectId(id) });
    if (!article) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Article not found" };
      return;
    }

    const updateData: Partial<ArticleSchema> = {
      updatedAt: new Date()
    };

    // Only update fields that are provided
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (author !== undefined) updateData.author = author;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    await articles.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    ctx.response.body = {
      message: "Article updated successfully",
      id
    };

    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Error updating article",
      error: error.message
    };
  }
});

// Delete article
router.delete("/articles/:id", async (ctx) => {
  try {
    const id = ctx.params.id;
    const result = await articles.deleteOne({ _id: new ObjectId(id) });

    if (result === 0) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Article not found" };
      return;
    }

    ctx.response.body = { message: "Article deleted successfully" };

    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Error deleting article",
      error: error.message
    };
  }
});

// Search articles
router.get("/articles/search", async (ctx) => {
  try {
    const query = ctx.request.url.searchParams.get("q") || "";
    const tag = ctx.request.url.searchParams.get("tag");
    const author = ctx.request.url.searchParams.get("author");

    const searchCriteria: any = {};

    if (query) {
      searchCriteria.$or = [
        { title: new RegExp(query, "i") },
        { content: new RegExp(query, "i") }
      ];
    }

    if (tag) {
      searchCriteria.tags = tag;
    }

    if (author) {
      searchCriteria.author = new RegExp(author, "i");
    }

    const foundArticles = await articles.find(searchCriteria, {
      projection: { content: 0 }  // Exclude content from search results
    }).toArray();

    ctx.response.body = foundArticles;

    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = {
      message: "Error searching articles",
      error: error.message
    };
  }
});

export default router;