import { LayoutGrid, Terminal } from "lucide-react";
import type { DashboardView } from "../types";

type DashboardViewSwitcherProps = {
  activeView: DashboardView;
  onChange: (view: DashboardView) => void;
};

const views: Array<{ id: DashboardView; label: string; icon: typeof LayoutGrid; title: string }> = [
  { id: "projects", label: "Proyectos", icon: LayoutGrid, title: "Vista visual de proyectos" },
  { id: "console", label: "Consola", icon: Terminal, title: "Vista técnica tipo consola" }
];

function DashboardViewSwitcher({ activeView, onChange }: DashboardViewSwitcherProps) {
  return (
    <div className="dashboard-view-switcher" role="group" aria-label="Vista del dashboard">
      {views.map(({ id, label, icon: Icon, title }) => (
        <button
          className={`dashboard-view-switcher__button${activeView === id ? " is-active" : ""}`}
          key={id}
          type="button"
          aria-pressed={activeView === id}
          title={title}
          onClick={() => onChange(id)}
        >
          <Icon size={15} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export default DashboardViewSwitcher;
