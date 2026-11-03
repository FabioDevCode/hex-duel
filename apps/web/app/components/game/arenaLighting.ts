import { GAME_CONFIG } from "@hex-duel/shared";
import type { Scene } from "three";
import type { Object3D } from "three";
import { DirectionalLight, HemisphereLight } from "three";

/**
 * Reusable arena lighting: an invisible sun (directional light with soft
 * shadows, tilted ~35 degrees from the vertical, coming from the south)
 * plus a soft hemisphere light so shadowed areas never go fully black.
 *
 * The light sources themselves are never rendered - only their effects.
 */

const SUN_TILT_DEG = 35;
const SUN_HEIGHT = 24;

export type ArenaLighting = {
  /** The directional sun light (already added to the scene, shadow-casting). */
  sun: DirectionalLight;
  /** The ambient hemisphere light (already added to the scene). */
  hemisphere: HemisphereLight;
  /** Removes the lights from the scene and disposes the shadow map. */
  dispose: () => void;
};

export const createArenaLighting = (scene: Scene): ArenaLighting => {
  const arenaRadius = GAME_CONFIG.arenaRadius;

  // --- Sun: directional, tilted from the south (positive Z side). ---
  const sun = new DirectionalLight(0xfff4e0, 2.4);
  const tilt = (SUN_TILT_DEG * Math.PI) / 180;
  sun.position.set(
    0,
    Math.cos(tilt) * SUN_HEIGHT,
    Math.sin(tilt) * SUN_HEIGHT,
  );
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;

  // Shadow camera fitted exactly to the arena, no wasted margin.
  const shadowCamera = sun.shadow.camera;
  shadowCamera.left = -arenaRadius;
  shadowCamera.right = arenaRadius;
  shadowCamera.top = arenaRadius;
  shadowCamera.bottom = -arenaRadius;
  shadowCamera.near = 1;
  shadowCamera.far = SUN_HEIGHT * 2.5;
  sun.shadow.mapSize.set(2048, 2048);
  // Slightly negative bias avoids shadow acne on the ground.
  sun.shadow.bias = -0.0005;

  scene.add(sun);
  scene.add(sun.target);

  // --- Ambient: soft hemisphere so shadows stay readable, never black. ---
  const hemisphere = new HemisphereLight(0xdfe8ff, 0x8a7a66, 0.55);
  scene.add(hemisphere);

  return {
    sun,
    hemisphere,
    dispose: () => {
      scene.remove(sun);
      scene.remove(sun.target);
      scene.remove(hemisphere);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    },
  };
};

/**
 * Marks every mesh of a (possibly skinned) character model as a shadow
 * caster. Uses traverse(): skinned GLB models carry their meshes deep in
 * the hierarchy, so setting the flag on the root is not enough.
 */
export const enableCharacterShadows = (model: Object3D): void => {
  model.traverse((object) => {
    const mesh = object as { castShadow?: boolean; isMesh?: boolean };
    if (mesh.isMesh) mesh.castShadow = true;
  });
};
