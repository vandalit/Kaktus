import type { ReactNode } from "react";

type StatusBannerProps = {
  tone: "info" | "warning";
  label: string;
  children: ReactNode;
};

function StatusBanner({ tone, label, children }: StatusBannerProps) {
  return (
    <aside className={`status-banner status-banner--${tone}`} role="note">
      <span className="status-banner__label">{label}</span>
      <span className="status-banner__message">{children}</span>
    </aside>
  );
}

export default StatusBanner;
