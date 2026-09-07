import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { createGameScene } from "@/game/scene";

/** Lingua Abierta: el canvas es una capa atmosférica de luz líquida, no compite con la lectura. */
export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || started.current) return;
    started.current = true;
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, premultipliedAlpha: true });
    let disposed = false;
    let handle: Awaited<ReturnType<typeof createGameScene>> | undefined;

    createGameScene(engine, canvas).then((nextHandle) => {
      if (disposed) {
        nextHandle.dispose();
        engine.dispose();
        return;
      }
      handle = nextHandle;
      engine.runRenderLoop(() => nextHandle.scene.render());
    });

    const resize = () => engine.resize();
    window.addEventListener("resize", resize, { passive: true });
    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      handle?.dispose();
      engine.stopRenderLoop();
      engine.dispose();
      started.current = false;
    };
  }, []);

  return <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />;
}