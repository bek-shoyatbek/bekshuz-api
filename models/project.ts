import db from "../config/db.ts";



export interface ProjectSchema {
  _id: { $oid: string };
  title: string;
  description: string;
  technologies: string[];
  imageUrl: string;
  projectUrl: string;
  githubUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const projects = db.collection<ProjectSchema>("projects");

export default projects;