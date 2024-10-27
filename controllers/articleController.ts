import { Router } from "../deps.ts";
import { ensureDir, copy } from "https://deno.land/std@0.224.0/fs/mod.ts";
import articles, { type ArticleSchema } from "../models/article.ts";
import { ObjectId } from "https://deno.land/x/web_bson@v0.2.5/mod.ts";

const router = new Router();
const CONTENT_DIR = "./content"; // Directory to store markdown files

// Ensure content directory exists
await ensureDir(CONTENT_DIR);

// Helper function to generate unique filename
function generateFilename(title: string): string {
  const timestamp = new Date().getTime();
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${cleanTitle}-${timestamp}.md`;
}

// Get all articles
router.get("/articles", async (ctx) => {
  const allArticles = await articles.find().toArray();
  ctx.response.body = allArticles;
});

// Get single article with content
router.get("/articles/:id", async (ctx) => {
  const id = ctx.params.id;
  const article = await articles.findOne({ _id: { $oid: id } });

  if (!article) {
    ctx.response.status = 404;
    ctx.response.body = { message: "Article not found" };
    return;
  }

  // Read the markdown content
  try {
    const content = await Deno.readTextFile(`${CONTENT_DIR}/${article.contentUrl}`);
    ctx.response.body = { ...article, content };
  } catch (_error) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error reading article content" };
  }
});

// Create new article with markdown content
router.post("/articles", async (ctx) => {
  try {
    const formData = await ctx.request.body({ type: "form-data" }).value.read();
    const title = formData.fields.title;
    const description = formData.fields.description;
    const category = formData.fields.category;
    const markdownFile = formData.files?.[0];

    if (!markdownFile || !title || !description || !category) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Missing required fields" };
      return;
    }

    // Generate filename and save the file
    const filename = generateFilename(title);
    await copy(markdownFile.filename!, `${CONTENT_DIR}/${filename}`);

    // Create article record
    const newArticle = await articles.insertOne({
      title,
      description,
      category,
      contentUrl: filename,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    ctx.response.status = 201;
    ctx.response.body = newArticle;
    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error creating article", error: error.message };
  }
});

// Update article and its content
router.put("/articles/:id", async (ctx) => {
  try {
    const id = ctx.params.id;
    const formData = await ctx.request.body({ type: "form-data" }).value.read();
    const title = formData.fields.title;
    const description = formData.fields.description;
    const category = formData.fields.category;
    const markdownFile = formData.files?.[0];

    const article = await articles.findOne({ _id: new ObjectId(id) });
    if (!article) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Article not found" };
      return;
    }

    const updateData: Partial<ArticleSchema> = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;

    if (markdownFile) {
      // Generate new filename and save the file
      const filename = generateFilename(title || article.title);
      await copy(markdownFile.filename!, `${CONTENT_DIR}/${filename}`);

      // Delete old file
      try {
        await Deno.remove(`${CONTENT_DIR}/${article.contentUrl}`);
      } catch (_error) {
        // Ignore error if old file doesn't exist
      }

      updateData.contentUrl = filename;
    }

    await articles.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    ctx.response.body = { message: "Article updated successfully" };
    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error updating article", error: error.message };
  }
});

// Delete article and its content
router.delete("/articles/:id", async (ctx) => {
  try {
    const id = ctx.params.id;
    const article = await articles.findOne({ _id: new ObjectId(id) });

    if (!article) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Article not found" };
      return;
    }

    // Delete the markdown file
    try {
      await Deno.remove(`${CONTENT_DIR}/${article.contentUrl}`);
      // deno-lint-ignore no-explicit-any
    } catch (error: any) {
      console.error(`Error deleting file: ${error.message}`);
    }

    // Delete the article record
    await articles.deleteOne({ _id: new ObjectId(id) });

    ctx.response.body = { message: "Article deleted successfully" };
    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error deleting article", error: error.message };
  }
});

export default router;