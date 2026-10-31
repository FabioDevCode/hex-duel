<template>
  <div ref="container" class="game-canvas" @mousemove="onMouseMove" @click="onClick" />
</template>

<script setup lang="ts">
import {
  AmbientLight,
  BufferGeometry,
  Float32BufferAttribute,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Raycaster,
  RingGeometry,
  Scene,
  Shape,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { AttackType, Vector2 as GameVector2 } from "@hex-duel/shared";
import { GAME_CONFIG } from "@hex-duel/shared";
import { buildArenaBounds, isInsideArena } from "@hex-duel/game-logic";

const props = defineProps<{
  playerPositions: [GameVector2, GameVector2];
  localAction: { type: string; direction?: number; target?: GameVector2 } | null;
  interactive: boolean;
}>();

const emit = defineEmits<{
  moveTarget: [target: GameVector2];
  attackDirection: [directionDeg: number];
}>();

const container = ref<HTMLElement | null>(null);
let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null;
let camera: PerspectiveCamera | null = null;
let capsules: [Group, Group] | null = null;
let raycaster = new Raycaster();
let groundPlane = new Plane(new Vector3(0, 1, 0), 0);
let mouseNDC = new Vector2();
let pointerWorld: GameVector2 | null = null;

// Indicators
let aimIndicator: Mesh | null = null;
let moveIndicator: Mesh | null = null;
let trajectoryLine: Line | null = null;
let attackCone: Mesh | null = null;
let rangeCircle: Mesh | null = null;
let moveRangeCircle: Mesh | null = null;

const PLAYER_COLORS = [new Color("#ff4d5a"), new Color("#4d91ff")];
const bounds = buildArenaBounds();
const EPSILON = 1e-9;

const makeLineGeometry = (positions: Float32Array): BufferGeometry => {
  const geom = new BufferGeometry();
  geom.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return geom;
};

const degToRad = (deg: number): number => (deg * Math.PI) / 180;
const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

const attackParams = (type: AttackType) => GAME_CONFIG.attacks[type];

const setupScene = (): void => {
  if (!container.value) return;

  scene = new Scene();
  scene.background = new Color("#101218");

  camera = new PerspectiveCamera(45, 16 / 9, 0.1, 200);
  camera.position.set(0, 30, 24);
  camera.lookAt(0, 0, 0);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  container.value.appendChild(renderer.domElement);

  scene.add(new AmbientLight(0xffffff, 0.5));
  const sun = new DirectionalLight(0xffffff, 1);
  sun.position.set(10, 30, 10);
  scene.add(sun);

  buildArenaMesh();
  buildCapsules();
  buildIndicators();

  animationFrame = requestAnimationFrame(render);
};

const buildArenaMesh = (): void => {
  if (!scene) return;
  const R = GAME_CONFIG.arenaRadius;
  const hex = new Shape();
  for (let i = 0; i <= 6; i++) {
    const angle = degToRad(90 + 60 * i);
    const x = Math.cos(angle) * R;
    const y = Math.sin(angle) * R;
    if (i === 0) hex.moveTo(x, y);
    else hex.lineTo(x, y);
  }
  const geometry = new ExtrudeGeometry(hex, { depth: 0.5, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  const floor = new Mesh(geometry, new MeshStandardMaterial({ color: "#191d26" }));
  scene.add(floor);
};

const buildCapsules = (): void => {
  if (!scene) return;
  const groups: [Group, Group] = [new Group(), new Group()];
  for (const seat of [0, 1] as const) {
    const capsule = new Mesh(
      new CapsuleGeometry(0.6, 1.4, 8, 16),
      new MeshStandardMaterial({ color: PLAYER_COLORS[seat] }),
    );
    capsule.position.y = 1.4;
    groups[seat].add(capsule);
    scene.add(groups[seat]);
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
    new MeshBasicMaterial({ color: 0x42c98a }),
  );
  moveIndicator.visible = false;
  scene.add(moveIndicator);

  trajectoryLine = new Line(
    makeLineGeometry(new Float32Array([])),
    new LineBasicMaterial({ color: 0x42c98a }),
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
    new MeshBasicMaterial({ color: 0x42c98a, transparent: true, opacity: 0.3, side: 2 }),
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
  if (dist <= GAME_CONFIG.maxMoveDistance + EPSILON) return target;
  const scale = GAME_CONFIG.maxMoveDistance / dist;
  return { x: from.x + dx * scale, z: from.z + dz * scale };
};

const onMouseMove = (event: MouseEvent): void => {
  if (!container.value || !camera || !renderer || !props.interactive) return;
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
  const myPos = props.playerPositions[0];

  if (action?.type === "MOVE") {
    const clamped = clampMoveDistance(myPos, clampToArena(pointerWorld));
    emit("moveTarget", clamped);
    return;
  }

  if (action && action.type !== "MOVE" && action.type !== "PASS") {
    const dx = pointerWorld.x - myPos.x;
    const dz = pointerWorld.z - myPos.z;
    if (dx === 0 && dz === 0) return;
    const direction = radToDeg(Math.atan2(dz, dx));
    emit("attackDirection", direction);
  }
};

const updateIndicators = (): void => {
  if (!aimIndicator || !moveIndicator || !trajectoryLine || !attackCone || !rangeCircle || !moveRangeCircle) return;
  const action = props.localAction;
  const myPos = props.playerPositions[0];
  const pointer = pointerWorld;

  // Reset all
  aimIndicator.visible = false;
  moveIndicator.visible = false;
  trajectoryLine.visible = false;
  attackCone.visible = false;
  rangeCircle.visible = false;
  moveRangeCircle.visible = false;

  if (!props.interactive || !pointer) return;

  if (action?.type === "MOVE") {
    // Move range ring around the player
    moveRangeCircle.visible = true;
    moveRangeCircle.scale.set(GAME_CONFIG.maxMoveDistance, GAME_CONFIG.maxMoveDistance, 1);
    moveRangeCircle.position.set(myPos.x, 0.6, myPos.z);

    const clamped = clampMoveDistance(myPos, clampToArena(pointer));
    moveIndicator.visible = true;
    moveIndicator.position.set(clamped.x, 0.6, clamped.z);

    const positions = new Float32Array([
      myPos.x, 0.6, myPos.z,
      clamped.x, 0.6, clamped.z,
    ]);
    trajectoryLine.geometry.dispose();
    trajectoryLine.geometry = makeLineGeometry(positions);
    trajectoryLine.visible = true;
    return;
  }

  if (action && action.type !== "MOVE" && action.type !== "PASS") {
    const params = attackParams(action.type as AttackType);
    const dx = pointer.x - myPos.x;
    const dz = pointer.z - myPos.z;
    if (dx === 0 && dz === 0) return;
    const directionDeg = radToDeg(Math.atan2(dz, dx));

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

watch(() => props.playerPositions, updateCapsulePositions, { deep: true });
watch(() => props.localAction, updateIndicators, { deep: true });
watch(() => props.interactive, updateIndicators);

onMounted(() => {
  setupScene();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
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
