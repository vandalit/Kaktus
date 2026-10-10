const fs = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { openDatabase } = require("./database");
const {
  findIndexedProject,
  listIndexedProjects,
  readIndexedProjectTree
} = require("./project-read-model");
const {
  getProjectPreferences,
  getWorkspacePreferences,
  patchProjectPreferences,
  patchWorkspacePreferences
} = require("./preferences");
const { bootstrapDemoWorkspace, scanWorkspace } = require("./workspace");

const projectRoot = path.resolve(__dirname, "..");
const casesDirectory = path.join(projectRoot, "CaseUses");
const port = Number(process.env.KAKTUS_API_PORT || 4170);
const maxEditorFileSize = 1024 * 1024;
const database = openDatabase();
const maxDirectoryEntries = 500;

function displayPathSegments(rootPath) {
  const relativeToHome = path.relative(os.homedir(), rootPath);
  if (
    !relativeToHome ||
    relativeToHome === "."
  ) {
    return ["~"];
  }
  if (
    relativeToHome === ".." ||
    relativeToHome.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToHome)
  ) {
    return ["…", path.basename(rootPath)];
  }
  return ["~", ...relativeToHome.split(path.sep).filter(Boolean)];
}

async function readSourceDirectory(rootPath, relativePath) {
  const pathParts = relativePath ? relativePath.split("/") : [];
  if (
    relativePath.includes("\u0000") ||
    relativePath.includes("\\") ||
    path.isAbsolute(relativePath) ||
    pathParts.some((part) => !part || part === "." || part === "..")
  ) {
    return { status: 400, error: "La ruta de exploración no es válida." };
  }
  let currentPath = rootPath;
  const rootStats = await fs.lstat(rootPath);
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    return { status: 404, error: "La raíz del workspace no está disponible." };
  }
  for (const part of pathParts) {
    currentPath = path.join(currentPath, part);
    const entry = await fs.lstat(currentPath).catch((error) => {
      if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
      throw error;
    });
    if (!entry || !entry.isDirectory() || entry.isSymbolicLink()) {
      return { status: 404, error: "No se encontró el directorio solicitado." };
    }
  }

  const [canonicalRoot, canonicalDirectory] = await Promise.all([
    fs.realpath(rootPath),
    fs.realpath(currentPath)
  ]);
  const canonicalRelativePath = path.relative(canonicalRoot, canonicalDirectory);
  if (
    canonicalRelativePath === ".." ||
    canonicalRelativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(canonicalRelativePath)
  ) {
    return { status: 400, error: "La ruta de exploración no es válida." };
  }

  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => ({ name: entry.name, type: "directory" }));
  const files = entries
    .filter((entry) => entry.isFile() && !entry.isSymbolicLink())
    .map((entry) => ({ name: entry.name, type: "file" }));
  const visibleEntries = [...directories, ...files].sort((left, right) => {
    if (left.type !== right.type) return left.type === "directory" ? -1 : 1;
    return left.name.localeCompare(right.name, "es");
  });
  const limitedEntries = visibleEntries.slice(0, maxDirectoryEntries).map((entry) => ({
    ...entry,
    relativePath: path.posix.join(relativePath, entry.name)
  }));
  return {
    status: 200,
    relativePath,
    entries: limitedEntries,
    truncated: visibleEntries.length > maxDirectoryEntries
  };
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

async function resolveProjectDirectory(project) {
  const rootPath = path.resolve(project.local_path);
  const projectDirectory = path.resolve(rootPath, project.relative_path);
  const relativePath = path.relative(rootPath, projectDirectory);
  if (
    !relativePath ||
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  try {
    const rootStats = await fs.lstat(rootPath);
    if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) return null;
    const stats = await fs.lstat(projectDirectory);
    return stats.isDirectory() && !stats.isSymbolicLink() ? projectDirectory : null;
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
    throw error;
  }
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

function readJsonBody(request) {
  if (!request.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
    return Promise.reject(Object.assign(new Error("El cuerpo debe usar application/json."), { status: 400 }));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let byteLength = 0;
    let failed = false;
    request.on("data", (chunk) => {
      if (failed) return;
      byteLength += chunk.length;
      if (byteLength > 16 * 1024) {
        failed = true;
        reject(Object.assign(new Error("El cuerpo excede el tamaño permitido."), { status: 413 }));
        request.resume();
        return;
      }
      chunks.push(chunk);
    });
    request.on("error", reject);
    request.on("end", () => {
      if (failed) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("El cuerpo JSON no es válido."), { status: 400 }));
      }
    });
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, "http://127.0.0.1");
  if (request.method === "GET" && requestUrl.pathname === "/api/health") {
    try {
      database.prepare("SELECT 1").get();
      sendJson(response, 200, { status: "ok", database: "ok" });
    } catch {
      sendJson(response, 503, { status: "error", database: "unavailable" });
    }
    return;
  }
  const sourceBrowserRoute = requestUrl.pathname.match(
    /^\/api\/workspaces\/([^/]+)\/source-browser$/
  );
  if (sourceBrowserRoute) {
    if (request.method !== "GET") {
      sendJson(response, 405, { error: "Este endpoint requiere el método GET." });
      return;
    }
    let workspaceId;
    try {
      workspaceId = decodeURIComponent(sourceBrowserRoute[1]);
    } catch {
      sendJson(response, 400, { error: "El identificador del workspace no es válido." });
      return;
    }
    const root = database.prepare(`
      SELECT local_path, display_name FROM roots
      WHERE workspace_id = ? AND kind = 'local'
      ORDER BY created_at
      LIMIT 1
    `).get(workspaceId);
    if (!root) {
      sendJson(response, 404, { error: "No se encontró el origen local del workspace." });
      return;
    }

    try {
      const relativePath = requestUrl.searchParams.get("path") || "";
      const result = await readSourceDirectory(root.local_path, relativePath);
      if (result.status !== 200) {
        sendJson(response, result.status, { error: result.error });
        return;
      }
      const rootPathSegments = displayPathSegments(root.local_path);
      sendJson(response, 200, {
        rootName: root.display_name,
        rootPathSegments,
        locationSegments: [...rootPathSegments, ...relativePath.split("/").filter(Boolean)],
        relativePath: result.relativePath,
        entries: result.entries,
        truncated: result.truncated
      });
    } catch (error) {
      if (error?.code === "ENOENT" || error?.code === "ENOTDIR"
        || error?.code === "EACCES" || error?.code === "EPERM") {
        sendJson(response, 503, { error: "No se pudo leer el directorio local." });
        return;
      }
      console.error("No se pudo leer el explorador local del workspace.");
      sendJson(response, 500, { error: "No se pudo consultar el directorio local." });
    }
    return;
  }

  const workspacePreferencesRoute = requestUrl.pathname.match(
    /^\/api\/workspaces\/([^/]+)\/preferences$/
  );
  if (workspacePreferencesRoute) {
    if (request.method !== "GET" && request.method !== "PATCH") {
      sendJson(response, 405, { error: "Este endpoint requiere GET o PATCH." });
      return;
    }
    let workspaceId;
    try {
      workspaceId = decodeURIComponent(workspacePreferencesRoute[1]);
    } catch {
      sendJson(response, 400, { error: "El identificador del workspace no es válido." });
      return;
    }
    try {
      if (request.method === "GET") {
        const preferences = getWorkspacePreferences(database, workspaceId);
        if (!preferences) {
          sendJson(response, 404, { error: "No se encontró el workspace solicitado." });
          return;
        }
        sendJson(response, 200, { preferences });
        return;
      }
      const patch = await readJsonBody(request);
      const result = patchWorkspacePreferences(database, workspaceId, patch);
      if (result.notFound) {
        sendJson(response, 404, { error: "No se encontró el workspace solicitado." });
      } else if (result.error) {
        sendJson(response, 400, { error: result.error });
      } else {
        sendJson(response, 200, { preferences: result.preferences });
      }
    } catch (error) {
      if (error.status) {
        sendJson(response, error.status, { error: error.message });
        return;
      }
      console.error("No se pudieron consultar las preferencias del workspace.");
      sendJson(response, 500, { error: "No se pudieron consultar las preferencias locales." });
    }
    return;
  }

  const projectPreferencesRoute = requestUrl.pathname.match(
    /^\/api\/projects\/([^/]+)\/preferences$/
  );
  if (projectPreferencesRoute) {
    if (request.method !== "GET" && request.method !== "PATCH") {
      sendJson(response, 405, { error: "Este endpoint requiere GET o PATCH." });
      return;
    }
    let projectIdentifier;
    try {
      projectIdentifier = decodeURIComponent(projectPreferencesRoute[1]);
    } catch {
      sendJson(response, 400, { error: "El identificador del proyecto no es válido." });
      return;
    }
    const project = findIndexedProject(database, projectIdentifier);
    if (!project) {
      sendJson(response, 404, { error: "No se encontró el proyecto solicitado." });
      return;
    }
    try {
      if (request.method === "GET") {
        sendJson(response, 200, { preferences: getProjectPreferences(database, project) });
        return;
      }
      const patch = await readJsonBody(request);
      const result = patchProjectPreferences(database, project, patch);
      if (result.error) {
        sendJson(response, 400, { error: result.error });
      } else {
        sendJson(response, 200, { preferences: result.preferences });
      }
    } catch (error) {
      if (error.status) {
        sendJson(response, error.status, { error: error.message });
        return;
      }
      console.error("No se pudieron consultar las preferencias del proyecto.");
      sendJson(response, 500, { error: "No se pudieron consultar las preferencias locales." });
    }
    return;
  }

  const scanRoute = requestUrl.pathname.match(/^\/api\/workspaces\/([^/]+)\/scan$/);
  if (scanRoute) {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "Este endpoint requiere el método POST." });
      return;
    }

    let workspaceId;
    try {
      workspaceId = decodeURIComponent(scanRoute[1]);
    } catch {
      sendJson(response, 400, { error: "El identificador del workspace no es válido." });
      return;
    }
    const root = database.prepare(`
      SELECT id FROM roots
      WHERE workspace_id = ? AND kind = 'local'
      ORDER BY created_at
      LIMIT 1
    `).get(workspaceId);
    if (!root) {
      sendJson(response, 404, { error: "No se encontró el workspace local solicitado." });
      return;
    }

    try {
      const scan = await scanWorkspace(database, root.id);
      sendJson(response, 200, { scan });
    } catch (error) {
      if (error?.code === "ENOENT" || error?.code === "ENOTDIR"
        || error?.code === "EACCES" || error?.code === "EPERM") {
        sendJson(response, 503, { error: "No se pudo acceder a la raíz local del workspace." });
        return;
      }
      console.error("Falló el reescaneo del workspace local.");
      sendJson(response, 500, { error: "No se pudo completar el reescaneo local." });
    }
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 404, { error: "No se encontró la ruta solicitada." });
    return;
  }

  try {
    if (requestUrl.pathname === "/api/projects") {
      sendJson(response, 200, { projects: listIndexedProjects(database) });
      return;
    }

    const projectRoute = requestUrl.pathname.match(/^\/api\/projects\/([^/]+)\/(tree|file)$/);
    if (!projectRoute) {
      sendJson(response, 404, { error: "No se encontró la ruta solicitada." });
      return;
    }

    let projectIdentifier;
    try {
      projectIdentifier = decodeURIComponent(projectRoute[1]);
    } catch {
      sendJson(response, 400, { error: "El identificador del proyecto no es válido." });
      return;
    }
    const project = findIndexedProject(database, projectIdentifier);
    if (!project) {
      sendJson(response, 404, { error: "No se encontró el proyecto solicitado." });
      return;
    }

    if (projectRoute[2] === "tree") {
      sendJson(response, 200, {
        rootName: project.relative_path,
        entries: readIndexedProjectTree(database, project)
      });
      return;
    }

    const projectDirectory = await resolveProjectDirectory(project);
    if (!projectDirectory) {
      sendJson(response, 404, { error: "No se encontró el proyecto solicitado en el filesystem." });
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
    sendJson(response, 500, { error: "No se pudo completar la consulta local." });
  }
});

async function startServer() {
  const workspace = await bootstrapDemoWorkspace(database, casesDirectory);
  if (workspace.scan?.failedProjects.length) {
    console.error(
      `El escaneo inicial no pudo completarse para: ${workspace.scan.failedProjects.join(", ")}.`
    );
  }
  server.listen(port, "127.0.0.1", () => {
    console.log(`API local de Kaktus disponible en http://127.0.0.1:${port} (SQLite inicializada).`);
  });
}

startServer().catch((error) => {
  console.error("No se pudo inicializar el workspace demo de Kaktus:", error);
  database.close();
  process.exitCode = 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    server.close(() => {
      database.close();
      process.exit(0);
    });
  });
}
