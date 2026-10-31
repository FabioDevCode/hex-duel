<template>
  <div ref="container" class="game-canvas" />
</template>

<script setup lang="ts">
import {
  AmbientLight,
  CapsuleGeometry,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import { GAME_CONFIG } from "@hex-duel/shared";
import { buildArenaBounds, isInsideArena } from "@hex-duel/game-logic";
import type { Vector2 } from "@hex-duel/shared";

const props = defineProps<{
  playerPositions: [Vector2, Vector2];
  localAction: { type: string; direction?: number; target?: Vector2 } | null;
}>();

const container = ref<HTMLElement | null>(null);
let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null;
let camera: PerspectiveCamera | null = null;
let capsules: [Group, Group] | null = null;
let aimIndicator: Mesh | null = null;
let moveIndicator: Mesh | null = null;
let animationFrame = 0;

const PLAYER_COLORS = [new Color("#ff4d5a"), new Color("#4d91ff")];
const bounds = buildArenaBounds();

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
    const angle = (Math.PI / 180) * (90 + 60 * i);
    const x = Math.cos(angle) * R;
    const y = Math.sin(angle) * R;
    if (i === 0) hex.moveTo(x, y);
    else hex.lineTo(x, y);
  }
  const geometry = new ExtrudeGeometry(hex, { depth: 0.5, bevelEnabled: false });
  geometry.rotateX(-Math.PI / 2);
  const floor = new Mesh(
    geometry,
    new MeshStandardMaterial({ color: "#191d26" }),
  );
  const edge = new Mesh(geometry.clone(), new MeshBasicMaterial({ color: "#343b4b" }));
  edge.scale.set(1.001, 1.001, 1.001);
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
    new SphereGeometry(0.3, 12, 12),
    new MeshStandardMaterial({ color: 0x8d7cff }),
  );
  aimIndicator.visible = false;
  scene.add(aimIndicator);
  moveIndicator = new Mesh(
    new SphereGeometry(0.3, 12, 12),
    new MeshStandardMaterial({ color: 0x42c98a }),
  );
  moveIndicator.visible = false;
  scene.add(moveIndicator);
};

const updateCapsulePositions = (): void => {
  if (!capsules) return;
  for (const seat of [0, 1] as const) {
    const pos = props.playerPositions[seat];
    capsules[seat].position.x = pos.x;
    capsules[seat].position.z = pos.z;
  }
};

const updateIndicators = (): void => {
  if (!aimIndicator || !moveIndicator) return;
  const action = props.localAction;
  if (action?.type === "MOVE" && action.target && isInsideArena(action.target, bounds)) {
    moveIndicator.visible = true;
    moveIndicator.position.set(action.target.x, 0.3, action.target.z);
    aimIndicator.visible = false;
  } else if (action && action.type !== "MOVE" && action.type !== "PASS" && typeof action.direction === "number") {
    const localPos = props.playerPositions[0];
    const rad = (action.direction * Math.PI) / 180;
    aimIndicator.visible = true;
    aimIndicator.position.set(
      localPos.x + Math.cos(rad) * 2,
      1.4,
      localPos.z + Math.sin(rad) * 2,
    );
    moveIndicator.visible = false;
  } else {
    aimIndicator.visible = false;
    moveIndicator.visible = false;
  }
};

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

onMounted(setupScene);

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
}
</style>
