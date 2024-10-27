import { ObjectId } from "https://deno.land/x/web_bson@v0.2.5/mod.ts";
import { Router } from "../deps.ts";
import projects from "../models/project.ts";

const router = new Router();

router.get("/projects", async (ctx) => {
  const allProjects = await projects.find().toArray();
  ctx.response.body = allProjects;
});

router.post("/projects", async (ctx) => {
  const { title, description, technologies, imageUrl, projectUrl, githubUrl } = await ctx.request.body().value;
  const newProject = await projects.insertOne({
    title,
    description,
    technologies,
    imageUrl,
    projectUrl,
    githubUrl,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  ctx.response.body = newProject;
});

router.delete("/projects/:id", async (ctx) => {
  const id = ctx.params.id;
  const deletedProject = await projects.deleteOne({ _id: new ObjectId(id) });
  ctx.response.body = deletedProject;
});


export default router;