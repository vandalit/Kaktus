import { useEffect, useRef, useState } from "react";
import { ArrowRight, CircleAlert, FolderOpen, Github, HardDrive, Layers3, X } from "lucide-react";
import StatusBanner from "../components/StatusBanner";

type OnboardingScreenProps = {
  onConnectDemo: () => void;
};

function OnboardingScreen({ onConnectDemo }: OnboardingScreenProps) {
  const [dialogOpen, setDialogOpen] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && dialogOpen && !dialog.open) dialog.showModal();
    if (dialog && !dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  function connectDemo() {
    dialogRef.current?.close();
    onConnectDemo();
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
          <button className="source-card source-card--available" type="button" onClick={() => setDialogOpen(true)}>
            <span className="source-card__icon"><FolderOpen size={20} /></span>
            <span className="source-card__copy">
              <span className="source-card__eyebrow">CARPETA LOCAL</span>
              <strong>Explorar una carpeta</strong>
              <small>Para esta demo, abre el workspace incluido.</small>
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
          El selector de carpetas y la conexión a GitHub son representativos. La acción disponible carga
          el workspace local de demostración <code>CaseUses/</code>.
        </StatusBanner>

        <div className="onboarding__footnote">
          <span><HardDrive size={14} /> SOLO LECTURA EN ESTA DEMO</span>
          <span>NO SE SUBE CÓDIGO A NINGÚN SERVICIO</span>
        </div>
      </div>

      <dialog
        className="demo-dialog"
        ref={dialogRef}
        aria-labelledby="demo-dialog-title"
        onClose={() => setDialogOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="demo-dialog__topline">
          <span className="demo-dialog__icon"><Layers3 size={18} /></span>
          <button className="demo-dialog__close" type="button" aria-label="Cerrar aviso" onClick={() => dialogRef.current?.close()}>
            <X size={17} />
          </button>
        </div>
        <div className="demo-dialog__eyebrow"><CircleAlert size={13} /> ACCESO DE DEMOSTRACIÓN</div>
        <h2 id="demo-dialog-title">Solo puedes conectar el repo demo</h2>
        <p>
          El onboarding es una maqueta: la selección de carpetas reales y la conexión a GitHub aún no
          están habilitadas. Puedes continuar con el workspace local incluido en Kaktus.
        </p>
        <div className="demo-dialog__repo">
          <span className="demo-dialog__repo-icon"><FolderOpen size={17} /></span>
          <span><strong>Kaktus · CaseUses</strong><small>Workspace local de demostración</small></span>
          <span className="demo-dialog__repo-state">DISPONIBLE</span>
        </div>
        <StatusBanner tone="warning" label="NO CONECTA A GITHUB">
          No se solicitarán credenciales ni se clonará un repositorio remoto.
        </StatusBanner>
        <div className="demo-dialog__actions">
          <button className="button-secondary" type="button" onClick={() => dialogRef.current?.close()}>Volver</button>
          <button className="button-primary" type="button" onClick={connectDemo}>Conectar repo demo <ArrowRight size={16} /></button>
        </div>
      </dialog>
    </main>
  );
}

export default OnboardingScreen;
