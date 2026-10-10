import { AudioLines, Code2, Construction, LockKeyhole } from "lucide-react";
import type { StudioViewId } from "../types";

type StudioViewSwitcherProps = {
  activeView: StudioViewId;
  onChange: (view: StudioViewId) => void;
};

const views: Array<{
  id: StudioViewId | "construction";
  label: string;
  icon: typeof Code2;
}> = [
  { id: "ide", label: "IDE", icon: Code2 },
  { id: "multipista", label: "Multipista", icon: AudioLines },
  { id: "construction", label: "En construcción", icon: Construction }
];

function StudioViewSwitcher({ activeView, onChange }: StudioViewSwitcherProps) {
  return (
    <div className="studio-view-switcher" role="group" aria-label="Vistas del Studio">
      {views.map(({ id, label, icon: Icon }) => {
        const isLocked = id === "construction";
        const isActive = !isLocked && activeView === id;
        return (
          <button
            className={`studio-view-switcher__button${isActive ? " is-active" : ""}${isLocked ? " is-locked" : ""}`}
            type="button"
            key={id}
            aria-pressed={isLocked ? undefined : isActive}
            aria-disabled={isLocked || undefined}
            title={isLocked ? "Esta vista aún está en construcción." : `Abrir vista ${label}`}
            onClick={() => {
              if (!isLocked) onChange(id);
            }}
          >
            <Icon size={14} />
            <span>{label}</span>
            {isLocked && <LockKeyhole size={11} />}
          </button>
        );
      })}
    </div>
  );
}

export default StudioViewSwitcher;
