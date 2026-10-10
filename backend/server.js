const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const casesDirectory = path.join(projectRoot, "CaseUses");
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  "build",
  "coverage",
  "data",
  "dist",
  "node_modules"
]);
const port = Number(process.env.CEJEY_API_PORT || 4170);
const mimeByExtension = {
  ".css": "CSS",
  ".html": "HTML",
  ".js": "JavaScript",
  ".jsx": "React",
  ".mjs": "JavaScript",
  ".py": "Python",
  ".rs": "Rust",
  ".ts": "TypeScript",
  ".tsx": "React",
  ".vue": "Vue",
  ".go": "Go"
};

async function readProjectSummary(directory) {
  try {
    const readme = await fs.readFile(path.join(directory, "README.md"), "utf8");
    const heading = readme.match(/^#\s+(.+)$/m)?.[1]?.replace(/^\d+\s*[·.-]\s*/, "").trim();
    const description = readme
      .replace(/^#.*$/m, "")
      .split(/\r?\n\s*\r?\n/)
      .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
      .find((paragraph) => paragraph && !paragraph.startsWith("## "));
    return {
      title: heading || path.basename(directory),
      description: description || "Proyecto local listo para explorar."
    };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return {
      title: path.basename(directory),
      description: "Proyecto local listo para explorar."
    };
  }
}

async function readPackage(directory) {
  try {
    return JSON.parse(await fs.readFile(path.join(directory, "package.json"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    if (error instanceof SyntaxError) {
      throw new Error(`El package.json de "${path.basename(directory)}" no es JSON válido.`);
    }
    throw error;
  }
}

async function collectMetrics(directory) {
  const metrics = { folders: 0, files: 0, fileTypes: new Set() };

  async function walk(currentDirectory) {
    const entries = await fs.readdir(currentDirectory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (ignoredDirectories.has(entry.name)) continue;
        metrics.folders += 1;
        await walk(path.join(currentDirectory, entry.name));
      } else if (entry.isFile()) {
        metrics.files += 1;
        const type = mimeByExtension[path.extname(entry.name).toLowerCase()];
        if (type) metrics.fileTypes.add(type);
      }
    }
  }

  await walk(directory);
  return metrics;
}

function detectStack(packageInfo, fileTypes, directory) {
  const stack = new Set(fileTypes);
  if (packageInfo) {
    stack.add("Node.js");
    const dependencies = {
      ...packageInfo.dependencies,
      ...packageInfo.devDependencies
    };
    if (dependencies.react || dependencies["react-dom"]) stack.add("React");
    if (dependencies.vite) stack.add("Vite");
    if (dependencies.express) stack.add("Express");
    if (dependencies["better-sqlite3"] || dependencies.sqlite3) stack.add("SQLite");
  }
  if (packageInfo && stack.has("HTML") && stack.has("CSS") && stack.has("JavaScript")) {
    stack.add("Web");
  }
  if (!packageInfo && fileTypes.includes("HTML")) {
    stack.add("Web estática");
  }
  if (directory === "01-mini-store") stack.add("Bootstrap CDN");
  if (directory === "03-pulse-board") stack.add("LocalStorage");
  return [...stack];
}

async function readProject(directoryName) {
  const directory = path.join(casesDirectory, directoryName);
  const [summary, packageInfo, metrics] = await Promise.all([
    readProjectSummary(directory),
    readPackage(directory),
    collectMetrics(directory)
  ]);
  const fileTypes = [...metrics.fileTypes];
  return {
    id: directoryName,
    title: summary.title,
    description: summary.description,
    folders: metrics.folders,
    files: metrics.files,
    stack: detectStack(packageInfo, fileTypes, directoryName),
    projectType: packageInfo ? "Aplicación web" : "Experiencia estática"
  };
}

async function listProjects() {
  const entries = await fs.readdir(casesDirectory, { withFileTypes: true });
  const projects = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink() && !ignoredDirectories.has(entry.name))
      .sort((left, right) => left.name.localeCompare(right.name, "es"))
      .map((entry) => readProject(entry.name))
  );
  return projects;
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/api/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }
  if (request.method !== "GET" || request.url !== "/api/projects") {
    sendJson(response, 404, { error: "No se encontró la ruta solicitada." });
    return;
  }

  try {
    sendJson(response, 200, { projects: await listProjects() });
  } catch (error) {
    console.error("No se pudieron analizar los proyectos de CaseUses:", error);
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "No se pudieron leer los proyectos locales."
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`API local de CeJey disponible en http://127.0.0.1:${port}`);
});
