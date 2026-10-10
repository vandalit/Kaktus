const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { createOrder, listProducts } = require("./database");

const frontendDirectory = path.join(__dirname, "..", "frontend");
const port = Number(process.env.PORT || 4171);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 16_384) {
        reject(new Error("El contenido de la solicitud es demasiado grande."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("El cuerpo debe ser JSON válido."));
      }
    });
    request.on("error", reject);
  });
}

function validOrder(payload) {
  return payload
    && typeof payload.customerName === "string"
    && payload.customerName.trim().length > 0
    && payload.customerName.trim().length <= 80
    && Array.isArray(payload.items)
    && payload.items.length > 0
    && payload.items.length <= 30
    && payload.items.every((item) =>
      Number.isSafeInteger(item.productId)
      && item.productId > 0
      && Number.isSafeInteger(item.quantity)
      && item.quantity > 0
      && item.quantity <= 20
    );
}

function serveStatic(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(frontendDirectory, `.${requestedPath}`);

  if (!filePath.startsWith(`${frontendDirectory}${path.sep}`)) {
    sendJson(response, 403, { error: "Ruta no permitida." });
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      sendJson(response, error.code === "ENOENT" ? 404 : 500, {
        error: error.code === "ENOENT" ? "No se encontró el archivo." : "No se pudo leer el archivo."
      });
      return;
    }
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(contents);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/api/products") {
    sendJson(response, 200, { products: listProducts.all() });
    return;
  }

  if (request.method === "POST" && request.url === "/api/orders") {
    try {
      const payload = await readJson(request);
      if (!validOrder(payload)) {
        sendJson(response, 400, { error: "Revisa el nombre y los productos del pedido." });
        return;
      }
      const order = createOrder(
        payload.customerName.trim(),
        payload.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      );
      sendJson(response, 201, { order });
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : "No se pudo completar el pedido."
      });
    }
    return;
  }

  if (request.method === "GET") {
    serveStatic(request, response);
    return;
  }

  sendJson(response, 405, { error: "Método no permitido." });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mini Store disponible en http://localhost:${port}`);
});
