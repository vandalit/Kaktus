import { useState } from "react";
import { Check, Palette, Type } from "lucide-react";

type DesignProfile = {
  name: string;
  palette: Array<{ id: string; name: string; hex: string }>;
  typefaces: Array<{ id: string; name: string; role: string; family: string }>;
  tokens: Array<{ id: string; name: string; value: string }>;
};

const profiles: Record<string, DesignProfile> = {
  "01-mini-store": {
    name: "MINI STORE",
    palette: [
      { id: "paper", name: "PAPER", hex: "#F7F4EC" },
      { id: "ink", name: "INK", hex: "#24251F" },
      { id: "brand", name: "BRAND", hex: "#E8A93A" },
      { id: "sage", name: "SAGE", hex: "#E3E9DE" },
      { id: "clay", name: "CLAY", hex: "#F2DFD1" }
    ],
    typefaces: [
      { id: "ui", name: "System UI", role: "INTERFAZ", family: "system-ui, sans-serif" },
      { id: "mono", name: "DM Mono", role: "DATOS", family: "monospace" },
      { id: "display", name: "Georgia", role: "ACENTO", family: "Georgia, serif" }
    ],
    tokens: [
      { id: "radius", name: "RADIUS", value: "12 PX" },
      { id: "space", name: "SPACE", value: "16 PX" },
      { id: "border", name: "BORDER", value: "HAIRLINE" },
      { id: "shadow", name: "SHADOW", value: "SOFT" }
    ]
  },
  "02-forma-studio": {
    name: "FORMA STUDIO",
    palette: [
      { id: "paper", name: "PAPER", hex: "#F4F2ED" },
      { id: "ink", name: "INK", hex: "#21211E" },
      { id: "brand", name: "ACID", hex: "#DCF45D" },
      { id: "coral", name: "CORAL", hex: "#FF7854" },
      { id: "mist", name: "MIST", hex: "#C3DDD8" }
    ],
    typefaces: [
      { id: "ui", name: "Manrope", role: "INTERFAZ", family: "Manrope, sans-serif" },
      { id: "mono", name: "DM Mono", role: "ETIQUETAS", family: "monospace" },
      { id: "display", name: "Georgia", role: "EDITORIAL", family: "Georgia, serif" }
    ],
    tokens: [
      { id: "radius", name: "RADIUS", value: "02 PX" },
      { id: "space", name: "SPACE", value: "CLAMP" },
      { id: "border", name: "BORDER", value: "1 PX" },
      { id: "motion", name: "MOTION", value: "REVEAL" }
    ]
  },
  "03-pulse-board": {
    name: "PULSE BOARD",
    palette: [
      { id: "paper", name: "PAPER", hex: "#F7F8FB" },
      { id: "ink", name: "INK", hex: "#272A36" },
      { id: "brand", name: "PULSE", hex: "#7963DE" },
      { id: "peach", name: "PEACH", hex: "#F8DEBF" },
      { id: "line", name: "LINE", hex: "#ECEEF3" }
    ],
    typefaces: [
      { id: "ui", name: "DM Sans", role: "INTERFAZ", family: '"DM Sans", sans-serif' },
      { id: "display", name: "Space Grotesk", role: "TÍTULOS · --mono", family: '"Space Grotesk", sans-serif' }
    ],
    tokens: [
      { id: "radius", name: "RADIUS", value: "12 PX" },
      { id: "space", name: "SPACE", value: "16 PX" },
      { id: "border", name: "BORDER", value: "SOFT" },
      { id: "shadow", name: "SHADOW", value: "CARD" }
    ]
  }
};

function DesignSystemCanvas({ projectId }: { projectId: string }) {
  const profile = profiles[projectId] ?? profiles["01-mini-store"];
  const [selectedColor, setSelectedColor] = useState(profile.palette[2].id);
  const [selectedTypeface, setSelectedTypeface] = useState("ui");
  const [activeTokens, setActiveTokens] = useState(() => new Set(profile.tokens.map(({ id }) => id)));
  const color = profile.palette.find(({ id }) => id === selectedColor) ?? profile.palette[0];

  function toggleToken(tokenId: string) {
    setActiveTokens((current) => {
      const next = new Set(current);
      if (next.has(tokenId)) next.delete(tokenId);
      else next.add(tokenId);
      return next;
    });
  }

  return (
    <section className="design-system-canvas" aria-label={`Guía de estilo de ${profile.name}`}>
      <header className="anatomy-canvas__header">
        <div className="anatomy-canvas__identity">
          <span className="anatomy-canvas__mark"><Palette size={13} aria-hidden="true" /></span>
          <span>
            <strong>GUÍA DE ESTILO</strong>
            <small>{profile.name} / BRAND KIT</small>
          </span>
        </div>
        <span className="design-system__source">MOCK · NO APLICA AL CÓDIGO</span>
      </header>

      <div className="design-system__body">
        <div className="design-system__preview">
          <span className="design-system__preview-swatch" style={{ backgroundColor: color.hex }} />
          <span><strong>{color.name}</strong><small>{color.hex} · TOKEN ACTIVO</small></span>
          <span className="design-system__preview-mark">Aa</span>
        </div>

        <section className="design-system__section" aria-labelledby={`${projectId}-palette-label`}>
          <h3 id={`${projectId}-palette-label`}><Palette size={10} aria-hidden="true" /> COLOR DE MARCA <small>01 / 05</small></h3>
          <div className="design-system__palette">
            {profile.palette.map((swatch) => (
              <button
                className={`design-system__swatch${selectedColor === swatch.id ? " is-selected" : ""}`}
                key={swatch.id}
                type="button"
                aria-label={`${swatch.name}, ${swatch.hex}`}
                aria-pressed={selectedColor === swatch.id}
                onClick={() => setSelectedColor(swatch.id)}
              >
                <span style={{ backgroundColor: swatch.hex }}>
                  {selectedColor === swatch.id && <Check size={10} aria-hidden="true" />}
                </span>
                <small>{swatch.name}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="design-system__section" aria-labelledby={`${projectId}-type-label`}>
          <h3 id={`${projectId}-type-label`}><Type size={10} aria-hidden="true" /> TIPOGRAFÍA <small>02 / 03</small></h3>
          <div className="design-system__typefaces">
            {profile.typefaces.map((typeface) => (
              <button
                className={`design-system__typeface${selectedTypeface === typeface.id ? " is-selected" : ""}`}
                key={typeface.id}
                type="button"
                aria-pressed={selectedTypeface === typeface.id}
                onClick={() => setSelectedTypeface(typeface.id)}
              >
                <span style={{ fontFamily: typeface.family }}>Aa</span>
                <span><strong>{typeface.name}</strong><small>{typeface.role}</small></span>
              </button>
            ))}
          </div>
        </section>

        <section className="design-system__section" aria-labelledby={`${projectId}-tokens-label`}>
          <h3 id={`${projectId}-tokens-label`}>TOKENS DE INTERFAZ <small>03 / CMS</small></h3>
          <div className="design-system__tokens">
            {profile.tokens.map((token) => (
              <button
                className={`design-system__token${activeTokens.has(token.id) ? " is-active" : ""}`}
                key={token.id}
                type="button"
                aria-pressed={activeTokens.has(token.id)}
                onClick={() => toggleToken(token.id)}
              >
                <span>{token.name}</span><strong>{token.value}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>

      <footer className="anatomy-canvas__tags">
        <span>#branding</span><span>#tipografía</span><span>#design-tokens</span>
      </footer>
    </section>
  );
}

export default DesignSystemCanvas;
