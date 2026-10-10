const panels = [...document.querySelectorAll("[data-view-panel]")];
const navLinks = [...document.querySelectorAll(".nav-link")];
const dialog = document.querySelector(".project-dialog");

function showView(viewName, updateHistory = true) {
  const nextPanel = panels.find((panel) => panel.dataset.viewPanel === viewName) || panels[0];
  for (const panel of panels) {
    panel.hidden = panel !== nextPanel;
    panel.classList.toggle("is-active", panel === nextPanel);
    panel.classList.remove("is-entering");
  }
  for (const link of navLinks) {
    link.classList.toggle("is-active", link.dataset.view === nextPanel.dataset.viewPanel);
  }
  requestAnimationFrame(() => nextPanel.classList.add("is-entering"));
  if (updateHistory) history.pushState({ view: nextPanel.id }, "", `#${nextPanel.id}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

for (const link of navLinks) {
  link.addEventListener("click", () => showView(link.dataset.view));
}

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.go));
});

window.addEventListener("popstate", () => {
  showView(location.hash.slice(1) || "inicio", false);
});

for (const card of document.querySelectorAll("[data-project]")) {
  card.addEventListener("click", () => {
    dialog.querySelector("h2").textContent = card.dataset.project;
    dialog.querySelector(".dialog-description").textContent = card.dataset.description;
    dialog.showModal();
  });
}

dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

showView(location.hash.slice(1) || "inicio", false);
