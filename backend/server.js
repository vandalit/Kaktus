const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { openDatabase } = require("./database");

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
const port = Number(process.env.KAKTUS_API_PORT || 4170);
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
const maxEditorFileSize = 1024 * 1024;
const database = openDatabase();

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

async function getProjectDirectory(directoryName) {
  if (!/^[a-zA-Z0-9_-]+$/.test(directoryName)) return null;
  const entries = await fs.readdir(casesDirectory, { withFileTypes: true });
  const projectEntry = entries.find((entry) => entry.name === directoryName);
  if (!projectEntry?.isDirectory() || projectEntry.isSymbolicLink()) return null;
  return path.join(casesDirectory, directoryName);
}

async function readProjectTree(projectDirectory) {
  async function walk(directory, relativeDirectory = "") {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const sortedEntries = entries
      .filter((entry) => !entry.isSymbolicLink())
      .filter((entry) => !entry.isDirectory() || !ignoredDirectories.has(entry.name))
      .sort((left, right) => {
        if (left.isDirectory() !== right.isDirectory()) return left.isDirectory() ? -1 : 1;
        return left.name.localeCompare(right.name, "es");
      });

    return Promise.all(sortedEntries.map(async (entry) => {
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: relativePath,
          type: "directory",
          children: await walk(path.join(directory, entry.name), relativePath)
        };
      }
      if (!entry.isFile()) return null;
      const { size } = await fs.stat(path.join(directory, entry.name));
      return { name: entry.name, path: relativePath, type: "file", size };
    })).then((result) => result.filter(Boolean));
  }

  return walk(projectDirectory);
}

async function readProjectFile(projectDirectory, relativePath) {
  const pathParts = relativePath.split("/");
  if (
    !relativePath ||
    relativePath.includes("\\") ||
    path.isAbsolute(relativePath) ||
    pathParts.some((part) => !part || part === "." || part === "..")
  ) {
    return { status: 400, error: "La ruta del archivo no es válida." };
  }

  let currentPath = projectDirectory;
  for (const [index, part] of pathParts.entries()) {
    currentPath = path.join(currentPath, part);
    const entry = await fs.lstat(currentPath).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (!entry) return { status: 404, error: "No se encontró el archivo solicitado." };
    if (entry.isSymbolicLink()) return { status: 400, error: "No se pueden abrir enlaces simbólicos." };
    if (index < pathParts.length - 1 && !entry.isDirectory()) {
      return { status: 404, error: "No se encontró el archivo solicitado." };
    }
    if (index === pathParts.length - 1 && !entry.isFile()) {
      return { status: 404, error: "No se encontró un archivo en esa ruta." };
    }
  }

  const stats = await fs.stat(currentPath);
  if (stats.size > maxEditorFileSize) {
    return { status: 413, error: "El archivo supera el límite de lectura de 1 MB." };
  }
  const content = await fs.readFile(currentPath, "utf8");
  if (content.includes("\u0000")) {
    return { status: 415, error: "El archivo seleccionado no es texto y no puede mostrarse en el editor." };
  }
  return { status: 200, file: { path: relativePath, content, size: stats.size } };
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, "http://127.0.0.1");
  if (request.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }
  if (request.method !== "GET") {
    sendJson(response, 404, { error: "No se encontró la ruta solicitada." });
    return;
  }

  try {
    if (requestUrl.pathname === "/api/projects") {
      sendJson(response, 200, { projects: await listProjects() });
      return;
    }

    const projectRoute = requestUrl.pathname.match(/^\/api\/projects\/([^/]+)\/(tree|file)$/);
    if (!projectRoute) {
      sendJson(response, 404, { error: "No se encontró la ruta solicitada." });
      return;
    }

    let projectDirectoryName;
    try {
      projectDirectoryName = decodeURIComponent(projectRoute[1]);
    } catch {
      sendJson(response, 400, { error: "El identificador del proyecto no es válido." });
      return;
    }
    const projectDirectory = await getProjectDirectory(projectDirectoryName);
    if (!projectDirectory) {
      sendJson(response, 404, { error: "No se encontró el proyecto solicitado." });
      return;
    }

    if (projectRoute[2] === "tree") {
      sendJson(response, 200, {
        rootName: projectDirectoryName,
        entries: await readProjectTree(projectDirectory)
      });
      return;
    }

    const fileResult = await readProjectFile(projectDirectory, requestUrl.searchParams.get("path") || "");
    if (fileResult.status !== 200) {
      sendJson(response, fileResult.status, { error: fileResult.error });
      return;
    }
    sendJson(response, 200, fileResult);
  } catch (error) {
    console.error("No se pudieron analizar los proyectos de CaseUses:", error);
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "No se pudieron leer los proyectos locales."
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`API local de Kaktus disponible en http://127.0.0.1:${port} (SQLite inicializada).`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    server.close(() => {
      database.close();
      process.exit(0);
    });
  });
}
