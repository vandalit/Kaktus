import { useState } from "react";
import { ArrowRight, FolderOpen, Github, HardDrive } from "lucide-react";
import LocalFolderExplorer from "../components/LocalFolderExplorer";
import StatusBanner from "../components/StatusBanner";

type OnboardingScreenProps = {
  onConnectDemo: () => void;
};

function OnboardingScreen({ onConnectDemo }: OnboardingScreenProps) {
  const [browserOpen, setBrowserOpen] = useState(false);

  if (browserOpen) {
    return (
      <LocalFolderExplorer
        workspaceId="workspace-demo"
        onBack={() => setBrowserOpen(false)}
        onAccept={onConnectDemo}
      />
    );
  }

  return (
    <main className="onboarding">
      <header className="onboarding__topbar">
        <a className="brand" href="/" aria-label="Kaktus, inicio">
          <span className="brand-mark"><span /></span>
          <span>Kaktus</span>
          <span className="brand-beta">LOCAL IDE</span>
        </a>
        <span className="onboarding__step">INICIO <span>/</span> CONECTAR UN ORIGEN</span>
      </header>

      <div className="onboarding__content">
        <div className="onboarding__heading">
          <div className="onboarding__eyebrow"><span /> ESPACIO DE TRABAJO LOCAL</div>
          <h1>¿Qué vamos a <span>explorar?</span></h1>
          <p>Elige una carpeta o conecta un repositorio para comenzar a entender su estructura.</p>
        </div>

        <StatusBanner tone="info" label="DEMO LOCAL">
          En esta etapa puedes abrir únicamente el repositorio de demostración incluido con Kaktus.
          Tus archivos permanecen en este equipo.
        </StatusBanner>

        <section className="source-options" aria-label="Opciones de origen">
          <button className="source-card source-card--available" type="button" onClick={() => setBrowserOpen(true)}>
            <span className="source-card__icon"><FolderOpen size={20} /></span>
            <span className="source-card__copy">
              <span className="source-card__eyebrow">CARPETA LOCAL</span>
              <strong>Explorar una carpeta</strong>
              <small>Inspecciona el filesystem; la raíz demo está fijada.</small>
            </span>
            <ArrowRight className="source-card__arrow" size={18} />
            <span className="source-card__badge">DEMO DISPONIBLE</span>
          </button>

          <button className="source-card source-card--disabled" type="button" disabled aria-describedby="remote-unavailable">
            <span className="source-card__icon"><Github size={20} /></span>
            <span className="source-card__copy">
              <span className="source-card__eyebrow">GITHUB / REMOTO</span>
              <strong>Conectar un repositorio</strong>
              <small id="remote-unavailable">La conexión remota todavía no está disponible.</small>
            </span>
            <span className="source-card__badge">NO DISPONIBLE</span>
          </button>
        </section>

        <StatusBanner tone="warning" label="ALCANCE ACTUAL">
          El explorador lee el filesystem real de <code>CaseUses/</code>, pero no permite cambiar la raíz.
          La conexión a GitHub todavía es solo una representación.
        </StatusBanner>

        <div className="onboarding__footnote">
          <span><HardDrive size={14} /> SOLO LECTURA EN ESTA DEMO</span>
          <span>NO SE SUBE CÓDIGO A NINGÚN SERVICIO</span>
        </div>
      </div>

    </main>
  );
}

export default OnboardingScreen;
