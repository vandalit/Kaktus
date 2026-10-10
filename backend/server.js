const fs = require("node:fs/promises");
const http = require("node:http");
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
