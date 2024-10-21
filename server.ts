import { Application } from "./deps.ts";
import { oakCors } from "./deps.ts";
import db from "./config/db.ts";
import articleRoutes from "./routes/articles.ts";
import animeRoutes from "./routes/animes.ts";
import projectRoutes from "./routes/projects.ts";

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

// Routes
app.use(articleRoutes.routes());
app.use(articleRoutes.allowedMethods());
app.use(animeRoutes.routes());
app.use(animeRoutes.allowedMethods());
app.use(projectRoutes.routes());
// Start the server
const PORT = Number(Deno.env.get("PORT")) || 8000;
console.log(`Server running on http://localhost:${PORT}`);
await app.listen({ port: PORT });