import { Application, send, oakCors, HttpError } from "./deps.ts";
import db from "./config/db.ts";
import articleRoutes from "./routes/articles.ts";
import animeRoutes from "./routes/animes.ts";
import projectRoutes from "./routes/projects.ts";
import { PUBLIC_DIR } from "./constants/index.ts";

if (!db) {
  console.error("Database connection failed. Exiting the application.");
  Deno.exit(1);
}

const app = new Application();

// Enable CORS
app.use(oakCors());

// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});



// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith("/public/")) {
    const path = ctx.request.url.pathname.replace("/public/", "");
    try {
      await send(ctx, path, {
        root: PUBLIC_DIR,
        index: "index.html",
      });
    } catch {
      await next();
    }
    return;
  }
  await next();
});

// Routes
app.use(articleRoutes.routes());
app.use(articleRoutes.allowedMethods());
app.use(animeRoutes.routes());
app.use(animeRoutes.allowedMethods());
app.use(projectRoutes.routes());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: HttpError | unknown) {
    if (err instanceof HttpError) {
      ctx.response.status = err.status;
      ctx.response.body = { message: err.message };
      return;
    }

    console.error(err);
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error" };
    return;
  }
});

// Start the server
const PORT = Number(Deno.env.get("PORT")) || 8000;
console.log(`Server running on http://localhost:${PORT}`);
await app.listen({ port: PORT });