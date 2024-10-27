import { ObjectId } from "https://deno.land/x/web_bson@v0.2.5/mod.ts";
import { Router } from "../deps.ts";
import { ensureDir, copy } from "https://deno.land/std/fs/mod.ts";
import { extname } from "https://deno.land/std@0.224.0/path/mod.ts";
import projects from "../models/project.ts";
import { PUBLIC_DIR } from "../constants/index.ts";

const router = new Router();
const IMAGES_DIR = PUBLIC_DIR;
const BASE_URL = Deno.env.get("BASE_URL"); // Change this to your production URL

// Ensure images directory exists
await ensureDir(IMAGES_DIR);

// Helper function to generate unique filename for images
function generateImageFilename(originalFilename: string): string {
  const ext = extname(originalFilename);
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `project-${timestamp}-${randomString}${ext}`;
}

// Helper function to get public URL
function getPublicUrl(filename: string): string {
  return `${BASE_URL}/public/${filename}`;
}

// Helper function to validate image file
function validateImageFile(filename: string): boolean {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = extname(filename).toLowerCase();
  return validExtensions.includes(ext);
}

// Get all projects
router.get("/projects", async (ctx) => {
  const allProjects = await projects.find().toArray();
  ctx.response.body = allProjects.map(project => ({
    ...project,
    imageUrl: project.imageUrl ? getPublicUrl(project.imageUrl) : null
  }));
});

// Get single project
router.get("/projects/:id", async (ctx) => {
  const id = ctx.params.id;
  const project = await projects.findOne({ _id: new ObjectId(id) });

  if (!project) {
    ctx.response.status = 404;
    ctx.response.body = { message: "Project not found" };
    return;
  }

  ctx.response.body = {
    ...project,
    imageUrl: project.imageUrl ? getPublicUrl(project.imageUrl) : null
  };
});

// Create new project
router.post("/projects", async (ctx) => {
  try {
    const formData = await ctx.request.body({ type: "form-data" }).value.read();
    const {
      title,
      description,
      technologies,
      projectUrl,
      githubUrl
    } = formData.fields;

    // Validate required fields
    if (!title || !description) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Missing required fields" };
      return;
    }

    let imageUrl = null;
    const imageFile = formData.files?.find(f => f.name === 'image');

    if (imageFile) {
      // Validate image file
      if (!validateImageFile(imageFile.filename!)) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Invalid image file type" };
        return;
      }

      // Generate filename and save the file
      const filename = generateImageFilename(imageFile.filename!);
      await copy(imageFile.filename!, `${IMAGES_DIR}/${filename}`);
      imageUrl = filename;
    }

    // Parse technologies if it's a string
    const parsedTechnologies = typeof technologies === 'string'
      ? JSON.parse(technologies)
      : technologies;

    const newProject = await projects.insertOne({
      title,
      description,
      technologies: parsedTechnologies,
      imageUrl: imageUrl as string,
      projectUrl,
      githubUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    ctx.response.status = 201;
    ctx.response.body = {
      ...newProject,
      imageUrl: imageUrl ? getPublicUrl(imageUrl) : null
    };
    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error creating project", error: error.message };
  }
});

// Update project
router.put("/projects/:id", async (ctx) => {
  try {
    const id = ctx.params.id;
    const formData = await ctx.request.body({ type: "form-data" }).value.read();
    const {
      title,
      description,
      technologies,
      projectUrl,
      githubUrl
    } = formData.fields;

    const project = await projects.findOne({ _id: new ObjectId(id) });
    if (!project) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Project not found" };
      return;
    }

    // deno-lint-ignore no-explicit-any
    const updateData: any = {
      updatedAt: new Date()
    };

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (technologies) {
      updateData.technologies = typeof technologies === 'string'
        ? JSON.parse(technologies)
        : technologies;
    }
    if (projectUrl) updateData.projectUrl = projectUrl;
    if (githubUrl) updateData.githubUrl = githubUrl;

    const imageFile = formData.files?.find(f => f.name === 'image');
    if (imageFile) {
      // Validate image file
      if (!validateImageFile(imageFile.filename!)) {
        ctx.response.status = 400;
        ctx.response.body = { message: "Invalid image file type" };
        return;
      }

      // Generate new filename and save the file
      const filename = generateImageFilename(imageFile.filename!);
      await copy(imageFile.filename!, `${IMAGES_DIR}/${filename}`);

      // Delete old image if exists
      if (project.imageUrl) {
        try {
          await Deno.remove(`${IMAGES_DIR}/${project.imageUrl}`);
        } catch (_e) {
          // Ignore error if old file doesn't exist
        }
      }

      updateData.imageUrl = filename;
    }

    await projects.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    ctx.response.body = {
      message: "Project updated successfully",
      imageUrl: updateData.imageUrl ? getPublicUrl(updateData.imageUrl) : project.imageUrl ? getPublicUrl(project.imageUrl) : null
    };
    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error updating project", error: error.message };
  }
});

// Delete project
router.delete("/projects/:id", async (ctx) => {
  try {
    const id = ctx.params.id;
    const project = await projects.findOne({ _id: new ObjectId(id) });

    if (!project) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Project not found" };
      return;
    }

    // Delete the image file if exists
    if (project.imageUrl) {
      try {
        await Deno.remove(`${IMAGES_DIR}/${project.imageUrl}`);
      } catch (_e) {

        // Ignore error if file doesn't exist
      }
    }

    const deletedProject = await projects.deleteOne({ _id: new ObjectId(id) });
    ctx.response.body = deletedProject;
    // deno-lint-ignore no-explicit-any
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = { message: "Error deleting project", error: error.message };
  }
});

export default router;