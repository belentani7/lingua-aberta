import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";

export type GameHandle = { scene: Scene; dispose: () => void };

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.025, 0.008, 0.055, 0);
  const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.1, 9, Vector3.Zero(), scene);
  camera.attachControl(canvas, false);
  camera.lowerRadiusLimit = 9;
  camera.upperRadiusLimit = 9;
  camera.inputs.clear();
  const light = new HemisphericLight("liquid-light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.25;
  light.diffuse = new Color3(1, 0.12, 0.28);
  light.groundColor = new Color3(0.08, 0.02, 0.15);

  const glow = new GlowLayer("red-glow", scene);
  glow.intensity = 0.85;
  const red = new StandardMaterial("red-liquid", scene);
  red.diffuseColor = new Color3(1, 0.06, 0.2);
  red.emissiveColor = new Color3(0.75, 0.015, 0.08);
  const cyan = new StandardMaterial("cyan-liquid", scene);
  cyan.diffuseColor = new Color3(0.12, 0.75, 1);
  cyan.emissiveColor = new Color3(0.02, 0.35, 0.75);

  const motes = Array.from({ length: 28 }, (_, index) => {
    const mesh = MeshBuilder.CreateSphere(`mote-${index}`, { diameter: 0.035 + (index % 4) * 0.012 }, scene);
    mesh.position = new Vector3((index % 7) - 3, ((index * 5) % 9) - 4, ((index * 3) % 5) - 2);
    mesh.material = index % 5 === 0 ? cyan : red;
    return { mesh, phase: index * 0.44, speed: 0.00025 + (index % 5) * 0.00005 };
  });

  const timeObserver = scene.onBeforeRenderObservable.add(() => {
    const now = performance.now();
    motes.forEach(({ mesh, phase, speed }) => {
      mesh.position.y += Math.sin(now * speed + phase) * 0.0006;
      mesh.position.x += Math.cos(now * speed * 0.7 + phase) * 0.00025;
      mesh.scaling.setAll(0.72 + ((Math.sin(now * speed * 1.7 + phase) + 1) / 2) * 0.6);
    });
  });

  return {
    scene,
    dispose: () => {
      scene.onBeforeRenderObservable.remove(timeObserver);
      scene.dispose();
    },
  };
}