const storageKey = "pulse-board-tasks-v1";
const statuses = ["todo", "doing", "done"];
const labels = {
  design: "Diseño",
  content: "Contenido",
  development: "Desarrollo",
  research: "Investigación"
};
const avatarClasses = ["avatar-peach", "avatar-blue", "avatar-lilac"];
const initialTasks = [
  { id: "t1", title: "Definir estructura de navegación", description: "Alinear las secciones y sus jerarquías antes de pasar a detalle.", status: "done", category: "research", priority: "normal", due: "09 oct", assignees: ["VP", "AM"], mine: true },
  { id: "t2", title: "Inventario de páginas actuales", description: "Listar vistas, estados vacíos y contenido que se debe conservar.", status: "done", category: "research", priority: "low", due: "10 oct", assignees: ["JC"], mine: false },
  { id: "t3", title: "Wireframes de escritorio", description: "Primera pasada para home, producto y carrito.", status: "doing", category: "design", priority: "high", due: "12 oct", assignees: ["VP"], mine: true },
  { id: "t4", title: "Revisar flujo de compra", description: "Comprobar puntos de entrada y mensajes después del checkout.", status: "doing", category: "design", priority: "normal", due: "14 oct", assignees: ["AM", "VP"], mine: false },
  { id: "t5", title: "Escribir textos de producto", description: "Tono cercano, claro y con información suficiente.", status: "todo", category: "content", priority: "normal", due: "16 oct", assignees: ["JC"], mine: false },
  { id: "t6", title: "Diseñar estados del carrito", description: "Carrito vacío, con productos y pedido completado.", status: "todo", category: "design", priority: "high", due: "17 oct", assignees: ["VP"], mine: true },
  { id: "t7", title: "Configurar catálogo local", description: "", status: "todo", category: "development", priority: "low", due: "19 oct", assignees: ["AM"], mine: false }
];

let tasks = loadTasks();
let searchTerm = "";
let onlyMine = false;
let priorityOnly = false;
let currentProject = "Rediseño web";
let toastTimeout;

const board = document.querySelector("#board");
const dialog = document.querySelector(".task-dialog");
const form = document.querySelector("#task-form");
const toast = document.querySelector("#toast");
const emptyMessage = document.querySelector("#empty-message");

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved) && saved.every(isValidTask)) return saved;
  } catch {
    // Invalid local data is replaced with the sample set.
  }
  return structuredClone(initialTasks);
}

function isValidTask(task) {
  return task
    && typeof task.id === "string"
    && typeof task.title === "string"
    && statuses.includes(task.status)
    && Object.hasOwn(labels, task.category)
    && ["low", "normal", "high"].includes(task.priority)
    && Array.isArray(task.assignees);
}

function persistTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function filteredTasks() {
  return tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.description}`.toLocaleLowerCase("es").includes(searchTerm);
    return matchesSearch && (!onlyMine || task.mine) && (!priorityOnly || task.priority === "high");
  });
}

function safeText(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function taskMarkup(task) {
  const dueClass = task.status !== "done" && task.due === "09 oct" ? " is-late" : "";
  const people = task.assignees.map((person, index) =>
    `<span class="avatar ${avatarClasses[index % avatarClasses.length]}">${safeText(person)}</span>`
  ).join("");
  const description = task.description ? `<p class="task-description">${safeText(task.description)}</p>` : "";
  return `
    <article class="task-card" data-task-id="${safeText(task.id)}">
      <div class="task-top"><span class="task-label ${task.category}">${labels[task.category]}</span><button class="task-menu" type="button" data-edit-task="${safeText(task.id)}" aria-label="Editar ${safeText(task.title)}">···</button></div>
      <h3 class="task-title">${safeText(task.title)}</h3>
      ${description}
      <div class="task-bottom"><div class="task-meta"><span class="due${dueClass}">◷ ${safeText(task.due || "Sin fecha")}</span><span class="priority ${task.priority}">${task.priority === "high" ? "ALTA" : task.priority === "low" ? "BAJA" : "NORMAL"}</span></div><div class="task-people">${people}</div></div>
    </article>`;
}

function render() {
  const visibleTasks = filteredTasks();
  for (const status of statuses) {
    const statusTasks = visibleTasks.filter((task) => task.status === status);
    document.querySelector(`[data-list="${status}"]`).innerHTML = statusTasks.map(taskMarkup).join("");
    document.querySelector(`[data-count="${status}"]`).textContent = statusTasks.length;
  }
  document.querySelector("#stat-total").textContent = tasks.length;
  const progress = tasks.filter((task) => task.status === "doing").length;
  const done = tasks.filter((task) => task.status === "done").length;
  document.querySelector("#active-count").textContent = tasks.filter((task) => task.status !== "done").length;
  document.querySelector("#stat-progress").textContent = progress;
  document.querySelector("#stat-done").textContent = done;
  document.querySelector("#progress-bar").style.width = `${tasks.length ? Math.round(progress / tasks.length * 100) : 0}%`;
  document.querySelector("#progress-caption").textContent = `${tasks.length ? Math.round(progress / tasks.length * 100) : 0}% del total`;
  emptyMessage.hidden = visibleTasks.length > 0;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function openTaskForm(task = null, status = "todo") {
  form.reset();
  document.querySelector("#dialog-title").textContent = task ? "Editar tarea" : "Nueva tarea";
  form.elements.id.value = task?.id || "";
  form.elements.title.value = task?.title || "";
  form.elements.description.value = task?.description || "";
  form.elements.status.value = task?.status || status;
  form.elements.priority.value = task?.priority || "normal";
  document.querySelector("#delete-task").hidden = !task;
  dialog.showModal();
  form.elements.title.focus();
}

document.querySelector("#new-task").addEventListener("click", () => openTaskForm());
document.querySelectorAll("[data-add-status]").forEach((button) => {
  button.addEventListener("click", () => openTaskForm(null, button.dataset.addStatus));
});

board.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-task]");
  if (!editButton) return;
  const task = tasks.find((item) => item.id === editButton.dataset.editTask);
  if (task) openTaskForm(task);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const id = String(formData.get("id") || "");
  const existingTask = tasks.find((task) => task.id === id);
  const task = {
    id: existingTask?.id || `t${Date.now()}`,
    title: String(formData.get("title")).trim(),
    description: String(formData.get("description")).trim(),
    status: String(formData.get("status")),
    category: existingTask?.category || "development",
    priority: String(formData.get("priority")),
    due: existingTask?.due || "Sin fecha",
    assignees: existingTask?.assignees || ["VP"],
    mine: existingTask?.mine ?? true
  };

  if (!task.title || !statuses.includes(task.status) || !["low", "normal", "high"].includes(task.priority)) {
    showToast("Revisa el nombre, estado y prioridad de la tarea.");
    return;
  }
  if (existingTask) tasks = tasks.map((item) => item.id === id ? task : item);
  else tasks.unshift(task);
  persistTasks();
  render();
  dialog.close();
  showToast(existingTask ? "Tarea actualizada." : "Tarea creada.");
});

document.querySelector("#delete-task").addEventListener("click", () => {
  const id = form.elements.id.value;
  tasks = tasks.filter((task) => task.id !== id);
  persistTasks();
  render();
  dialog.close();
  showToast("Tarea eliminada.");
});

document.querySelectorAll(".dialog-close, .cancel-button").forEach((button) => {
  button.addEventListener("click", () => dialog.close());
});

document.querySelector("#search").addEventListener("input", (event) => {
  searchTerm = event.target.value.trim().toLocaleLowerCase("es");
  render();
});

document.querySelector("#assignee-filter").addEventListener("change", (event) => {
  onlyMine = event.target.value === "you";
  render();
});

document.querySelector("#priority-filter").addEventListener("click", (event) => {
  priorityOnly = !priorityOnly;
  event.currentTarget.classList.toggle("is-active", priorityOnly);
  event.currentTarget.setAttribute("aria-pressed", String(priorityOnly));
  render();
});

function setBoardView(isList) {
  const listButton = document.querySelector("#list-view");
  const kanbanButton = document.querySelector("#kanban-view");
  board.classList.toggle("is-list", isList);
  listButton.classList.toggle("is-selected", isList);
  kanbanButton.classList.toggle("is-selected", !isList);
}

document.querySelector("#list-view").addEventListener("click", () => setBoardView(true));
document.querySelector("#kanban-view").addEventListener("click", () => setBoardView(false));

document.querySelectorAll(".side-link[data-page]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".side-link[data-page]").forEach((link) => link.classList.remove("is-active"));
    button.classList.add("is-active");
    showToast(`${button.textContent.trim()} estará disponible en la siguiente versión.`);
  });
});

document.querySelectorAll(".project-link").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".project-link").forEach((link) => link.classList.remove("is-selected"));
    button.classList.add("is-selected");
    currentProject = button.dataset.project;
    document.querySelector("#current-project").textContent = currentProject;
    showToast(`Proyecto seleccionado: ${currentProject}.`);
  });
});

document.querySelector("#reset-demo").addEventListener("click", () => {
  tasks = structuredClone(initialTasks);
  persistTasks();
  render();
  showToast("Tablero de demostración restablecido.");
});

document.querySelector("#help-button").addEventListener("click", () => {
  showToast("Atajo: usa el campo de búsqueda para filtrar tareas.");
});

document.querySelector("#notifications").addEventListener("click", () => {
  showToast("Estás al día. No hay notificaciones nuevas.");
});

document.querySelector("#add-project").addEventListener("click", () => {
  showToast("Los proyectos de este demo son ejemplos fijos.");
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#search").focus();
  }
});

render();
