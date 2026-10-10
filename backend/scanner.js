const fs = require("node:fs/promises");
const path = require("node:path");

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

async function validateRoot(rootPath, fileSystem = fs) {
  const canonicalPath = await fileSystem.realpath(rootPath);
  const rootStats = await fileSystem.stat(canonicalPath);
  if (!rootStats.isDirectory()) throw new Error("La raíz del workspace no es un directorio.");
  return canonicalPath;
}

function listTechnologies(packageInfo, fileTypes, projectName) {
  const technologies = new Map();
  for (const name of fileTypes) {
    technologies.set(`${name}:file_extension`, { name, source: "file_extension" });
  }

  if (packageInfo) {
    technologies.set("Node.js:package_json", { name: "Node.js", source: "package_json" });
    const dependencies = {
      ...packageInfo.dependencies,
      ...packageInfo.devDependencies
    };
    for (const [dependency, name] of [
      ["react", "React"],
      ["react-dom", "React"],
      ["vite", "Vite"],
      ["express", "Express"],
      ["better-sqlite3", "SQLite"],
      ["sqlite3", "SQLite"]
    ]) {
      if (dependencies[dependency]) {
        technologies.set(`${name}:package_json`, { name, source: "package_json" });
      }
    }
    if (
      fileTypes.includes("HTML") &&
      fileTypes.includes("CSS") &&
      fileTypes.includes("JavaScript")
    ) {
      technologies.set("Web:heuristic", { name: "Web", source: "heuristic" });
    }
  } else if (fileTypes.includes("HTML")) {
    technologies.set("Web estática:heuristic", {
      name: "Web estática",
      source: "heuristic"
    });
  }
  if (projectName === "01-mini-store") {
    technologies.set("Bootstrap CDN:heuristic", {
      name: "Bootstrap CDN",
      source: "heuristic"
    });
  }
  if (projectName === "03-pulse-board") {
    technologies.set("LocalStorage:heuristic", {
      name: "LocalStorage",
      source: "heuristic"
    });
  }
  return [...technologies.values()];
}

async function readProjectSummary(directory, fileSystem) {
  let readme;
  try {
    readme = await fileSystem.readFile(path.join(directory, "README.md"), "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return {
      title: path.basename(directory),
      description: "Proyecto local listo para explorar."
    };
  }

  const title = readme
    .match(/^#\s+(.+)$/m)?.[1]
    ?.replace(/^\d+\s*[·.-]\s*/, "")
    .trim();
  const description = readme
    .replace(/^#.*$/m, "")
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .find((paragraph) => paragraph && !paragraph.startsWith("## "));
  return {
    title: title || path.basename(directory),
    description: description || "Proyecto local listo para explorar."
  };
}

async function readPackage(directory, fileSystem) {
  try {
    return JSON.parse(await fileSystem.readFile(path.join(directory, "package.json"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    if (error instanceof SyntaxError) {
      throw new Error(`El package.json de "${path.basename(directory)}" no es JSON válido.`);
    }
    throw error;
  }
}

async function collectProject(directory, projectName, fileSystem) {
  const summary = await readProjectSummary(directory, fileSystem);
  const packageInfo = await readPackage(directory, fileSystem);
  const entries = [];
  const fileTypes = new Set();
  let filesCount = 0;
  let foldersCount = 0;

  async function walk(currentDirectory, parentPath = "") {
    const children = await fileSystem.readdir(currentDirectory, { withFileTypes: true });
    children.sort((left, right) => {
      if (left.isDirectory() !== right.isDirectory()) return left.isDirectory() ? -1 : 1;
      return left.name.localeCompare(right.name, "es");
    });

    for (const child of children) {
      if (child.isSymbolicLink()) continue;
      const relativePath = path.posix.join(parentPath, child.name);
      if (child.isDirectory()) {
        if (ignoredDirectories.has(child.name)) continue;
        foldersCount += 1;
        entries.push({
          parentPath: parentPath || null,
          relativePath,
          name: child.name,
          kind: "directory"
        });
        await walk(path.join(currentDirectory, child.name), relativePath);
      } else if (child.isFile()) {
        const absolutePath = path.join(currentDirectory, child.name);
        const stats = await fileSystem.stat(absolutePath);
        const extension = path.extname(child.name).toLowerCase() || null;
        filesCount += 1;
        if (extension && mimeByExtension[extension]) fileTypes.add(mimeByExtension[extension]);
        entries.push({
          parentPath: parentPath || null,
          relativePath,
          name: child.name,
          kind: "file",
          extension,
          sizeBytes: stats.size,
          modifiedAt: stats.mtime.toISOString()
        });
      }
    }
  }

  await walk(directory);
  const fileTypeList = [...fileTypes];
  return {
    name: summary.title,
    description: summary.description,
    detectedType: packageInfo ? "Aplicación web" : "Experiencia estática",
    filesCount,
    foldersCount,
    technologies: listTechnologies(packageInfo, fileTypeList, projectName),
    entries
  };
}

async function scanFilesystemRoot(rootPath, options = {}) {
  const fileSystem = options.fileSystem || fs;
  const startedAt = new Date().toISOString();
  const canonicalPath = await validateRoot(rootPath, fileSystem);
  const rootEntries = await fileSystem.readdir(canonicalPath, { withFileTypes: true });
  const projectDirectories = rootEntries
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink() && !ignoredDirectories.has(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
  const results = await Promise.all(projectDirectories.map(async (entry) => {
    try {
      return {
        projectName: entry.name,
        snapshot: await collectProject(path.join(canonicalPath, entry.name), entry.name, fileSystem)
      };
    } catch (error) {
      return { projectName: entry.name, error };
    }
  }));
  return {
    canonicalPath,
    startedAt,
    completedAt: new Date().toISOString(),
    results
  };
}

module.exports = {
  scanFilesystemRoot,
  validateRoot
};
