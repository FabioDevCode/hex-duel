import type { Group, Object3D, Vector3 } from "three";
import { AdditiveBlending, Color, DoubleSide, Mesh, ShaderMaterial } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { AttackType } from "@hex-duel/shared";

/**
 * Energy slash VFX: slash-red for STRIKE (ground ring), slash-gold for
 * SNIPER (vertical disc). The mesh spawns tiny near the attacker, grows and
 * travels toward the opponent, then fades out.
 *
 * A custom shader gives the "energy" look: organic vertex wobble, flowing
 * bands along the ring, fresnel rim and a pulsing additive glow.
 */

const SLASH_URLS: Record<AttackType, string> = {
  STRIKE: "/models/slash-red.glb",
  SNIPER: "/models/slash-gold.glb",
};

// Scene scale (the characters are normalized to 4.4 units, the raw slash
// models are ~1.9 like the raw characters).
const SLASH_SCALE = 2.4;
// Vertical placement: ground ring just above the floor, disc at mid-height.
const SLASH_Y: Record<AttackType, number> = { STRIKE: 0.15, SNIPER: 2.2 };

// Spawn profile per type: initial scale fraction (of the full size) and
// forward offset from the attacker (the SNIPER charge disc hovers tiny,
// almost invisible, just in front of the character - not centered on it).
export const SLASH_SPAWN: Record<AttackType, { scale: number; forward: number }> = {
  STRIKE: { scale: 0.12, forward: 0 },
  SNIPER: { scale: 0.035, forward: 0.9 },
};

const ENERGY_COLORS: Record<AttackType, { core: string; edge: string }> = {
  STRIKE: { core: "#ffd9c8", edge: "#ff3b30" },
  SNIPER: { core: "#fff6c9", edge: "#ffc531" },
};

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;

  void main() {
    vUv = uv;
    vec3 p = position;
    // Organic wobble: layered sines push the surface along its normal.
    float w = sin(p.x * 6.0 + uTime * 5.0) + sin(p.y * 7.0 - uTime * 4.0) + sin(p.z * 5.0 + uTime * 3.0);
    p += normal * w * 0.025;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vViewPos = mv.xyz;
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorCore;
  uniform vec3 uColorEdge;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;

  void main() {
    // Flowing energy bands travelling along the ring.
    float bands = 0.5 + 0.5 * sin(vUv.y * 24.0 - uTime * 10.0);
    bands = pow(bands, 2.0);
    // Fresnel rim: edges glow brighter.
    vec3 n = normalize(vNormal);
    vec3 v = normalize(-vViewPos);
    float rim = pow(1.0 - abs(dot(n, v)), 1.5);
    // Slow breathing pulse.
    float pulse = 0.8 + 0.2 * sin(uTime * 9.0);
    vec3 col = mix(uColorEdge, uColorCore, clamp(bands * 0.6 + rim * 0.5, 0.0, 1.0)) * pulse;
    float a = uOpacity * (0.30 + 0.70 * bands) * (0.45 + 0.55 * rim + 0.35);
    gl_FragColor = vec4(col * (0.9 + bands * 0.9), clamp(a, 0.0, 1.0));
  }
`;

let loader: GLTFLoader | null = null;
const getLoader = (): GLTFLoader => {
  if (!loader) loader = new GLTFLoader();
  return loader;
};

const modelCache = new Map<AttackType, Promise<Group>>();

export const loadSlashModel = (type: AttackType): Promise<Group> => {
  let promise = modelCache.get(type);
  if (!promise) {
    promise = new Promise<Group>((resolve, reject) => {
      getLoader().load(
        SLASH_URLS[type],
        (gltf) => resolve(gltf.scene),
        undefined,
        (error) => reject(error instanceof Error ? error : new Error(String(error))),
      );
    });
    modelCache.set(type, promise);
  }
  return promise;
};

const createEnergyMaterial = (type: AttackType): ShaderMaterial => {
  const colors = ENERGY_COLORS[type];
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uColorCore: { value: new Color(colors.core) },
      uColorEdge: { value: new Color(colors.edge) },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
  });
};

const findMesh = (root: Object3D): Mesh | null => {
  let mesh: Mesh | null = null;
  root.traverse((object) => {
    const m = object as Mesh;
    if (!mesh && m.isMesh) mesh = m;
  });
  return mesh;
};

/**
 * A single slash instance. Spawn: tiny (12%) near the attacker, held there
 * for delayMs. Growth: scales up and travels toward the target point over
 * growMs (after the delay). Fade: the opacity ramps down over fadeMs once
 * arrived. update() must be called every frame with the timestamp (ms).
 */
export class SlashEffect {
  private readonly mesh: Mesh;
  private readonly material: ShaderMaterial;
  private readonly scene: Object3D;
  private readonly from: Vector3;
  private readonly to: Vector3;
  private readonly startAt: number;
  private readonly delayMs: number;
  private readonly growMs: number;
  private readonly fadeMs: number;
  private readonly baseScale: number;
  private readonly spawnScale: number;
  private disposed = false;

  constructor(
    scene: Object3D,
    type: AttackType,
    model: Group,
    from: Vector3,
    to: Vector3,
    yaw: number,
    startAt: number,
    delayMs: number,
    growMs: number,
    fadeMs: number,
  ) {
    this.spawnScale = SLASH_SPAWN[type].scale;
    this.scene = scene;
    this.from = from.clone();
    this.to = to.clone();
    // Both ends hover at the effect's height (lerpVectors overwrites y).
    this.from.y = SLASH_Y[type];
    this.to.y = SLASH_Y[type];
    this.startAt = startAt;
    this.delayMs = delayMs;
    this.growMs = growMs;
    this.fadeMs = fadeMs;
    this.baseScale = SLASH_SCALE;
    this.material = createEnergyMaterial(type);
    const source = findMesh(model);
    if (!source) throw new Error(`Slash model for ${type} has no mesh`);
    this.mesh = new Mesh(source.geometry, this.material);
    this.mesh.scale.setScalar(this.baseScale * this.spawnScale);
    this.mesh.position.copy(this.from);
    this.mesh.rotation.y = yaw;
    this.mesh.renderOrder = 5;
    scene.add(this.mesh);
  }

  update(now: number): void {
    if (this.disposed) return;
    const elapsed = now - this.startAt;
    // Phase 1: hold tiny at the attacker during the delay, then grow and
    // travel toward the target (smoothstep).
    const growElapsed = elapsed - this.delayMs;
    const growT = Math.min(1, Math.max(0, growElapsed / this.growMs));
    const eased = growT * growT * (3 - 2 * growT);
    this.mesh.position.lerpVectors(this.from, this.to, eased);
    this.mesh.scale.setScalar(
      this.baseScale * (this.spawnScale + (1 - this.spawnScale) * eased),
    );
    // Phase 2: fade out after arrival.
    const fadeElapsed = growElapsed - this.growMs;
    const fadeT = this.fadeMs > 0 ? Math.min(1, Math.max(0, fadeElapsed / this.fadeMs)) : 1;
    this.material.uniforms.uTime!.value = now / 1000;
    this.material.uniforms.uOpacity!.value = 1 - fadeT;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.remove(this.mesh);
    this.material.dispose();
  }
}

/** Preloads both slash models (call once at scene setup). */
export const preloadSlashModels = (): Promise<void> =>
  Promise.all([loadSlashModel("STRIKE"), loadSlashModel("SNIPER")]).then(() => undefined);
