<template>
  <div ref="container" class="game-canvas" @mousemove="onMouseMove" @click="onClick" />
</template>

<script setup lang="ts">
import {
  BufferGeometry,
  Float32BufferAttribute,
  Color,
  ConeGeometry,
  ExtrudeGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Plane,
  Raycaster,
  RingGeometry,
  Scene,
  ShadowMaterial,
  Shape,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { AttackType, BonusType, GroundBonus, Vector2 as GameVector2 } from "@hex-duel/shared";
import { BONUS_CONFIG, GAME_CONFIG } from "@hex-duel/shared";
import { buildArenaBounds, isInsideArena } from "@hex-duel/game-logic";
import { CHARACTER_CLIPS, loadCharacterModel } from "./characterModels";
import { attachWeaponAndGrip, loadWeaponModel } from "./characterWeapon";
import { SLASH_SPAWN, SlashEffect, loadSlashModel, preloadSlashModels } from "./slashEffect";
import { BonusRenderer, preloadBonusModels } from "./bonusRenderer";
import { CharacterAnimator } from "./characterAnimator";
import { createArenaLighting, enableCharacterShadows } from "./arenaLighting";
import type { ArenaLighting } from "./arenaLighting";

const props = defineProps<{
  playerPositions: [GameVector2, GameVector2];
  localAction: { type: string; direction?: number; target?: GameVector2 } | null;
  interactive: boolean;
  aimLocked: boolean;
  mySeat: 0 | 1 | null;
  resolution: {
    steps: (
      | { kind: "move"; seat: 0 | 1; from: GameVector2; to: GameVector2 }
      | { kind: "attack"; seat: 0 | 1; type: AttackType; direction: number; hit: boolean }
    )[];
  } | null;
  /** A player just lost their last crystal: the remaining resolution
   * steps are cancelled so nothing animates behind the result overlay. */
  interrupt: boolean;
  /** Bonuses lying on the arena (public synced state, D-134). */
  bonuses: GroundBonus[];
  /** Current turn number, for the last-turn translucency. */
  currentTurn: number;
  /** My armed bonus: boosts the aiming range/angle of the next action. */
  armedBonus: BonusType | null;
  /** Bonuses picked up this resolution: they stay visible until the
   * attack slash or the moving character reaches them. */
  pendingPickups: { seat: 0 | 1; bonus: GroundBonus; method: "POSITION" | "TRAJECTORY" | "ATTACK" }[];
}>();

const emit = defineEmits<{
  hitLanded: [targetSeat: 0 | 1];
  resolutionEnd: [];
  moveTarget: [target: GameVector2];
  attackDirection: [directionDeg: number];
  aimLockedChange: [locked: boolean];
}>();

const container = ref<HTMLElement | null>(null);
let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null;
let camera: PerspectiveCamera | null = null;
let capsules: [Group, Group] | null = null;
let lighting: ArenaLighting | null = null;
let animators: [CharacterAnimator, CharacterAnimator] | null = null;
let lastFrameTime = 0;

// Clip names per model (see the manifests beside the .glb files).

// Indicator colors: move = blue, attacks = per type (STRIKE red, SNIPER gold).
// Attack animation clip per attack type (see the manifests) - the two
// hex-ult models share the same clip names.
const ATTACK_CLIPS: Record<0 | 1, Record<AttackType, string>> = {
  0: { STRIKE: "Right_Hand_Sword_Slash", SNIPER: "Attack" }, // samourai
  1: { STRIKE: "Right_Hand_Sword_Slash", SNIPER: "Attack" }, // chevalier
};

const MOVE_COLOR = 0x03489F;
const ATTACK_COLORS: Record<AttackType, number> = {
  STRIKE: 0xA91819,
  SNIPER: 0xffd24d,
};
let raycaster = new Raycaster();
let groundPlane = new Plane(new Vector3(0, 1, 0), 0);
let mouseNDC = new Vector2();
let pointerWorld: GameVector2 | null = null;

// Indicators
let aimIndicator: Mesh | null = null;
let moveIndicator: Mesh | null = null;
let trajectoryLine: Line | null = null;
let attackCone: Mesh | null = null;
let bonusRenderer: BonusRenderer | null = null;
/** Ghost bonuses already dissolving this resolution. */
const fadedGhosts = new Set<string>();
let rangeCircle: Mesh | null = null;
let moveRangeCircle: Mesh | null = null;

const bounds = buildArenaBounds();
const EPSILON = 1e-9;

const makeLineGeometry = (positions: Float32Array): BufferGeometry => {
  const geom = new BufferGeometry();
  geom.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return geom;
};

const degToRad = (deg: number): number => (deg * Math.PI) / 180;
const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Aiming params: boosted while an ATTACK bonus is armed (next attack). */
const attackParams = (type: AttackType) =>
  props.armedBonus === "ATTACK" ? BONUS_CONFIG.boosted.attacks[type] : GAME_CONFIG.attacks[type];

/** Aiming move range: boosted while a MOVE bonus is armed (next move). */
const aimMoveDistance = () =>
  props.armedBonus === "MOVE" ? BONUS_CONFIG.boosted.moveDistance : GAME_CONFIG.maxMoveDistance;

const setupScene = (): void => {
  if (!container.value) return;

  scene = new Scene();

  camera = new PerspectiveCamera(45, 16 / 9, 0.1, 200);
  camera.position.set(0, 30, 24);
  camera.lookAt(0, 0, 0);

  // Transparent canvas: the page background image (terrain) shows through.
  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  // Soft-edged sun shadows over the arena.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  container.value.appendChild(renderer.domElement);

  lighting = createArenaLighting(scene);

  buildArenaMesh();
  buildCapsules();
  buildIndicators();

  animationFrame = requestAnimationFrame(render);
};

const buildArenaMesh = (): void => {
  if (!scene) return;
  const R = GAME_CONFIG.arenaRadius;

  // Hexagon vertices (flat layout identical to buildArenaBounds).
  const vertices: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = degToRad(90 + 60 * i);
    vertices.push([Math.cos(angle) * R, Math.sin(angle) * R]);
  }

  // Single uniform shadow receiver: one large invisible ShadowMaterial
  // plane covering the arena and its surroundings - no hexagonal floor
  // on top (double shadow superposition), so the shadow keeps the same
  // intensity inside and outside the arena contour. Renders nothing
  // but shadows.
  const shadowCatch = new Mesh(
    new PlaneGeometry(GAME_CONFIG.arenaRadius * 6, GAME_CONFIG.arenaRadius * 6),
    new ShadowMaterial({ opacity: 0.35 }),
  );
  shadowCatch.rotation.x = -Math.PI / 2;
  shadowCatch.position.y = 0.01;
  shadowCatch.receiveShadow = true;
  scene.add(shadowCatch);

  // Top edge of the contour: thin semi-transparent white line.
  const outlinePoints = vertices.map(([x, y]) => new Vector3(x, 0.02, y));
  outlinePoints.push(outlinePoints[0]!.clone());
  const outline = new Line(
    new BufferGeometry().setFromPoints(outlinePoints),
    new LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55 }),
  );
  scene.add(outline);
};

const buildCapsules = (): void => {
  if (!scene) return;
  const groups: [Group, Group] = [new Group(), new Group()];
  const mixers: [CharacterAnimator, CharacterAnimator] = [] as never;
  for (const seat of [0, 1] as const) {
    scene.add(groups[seat]);
    // Energy slash VFX models + bonus models, preloaded once.
    void preloadSlashModels();
    void preloadBonusModels();
    bonusRenderer = new BonusRenderer(scene);

    // GLB character (red samurai / blue knight), loaded asynchronously,
    // normalized to ~2x the previous character height, facing the opponent.
    // The animator starts the idle loop as soon as the model is loaded,
    // so the T-pose never shows. The weapon is attached to the right-hand
    // bone (it follows every animation) and the fingers close around it.
    void Promise.all([loadCharacterModel(seat), loadWeaponModel(seat)])
      .then(([{ model, animations }, weapon]) => {
        const applyGrip = attachWeaponAndGrip(model, weapon);
        // Skinned GLB: every mesh in the hierarchy must cast shadows
        // (the weapon is now part of the hierarchy and casts too).
        enableCharacterShadows(model);
        groups[seat].add(model);
        mixers[seat] = new CharacterAnimator(model, animations, CHARACTER_CLIPS[seat], applyGrip);
        animators = mixers;
      })
      .catch((error: unknown) => {
        console.error("Failed to load the character model", error);
      });
  }
  capsules = groups;
  updateCapsulePositions();
};

const buildIndicators = (): void => {
  if (!scene) return;

  aimIndicator = new Mesh(
    new SphereGeometry(0.25, 12, 12),
    new MeshBasicMaterial({ color: 0x8d7cff }),
  );
  aimIndicator.visible = false;
  scene.add(aimIndicator);

  moveIndicator = new Mesh(
    new SphereGeometry(0.25, 12, 12),
    new MeshBasicMaterial({ color: MOVE_COLOR }),
  );
  moveIndicator.visible = false;
  scene.add(moveIndicator);

  trajectoryLine = new Line(
    makeLineGeometry(new Float32Array([])),
    new LineBasicMaterial({ color: MOVE_COLOR }),
  );
  trajectoryLine.visible = false;
  scene.add(trajectoryLine);

  attackCone = new Mesh(
    new ConeGeometry(1, 1, 24, 1, true),
    new MeshBasicMaterial({ color: 0x8d7cff, transparent: true, opacity: 0.25, side: 2 }),
  );
  attackCone.visible = false;
  scene.add(attackCone);

  rangeCircle = new Mesh(
    new RingGeometry(0.98, 1, 48),
    new MeshBasicMaterial({ color: 0x8d7cff, transparent: true, opacity: 0.4, side: 2 }),
  );
  rangeCircle.rotation.x = -Math.PI / 2;
  rangeCircle.visible = false;
  scene.add(rangeCircle);

  moveRangeCircle = new Mesh(
    new RingGeometry(0.98, 1, 48),
    new MeshBasicMaterial({ color: MOVE_COLOR, transparent: true, opacity: 0.3, side: 2 }),
  );
  moveRangeCircle.rotation.x = -Math.PI / 2;
  moveRangeCircle.visible = false;
  scene.add(moveRangeCircle);
};

const updateCapsulePositions = (): void => {
  if (!capsules) return;
  for (const seat of [0, 1] as const) {
    const pos = props.playerPositions[seat];
    capsules[seat].position.x = pos.x;
    capsules[seat].position.z = pos.z;
  }
};

const clampToArena = (target: GameVector2): GameVector2 => {
  if (isInsideArena(target, bounds)) return target;
  // Project toward the arena center until inside.
  let lo = 0;
  let hi = 1;
  const center: GameVector2 = { x: 0, z: 0 };
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const candidate: GameVector2 = {
      x: center.x + (target.x - center.x) * mid,
      z: center.z + (target.z - center.z) * mid,
    };
    if (isInsideArena(candidate, bounds)) lo = mid;
    else hi = mid;
  }
  return {
    x: center.x + (target.x - center.x) * lo,
    z: center.z + (target.z - center.z) * lo,
  };
};

const clampMoveDistance = (from: GameVector2, target: GameVector2): GameVector2 => {
  const dx = target.x - from.x;
  const dz = target.z - from.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist <= aimMoveDistance() + EPSILON) return target;
  const scale = aimMoveDistance() / dist;
  return { x: from.x + dx * scale, z: from.z + dz * scale };
};

const isAnimatingResolution = ref(false);

const onMouseMove = (event: MouseEvent): void => {
  if (!container.value || !camera || !renderer || !props.interactive) return;
  if (props.aimLocked || isAnimatingResolution.value) return;
  const rect = container.value.getBoundingClientRect();
  mouseNDC = new Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(mouseNDC, camera);
  const intersection = new Vector3();
  if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
    pointerWorld = { x: intersection.x, z: intersection.z };
    updateIndicators();
  }
};

const onClick = (): void => {
  if (!props.interactive || !pointerWorld) return;
  const action = props.localAction;
  const myPos = props.playerPositions[props.mySeat ?? 0];

  // Second click unlocks the frozen aim so it can be adjusted again.
  if (props.aimLocked) {
    emit("aimLockedChange", false);
    return;
  }

  if (action?.type === "MOVE") {
    const clamped = clampMoveDistance(myPos, clampToArena(pointerWorld));
    emit("moveTarget", clamped);
    emit("aimLockedChange", true);
    return;
  }

  if (action && action.type !== "MOVE" && action.type !== "PASS") {
    const dx = pointerWorld.x - myPos.x;
    const dz = pointerWorld.z - myPos.z;
    if (dx === 0 && dz === 0) return;
    const direction = radToDeg(Math.atan2(dz, dx));
    emit("attackDirection", direction);
    emit("aimLockedChange", true);
  }
};

const updateIndicators = (): void => {
  if (!aimIndicator || !moveIndicator || !trajectoryLine || !attackCone || !rangeCircle || !moveRangeCircle) return;
  const action = props.localAction;
  const myPos = props.playerPositions[props.mySeat ?? 0];
  const pointer = pointerWorld;

  // Reset all
  aimIndicator.visible = false;
  moveIndicator.visible = false;
  trajectoryLine.visible = false;
  attackCone.visible = false;
  rangeCircle.visible = false;
  moveRangeCircle.visible = false;

  if (!props.interactive || isAnimatingResolution.value) return;

  if (action?.type === "MOVE") {
    // Move range ring around the player
    moveRangeCircle.visible = true;
    const moveRange = aimMoveDistance();
    moveRangeCircle.scale.set(moveRange, moveRange, 1);
    moveRangeCircle.position.set(myPos.x, 0.6, myPos.z);

    // When the aim is locked, show the frozen target; otherwise follow the
    // pointer. Without a pointer yet (no mousemove), only the range ring shows.
    const frozen = props.aimLocked ? (action.target ?? null) : null;
    const live = frozen ?? (pointer ? clampMoveDistance(myPos, clampToArena(pointer)) : null);
    if (!live) return;
    moveIndicator.visible = true;
    moveIndicator.position.set(live.x, 0.6, live.z);

    const positions = new Float32Array([
      myPos.x, 0.6, myPos.z,
      live.x, 0.6, live.z,
    ]);
    trajectoryLine.geometry.dispose();
    trajectoryLine.geometry = makeLineGeometry(positions);
    trajectoryLine.visible = true;
    return;
  }

  if (action && action.type !== "MOVE" && action.type !== "PASS") {
    const attackType = action.type as AttackType;
    const params = attackParams(attackType);
    const attackColor = ATTACK_COLORS[attackType];
    (aimIndicator.material as MeshBasicMaterial).color.setHex(attackColor);
    (rangeCircle.material as MeshBasicMaterial).color.setHex(attackColor);
    (attackCone.material as MeshBasicMaterial).color.setHex(attackColor);
    const directionDeg = props.aimLocked
      ? (action.direction ?? 0)
      : (() => {
          if (!pointer) return action.direction ?? 0;
          const dx = pointer.x - myPos.x;
          const dz = pointer.z - myPos.z;
          if (dx === 0 && dz === 0) return 0;
          return radToDeg(Math.atan2(dz, dx));
        })();

    // Aim indicator along the direction
    const rad = degToRad(directionDeg);
    aimIndicator.visible = true;
    aimIndicator.position.set(myPos.x + Math.cos(rad) * 2, 1.4, myPos.z + Math.sin(rad) * 2);

    // Range circle
    rangeCircle.visible = true;
    rangeCircle.scale.set(params.range, params.range, 1);
    rangeCircle.position.set(myPos.x, 0.6, myPos.z);

    // Attack cone: THREE cone is around +Y, rotate to lie flat and point at direction
    attackCone.visible = true;
    attackCone.geometry.dispose();
    attackCone.geometry = buildConeWedge(params.angle, params.range);
    attackCone.position.set(myPos.x, 0.6, myPos.z);
    attackCone.rotation.y = -rad;
  }
};

const buildConeWedge = (totalAngleDeg: number, radius: number): ExtrudeGeometry => {
  const shape = new Shape();
  const half = degToRad(totalAngleDeg / 2);
  shape.moveTo(0, 0);
  shape.absarc(0, 0, radius, -half, half, false);
  shape.lineTo(0, 0);
  const geom = new ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false });
  // Shape is in X/Y; we want it flat on X/Z: rotate -90° around X
  geom.rotateX(-Math.PI / 2);
  return geom;
};

let animationFrame = 0;

const render = (): void => {
  if (!renderer || !scene || !camera) return;
  const now = performance.now();
  if (lastFrameTime > 0) {
    const deltaS = Math.min(0.1, (now - lastFrameTime) / 1000);
    animators?.[0]?.update(deltaS);
    animators?.[1]?.update(deltaS);
  }
  lastFrameTime = now;
  stepResolution();
  bonusRenderer?.sync(props.bonuses, props.currentTurn);
  bonusRenderer?.update(now);
  renderer.render(scene, camera);
  animationFrame = requestAnimationFrame(render);
};

const onResize = (): void => {
  if (!renderer || !camera || !container.value) return;
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

watch(
  () => props.playerPositions,
  () => {
    // During the resolution animation the capsules are driven by the lerp;
    // authoritative positions are applied when it ends.
    if (!isAnimatingResolution.value) updateCapsulePositions();
  },
  { deep: true },
);
watch(() => props.localAction, updateIndicators, { deep: true });
watch(() => props.interactive, updateIndicators);

// --- Resolution phase animation (UI_UX_SPEC 18) ---
//
// Steps are played strictly in the given order:
// - MOVE vs MOVE: first-validated moves first, then the second
// - attack vs attack: first-validated attacks first
// - MOVE vs attack: the move always plays first
// (the authoritative outcome is already computed by the server;
// this only sequences the visuals)

type ResolutionStep =
  | { kind: "move"; seat: 0 | 1; from: GameVector2; to: GameVector2 }
  | { kind: "attack"; seat: 0 | 1; type: AttackType; direction: number; hit: boolean };

type ActiveStep =
  | {
      kind: "move";
      seat: 0 | 1;
      from: GameVector2;
      to: GameVector2;
      turnFromYaw: number;
      turnToYaw: number;
      turnDurationMs: number;
      walkDurationMs: number;
      walkStarted: boolean;
      faceFromYaw: number;
      faceToYaw: number;
      faceDurationMs: number;
      faceStarted: boolean;
      startedAt: number;
    }
  | {
      kind: "attack";
      seat: 0 | 1;
      type: AttackType;
      hit: boolean;
      turnFromYaw: number;
      turnToYaw: number;
      turnDurationMs: number;
      attackStarted: boolean;
      attackDone: boolean;
      knockStarted: boolean;
      knockDone: boolean;
      hitLandedEmitted: boolean;
      ariseStarted: boolean;
      ariseDone: boolean;
      faceFromYaw: number;
      faceToYaw: number;
      faceDurationMs: number;
      faceStarted: boolean;
      faceDone: boolean;
      slash: SlashEffect | null;
      startedAt: number;
    };

const MOVE_DURATION_MS = 1500;
// Attack animation length (clip time-scaled to fit); pivot + anim must
// stay within the server's 4s resolution window.
const ATTACK_ANIM_MS = 1500;
// Hit reaction on the target: the knockdown starts a few ms before the
// attack clip ends, then the target gets back up.
// Per attack type: the STRIKE knockdown starts a bit earlier than the
// SNIPER one (whose timing is already right for the long attack).
const KNOCK_LEAD_MS: Record<AttackType, number> = { STRIKE: 850, SNIPER: 450 };

// Energy slash staging per attack type.
// - STRIKE (red ground ring): the model is a "C" ring open around -60deg
//   in local space (measured), so the rounded front sits at +120deg; the
//   yaw offset aligns that front with the travel direction. It launches
//   immediately and grows fast.
// - SNIPER (gold disc): launches almost at the end of the long attack
//   (when the knockdown starts) and closes in very fast.
// SNIPER: the disc's rounded back sits on the local -X half (gap centered
// near +8deg, measured), so a PI offset points it along the travel
// direction (world horizontal bulge angle = PI - yaw).
const SLASH_YAW_OFFSET: Record<AttackType, number> = { STRIKE: (2 * Math.PI) / 3, SNIPER: Math.PI };
const SLASH_TIMING: Record<AttackType, { delay: number; grow: number; fade: number }> = {
  STRIKE: { delay: 350, grow: 550, fade: ATTACK_ANIM_MS - 550 },
  SNIPER: { delay: 850, grow: 350, fade: 250 },
};
const KNOCKDOWN_MS = 900;
const ARISE_MS = 800;

const queuedSteps = ref<ResolutionStep[]>([]);

// Game-ending resolution: drop every step that would play after the fatal
// blow. The current step finishes cleanly (knockdown, get-up, face-off),
// then the queue drains and the scene stays still until the overlay.
watch(
  () => props.interrupt,
  (interrupt) => {
    if (!interrupt) return;
    queuedSteps.value = [];
    if (!activeStep.value) {
      // Nothing was playing: release the held crystals right away.
      emit("resolutionEnd");
    }
  },
);
const activeStep = ref<ActiveStep | null>(null);

const playResolution = (): void => {
  if (!scene || !capsules) return;
  fadedGhosts.clear();
  // Any leftover walking state from a previous resolution is cleanly
  // crossfaded back to idle before the new sequence starts.
  animators?.[0]?.playIdle();
  animators?.[1]?.playIdle();
  queuedSteps.value = [...(props.resolution?.steps ?? [])];
  if (queuedSteps.value.length === 0) {
    isAnimatingResolution.value = false;
    return;
  }
  isAnimatingResolution.value = true;
  hideAllIndicators();
  startNextStep();
};

// The GLB models face their opponent at load (rotation.y = +/- PI/2);
// rotating the group turns the character in the world.
const modelYawOffset = (seat: 0 | 1): number => (seat === 0 ? Math.PI / 2 : -Math.PI / 2);

const shortestAngle = (from: number, to: number): number => {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
};

/** Yaw for a seat to face the opponent's current visual position. */
const yawTowardOpponent = (seat: 0 | 1): number => {
  const me = capsules?.[seat];
  const other = capsules?.[seat === 0 ? 1 : 0];
  if (!me || !other) return me?.rotation.y ?? 0;
  const dx = other.position.x - me.position.x;
  const dz = other.position.z - me.position.z;
  return Math.atan2(dx, dz) - modelYawOffset(seat);
};

const startNextStep = (): void => {
  const next = queuedSteps.value.shift();
  if (!next) {
    activeStep.value = null;
    isAnimatingResolution.value = false;
    updateCapsulePositions();
    bonusRenderer?.clearGhosts();
    emit("resolutionEnd");
    return;
  }
  if (next.kind === "move") {
    const group = capsules?.[next.seat];
    const dx = next.to.x - next.from.x;
    const dz = next.to.z - next.from.z;
    const targetYaw = Math.atan2(dx, dz) - modelYawOffset(next.seat);
    const currentYaw = group ? group.rotation.y : targetYaw;
    const turnAngle = Math.abs(shortestAngle(currentYaw, targetYaw));
    const turnDurationMs = Math.min(800, Math.max(150, (turnAngle / Math.PI) * 800));
    activeStep.value = {
      ...next,
      turnFromYaw: currentYaw,
      turnToYaw: currentYaw + shortestAngle(currentYaw, targetYaw),
      turnDurationMs,
      walkDurationMs: MOVE_DURATION_MS,
      walkStarted: false,
      faceFromYaw: 0,
      faceToYaw: 0,
      faceDurationMs: 0,
      faceStarted: false,
      startedAt: performance.now(),
    };
    // Picked-up bonuses stay visible (ghosts); they dissolve when the
    // walker comes within the pickup radius, checked frame by frame.
    for (const pickup of props.pendingPickups) {
      if (pickup.seat !== next.seat || pickup.method === "ATTACK") continue;
      bonusRenderer?.addGhost(pickup.bonus);
    }
  } else if (next.kind === "attack") {
    // Attack step: no cone printed on the floor anymore - the character
    // pivots toward the attack direction, then plays its attack clip.
    const group = capsules?.[next.seat];
    const targetYaw = Math.PI / 2 - degToRad(next.direction) - modelYawOffset(next.seat);
    const currentYaw = group ? group.rotation.y : targetYaw;
    const turnAngle = Math.abs(shortestAngle(currentYaw, targetYaw));
    const turnDurationMs = Math.min(500, Math.max(120, (turnAngle / Math.PI) * 500));
    activeStep.value = {
      kind: "attack",
      seat: next.seat,
      type: next.type,
      hit: next.hit,
      turnFromYaw: currentYaw,
      turnToYaw: currentYaw + shortestAngle(currentYaw, targetYaw),
      turnDurationMs,
      attackStarted: false,
      attackDone: false,
      knockStarted: false,
      knockDone: false,
      hitLandedEmitted: false,
      ariseStarted: false,
      ariseDone: false,
      faceFromYaw: 0,
      faceToYaw: 0,
      faceDurationMs: 0,
      faceStarted: false,
      faceDone: false,
      slash: null,
      startedAt: performance.now(),
    };
    // Energy slash: spawned right away (during the pivot), so the effect
    // starts earlier than the attack clip itself. It grows and travels
    // toward the opponent on a hit (or up to the attack range on a miss);
    // per-type staging then fades it out.
    if (scene && group) {
      const from = group.position.clone();
      const dirRad = degToRad(next.direction);
      const dir = new Vector3(Math.cos(dirRad), 0, Math.sin(dirRad));
      const range = attackParams(next.type).range;
      const targetGroup = capsules?.[next.seat === 0 ? 1 : 0];
      let travel: number = range;
      if (next.hit && targetGroup) {
        const toTarget = targetGroup.position.clone().sub(group.position);
        toTarget.y = 0;
        travel = Math.min(range * 1.3, Math.max(1, toTarget.length()));
      }
      const to = from.clone().add(dir.clone().multiplyScalar(travel));
      // Picked-up bonuses stay visible (ghosts); they dissolve when the
      // slash reaches its target - the same moment the knockdown starts,
      // triggered frame by frame in stepResolution.
      for (const pickup of props.pendingPickups) {
        if (pickup.seat !== next.seat || pickup.method !== "ATTACK") continue;
        bonusRenderer?.addGhost(pickup.bonus);
      }
      // SNIPER: the charge disc spawns tiny, in front of the attacker.
      from.add(dir.clone().multiplyScalar(SLASH_SPAWN[next.type].forward));
      void loadSlashModel(next.type).then((model) => {
        const active = activeStep.value;
        if (active?.kind !== "attack" || active.seat !== next.seat || active.slash) return;
        const timing = SLASH_TIMING[next.type];
        active.slash = new SlashEffect(
          scene!,
          next.type,
          model,
          from,
          to,
          SLASH_YAW_OFFSET[next.type] - dirRad,
          performance.now(),
          timing.delay,
          timing.grow,
          timing.fade,
        );
      });
    }
  }
};

const hideAllIndicators = (): void => {
  for (const indicator of [aimIndicator, moveIndicator, trajectoryLine, attackCone, rangeCircle, moveRangeCircle]) {
    if (indicator) indicator.visible = false;
  }
};

const stepResolution = (): void => {
  if (!isAnimatingResolution.value || !capsules) return;
  const step = activeStep.value;
  if (!step) return;
  const now = performance.now();

  if (step.kind === "move") {
    const group = capsules[step.seat];
    const elapsed = now - step.startedAt;
    // Phase 1: pivot in place to face the destination (idle keeps playing).
    if (elapsed < step.turnDurationMs) {
      const t = Math.min(1, elapsed / step.turnDurationMs);
      const eased = t * t * (3 - 2 * t);
      group.rotation.y = step.turnFromYaw + (step.turnToYaw - step.turnFromYaw) * eased;
      group.position.x = step.from.x;
      group.position.z = step.from.z;
      return;
    }
    // Phase 2: walk to the destination (Walking loops, crossfaded once).
    if (!step.walkStarted) {
      step.walkStarted = true;
      animators?.[step.seat]?.playWalking();
    }
    const walkElapsed = elapsed - step.turnDurationMs;
    const walkT = Math.min(1, walkElapsed / step.walkDurationMs);
    const walkEased = walkT * walkT * (3 - 2 * walkT);
    group.rotation.y = step.turnToYaw;
    group.position.x = step.from.x + (step.to.x - step.from.x) * walkEased;
    group.position.z = step.from.z + (step.to.z - step.from.z) * walkEased;
    // Ghost bonuses dissolve when the walker reaches them.
    for (const pickup of props.pendingPickups) {
      if (pickup.seat !== step.seat || pickup.method === "ATTACK") continue;
      if (fadedGhosts.has(pickup.bonus.id)) continue;
      const dx = group.position.x - pickup.bonus.position.x;
      const dz = group.position.z - pickup.bonus.position.z;
      if (Math.hypot(dx, dz) <= BONUS_CONFIG.pickupRadius) {
        fadedGhosts.add(pickup.bonus.id);
        bonusRenderer?.fadeGhost(pickup.bonus.id);
      }
    }
    if (walkT < 1) return;
    // Phase 3: arrived - turn to face the opponent.
    if (!step.faceStarted) {
      step.faceStarted = true;
      animators?.[step.seat]?.playIdle();
      const currentYaw = group.rotation.y;
      const targetYaw = yawTowardOpponent(step.seat);
      const angle = Math.abs(shortestAngle(currentYaw, targetYaw));
      step.faceFromYaw = currentYaw;
      step.faceToYaw = currentYaw + shortestAngle(currentYaw, targetYaw);
      step.faceDurationMs = Math.min(450, Math.max(120, (angle / Math.PI) * 450));
    }
    const faceElapsed = walkElapsed - step.walkDurationMs;
    const faceT = Math.min(1, faceElapsed / step.faceDurationMs);
    const faceEased = faceT * faceT * (3 - 2 * faceT);
    group.rotation.y = step.faceFromYaw + (step.faceToYaw - step.faceFromYaw) * faceEased;
    if (faceT >= 1) {
      startNextStep();
    }
    return;
  }

  // Attack step: pivot toward the direction, play the attack clip, then
  // the target's crystal breaks at the very end of the animation.
  if (step.kind === "attack") {
    const group = capsules[step.seat];
    const elapsed = now - step.startedAt;
    // The slash updates every frame, including during the pivot.
    step.slash?.update(now);
    // Phase 1: pivot in place toward the attack direction.
    if (elapsed < step.turnDurationMs) {
      const t = Math.min(1, elapsed / step.turnDurationMs);
      const eased = t * t * (3 - 2 * t);
      group.rotation.y = step.turnFromYaw + (step.turnToYaw - step.turnFromYaw) * eased;
      return;
    }
    // Phase 2: play the attack clip (time-scaled to ATTACK_ANIM_MS).
    group.rotation.y = step.turnToYaw;
    const targetSeat = step.seat === 0 ? 1 : 0;
    if (!step.attackStarted) {
      step.attackStarted = true;
      const clip = ATTACK_CLIPS[step.seat][step.type];
      animators?.[step.seat]?.playOnce(clip, ATTACK_ANIM_MS, () => {
        if (activeStep.value?.kind === "attack" && activeStep.value.seat === step.seat) {
          activeStep.value.attackDone = true;
        }
      });
    }
    step.slash?.update(now);
    // Phase 3: a few ms before the attack lands, the target starts
    // falling ("Renverser" / Knock_Down, horizontally pinned). This is
    // also when the slash reaches its target: the bonuses it picked up
    // dissolve now (ghosts).
    const attackElapsed = elapsed - step.turnDurationMs;
    if (attackElapsed >= ATTACK_ANIM_MS - KNOCK_LEAD_MS[step.type]) {
      for (const pickup of props.pendingPickups) {
        if (pickup.seat !== step.seat || pickup.method !== "ATTACK") continue;
        if (!fadedGhosts.has(pickup.bonus.id)) {
          fadedGhosts.add(pickup.bonus.id);
          bonusRenderer?.fadeGhost(pickup.bonus.id);
        }
      }
    }
    if (step.hit && !step.knockStarted && attackElapsed >= ATTACK_ANIM_MS - KNOCK_LEAD_MS[step.type]) {
      step.knockStarted = true;
      animators?.[targetSeat]?.playOncePinned("Knock_Down", KNOCKDOWN_MS, () => {
        const active = activeStep.value;
        if (active?.kind === "attack" && active.seat === step.seat) {
          active.knockDone = true;
        }
      });
    }
    if (attackElapsed < ATTACK_ANIM_MS) return;
    // The attack landed: the target's crystal breaks now (once).
    if (step.hit && !step.hitLandedEmitted) {
      step.hitLandedEmitted = true;
      emit("hitLanded", targetSeat);
    }
    const reactionDone = step.hit ? step.ariseDone : true;
    if (!reactionDone) {
      // Phase 4: once knocked down, the target gets back up
      // ("Se relever" / Arise, horizontally pinned to its arena spot).
      if (step.knockDone && !step.ariseStarted) {
        step.ariseStarted = true;
        animators?.[targetSeat]?.playOncePinned("Arise", ARISE_MS, () => {
          const active = activeStep.value;
          if (active?.kind === "attack" && active.seat === step.seat) {
            active.ariseDone = true;
          }
        });
      }
      return;
    }
    // Phase 5: the attacker turns to face the opponent, then the
    // sequence continues.
    if (!step.faceStarted) {
      step.faceStarted = true;
      const currentYaw = group.rotation.y;
      const targetYaw = yawTowardOpponent(step.seat);
      const angle = Math.abs(shortestAngle(currentYaw, targetYaw));
      step.faceFromYaw = currentYaw;
      step.faceToYaw = currentYaw + shortestAngle(currentYaw, targetYaw);
      step.faceDurationMs = Math.min(450, Math.max(120, (angle / Math.PI) * 450));
    }
    const faceElapsed = attackElapsed - ATTACK_ANIM_MS;
    const faceT = Math.min(1, faceElapsed / step.faceDurationMs);
    const faceEased = faceT * faceT * (3 - 2 * faceT);
    group.rotation.y = step.faceFromYaw + (step.faceToYaw - step.faceFromYaw) * faceEased;
    if (faceT >= 1) {
      step.slash?.dispose();
      activeStep.value = null;
      startNextStep();
    }
  }
};


watch(
  () => props.resolution,
  (value) => {
    if (value) playResolution();
  },
);

onMounted(() => {
  setupScene();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  lighting?.dispose();
  lighting = null;
  cancelAnimationFrame(animationFrame);
  window.removeEventListener("resize", onResize);
  renderer?.dispose();
  if (renderer && container.value?.contains(renderer.domElement)) {
    container.value.removeChild(renderer.domElement);
  }
  scene = null;
  renderer = null;
});
</script>

<style scoped>
.game-canvas {
  position: absolute;
  inset: 0;
  cursor: crosshair;
}
</style>
