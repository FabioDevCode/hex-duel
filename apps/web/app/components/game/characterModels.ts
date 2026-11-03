import type { Group } from "three";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * GLB character models (see the .manifest.json files for reference data).
 * Seat 0 = red samurai, seat 1 = blue knight.
 *
 * The models are loaded in their rest pose (no animation yet), normalized
 * to TARGET_HEIGHT (~2x the previous procedural characters, which stood
 * around 2.1 units), with their feet on the ground.
 */

const TARGET_HEIGHT = 4.4;

// Served statically from public/models (see the manifests in
// app/assets/models for reference data on these files).
const MODEL_URLS = ["/models/samourai.glb", "/models/chevalier.glb"] as const;

let loader: GLTFLoader | null = null;
const getLoader = (): GLTFLoader => {
  if (!loader) loader = new GLTFLoader();
  return loader;
};

/**
 * Loads the character for a seat (0 = samurai, 1 = knight) in rest pose,
 * scaled to the target height with feet on the ground (y = 0).
 */
export const loadCharacterModel = (seat: 0 | 1): Promise<Group> =>
  new Promise<Group>((resolve, reject) => {
    getLoader().load(
      MODEL_URLS[seat],
      (gltf) => {
        const model = gltf.scene;
        const box = new Box3().setFromObject(model);
        const size = box.getSize(new Vector3());
        const height = size.y || 1;
        const scale = TARGET_HEIGHT / height;
        model.scale.setScalar(scale);
        // Feet on the ground: offset by the (scaled) lowest point.
        model.position.y = -box.min.y * scale;
        // Face the opponent: seat 0 starts at x = -6 (looks toward +X),
        // seat 1 at x = +6 (looks toward -X).
        model.rotation.y = seat === 0 ? Math.PI / 2 : -Math.PI / 2;
        resolve(model);
      },
      undefined,
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
    );
  });
