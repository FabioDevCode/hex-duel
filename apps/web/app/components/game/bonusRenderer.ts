import type { Group, Material, Object3D } from "three";
import { Color, Mesh, MeshStandardMaterial, RingGeometry } from "three";
import type { BonusType, GroundBonus } from "@hex-duel/shared";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Ground bonus rendering (UI_UX_SPEC 30.1): each bonus model levitates above
 * its arena spot with a colored ground marker. On its spawn turn the model
 * is opaque; on the following (last) turn it becomes translucent.
 */

const BONUS_URLS: Record<BonusType, string> = {
  REGEN: "/models/bonus-crystal.glb",
  ATTACK: "/models/bonus-atk.glb",
  MOVE: "/models/bonus-move.glb",
  SHIELD: "/models/bonus-shield.glb",
};

/** Marker color per type, matching each model's identity. */
export const BONUS_COLORS: Record<BonusType, number> = {
  REGEN: 0x42c98a,
  ATTACK: 0xff4d5a,
  MOVE: 0x4d91ff,
  SHIELD: 0xffe37c,
};

// Scene scale: the raw models are ~1.9 units like the raw characters,
// tuned to 80% of the original display size.
const BONUS_SCALE = 0.88;
const LEVITATION_BASE_Y = 1.6;
const LEVITATION_AMPLITUDE = 0.25;
const LEVITATION_SPEED = 2;
const SPIN_SPEED = 0.8;
const MARKER_INNER = 0.7;
const MARKER_OUTER = 1.0;
/** Opaque on the spawn turn, translucent on the last one. */
const LAST_TURN_OPACITY = 0.45;

let loader: GLTFLoader | null = null;
const getLoader = (): GLTFLoader => {
  if (!loader) loader = new GLTFLoader();
  return loader;
};

const modelCache = new Map<BonusType, Promise<Group>>();

export const loadBonusModel = (type: BonusType): Promise<Group> => {
  let promise = modelCache.get(type);
  if (!promise) {
    promise = new Promise<Group>((resolve, reject) => {
      getLoader().load(
        BONUS_URLS[type],
        (gltf) => resolve(gltf.scene),
        undefined,
        (error) => reject(error instanceof Error ? error : new Error(String(error))),
      );
    });
    modelCache.set(type, promise);
  }
  return promise;
};

/** Preloads every bonus model (call once at scene setup). */
export const preloadBonusModels = (): Promise<unknown> =>
  Promise.all(Object.values(BONUS_URLS).map((url) => url)).then(() =>
    Promise.all([loadBonusModel("REGEN"), loadBonusModel("ATTACK"), loadBonusModel("MOVE"), loadBonusModel("SHIELD")]),
  );

type BonusInstance = {
  group: Group;
  marker: Mesh;
  materials: MeshStandardMaterial[];
  /** Ghosts: picked-up bonuses kept on screen until the visual contact. */
  ghost: boolean;
  fading: boolean;
  fadeStart: number;
};

const GHOST_FADE_MS = 250;

export class BonusRenderer {
  private readonly scene: Object3D;
  private readonly instances = new Map<string, BonusInstance>();
  private readonly knownTypes = new Set<BonusType>();

  constructor(scene: Object3D) {
    this.scene = scene;
  }

  /** Creates the visual instance of a bonus (model + ground marker). */
  private createInstance(bonus: GroundBonus, ghost: boolean): void {
    const type = bonus.type as BonusType;
    void loadBonusModel(type).then((model) => {
      if (this.instances.has(bonus.id)) return;
      const group = model.clone(true);
      group.scale.setScalar(BONUS_SCALE);
      group.position.set(bonus.position.x, LEVITATION_BASE_Y, bonus.position.z);
      // Per-instance materials so the last-turn translucency is isolated.
      const materials: MeshStandardMaterial[] = [];
      group.traverse((object) => {
        const mesh = object as Mesh;
        if (!mesh.isMesh) return;
        const source = mesh.material as Material | Material[] | undefined;
        const clone = Array.isArray(source)
          ? source.map((m) => m.clone() as MeshStandardMaterial)
          : [(source as MeshStandardMaterial).clone()];
        mesh.material = Array.isArray(source) ? clone : clone[0]!;
        mesh.castShadow = true;
        for (const material of clone) {
          material.transparent = true;
          materials.push(material);
        }
      });
      const marker = new Mesh(
        new RingGeometry(MARKER_INNER, MARKER_OUTER, 32),
        new MeshStandardMaterial({
          color: new Color(BONUS_COLORS[type]),
          transparent: true,
          opacity: 0.8,
        }),
      );
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(bonus.position.x, 0.06, bonus.position.z);
      this.scene.add(group);
      this.scene.add(marker);
      this.instances.set(bonus.id, { group, marker, materials, ghost, fading: false, fadeStart: 0 });
    });
  }

  /** Reconciles the rendered instances with the synced ground bonuses. */
  sync(bonuses: readonly GroundBonus[], currentTurn: number): void {
    const alive = new Set(bonuses.map((bonus) => bonus.id));
    for (const [id, instance] of this.instances) {
      // Ghosts live until their visual contact, not tied to the ground list.
      if (instance.ghost) continue;
      if (!alive.has(id)) {
        this.removeInstance(id, instance);
      }
    }
    for (const bonus of bonuses) {
      if (this.instances.has(bonus.id)) continue;
      this.createInstance(bonus, false);
    }
    // Age-based opacity: opaque on the spawn turn, translucent on the next.
    for (const bonus of bonuses) {
      const instance = this.instances.get(bonus.id);
      if (!instance || instance.ghost) continue;
      const age = currentTurn - bonus.spawnTurn;
      const opacity = age <= 0 ? 1 : LAST_TURN_OPACITY;
      for (const material of instance.materials) material.opacity = opacity;
    }
  }

  /**
   * A picked-up bonus stays visible (a "ghost") until fadeGhost is called -
   * the visual contact moment, decided frame by frame by the canvas - then
   * it dissolves over 250ms.
   */
  addGhost(bonus: GroundBonus): void {
    const existing = this.instances.get(bonus.id);
    if (existing) {
      existing.ghost = true;
      return;
    }
    this.createInstance(bonus, true);
  }

  /** Starts the 250ms dissolution of a ghost. */
  fadeGhost(id: string): void {
    const instance = this.instances.get(id);
    if (instance && !instance.fading) {
      instance.fading = true;
      instance.fadeStart = performance.now();
    }
  }

  /** Removes every remaining ghost (resolution over). */
  clearGhosts(): void {
    for (const [id, instance] of this.instances) {
      if (instance.ghost) this.removeInstance(id, instance);
    }
  }

  private removeInstance(id: string, instance: BonusInstance): void {
    this.scene.remove(instance.group);
    this.scene.remove(instance.marker);
    instance.marker.geometry.dispose();
    for (const material of instance.materials) material.dispose();
    this.instances.delete(id);
  }

  /** Per-frame animation: levitation, slow spin, pulsing, ghost fades. */
  update(timeMs: number): void {
    const time = timeMs / 1000;
    for (const [id, instance] of this.instances) {
      instance.group.position.y =
        LEVITATION_BASE_Y + Math.sin(time * LEVITATION_SPEED + instance.group.position.x) * LEVITATION_AMPLITUDE;
      instance.group.rotation.y += SPIN_SPEED * 0.016;
      const markerMaterial = instance.marker.material as MeshStandardMaterial;
      markerMaterial.opacity = 0.55 + 0.35 * Math.sin(time * 3);
      // Ghost dissolution, started by fadeGhost.
      if (instance.fading) {
        const fadeT = Math.min(1, (timeMs - instance.fadeStart) / GHOST_FADE_MS);
        for (const material of instance.materials) material.opacity = 1 - fadeT;
        markerMaterial.opacity = (1 - fadeT) * 0.8;
        if (fadeT >= 1) this.removeInstance(id, instance);
      }
    }
  }

  dispose(): void {
    for (const [id, instance] of this.instances) this.removeInstance(id, instance);
  }
}
