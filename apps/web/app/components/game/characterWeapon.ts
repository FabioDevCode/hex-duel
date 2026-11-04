import type { Bone, BufferGeometry, Group, Mesh, Object3D } from "three";
import { Box3, Matrix4, Quaternion, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Right-hand weapon attachment for the GLB characters.
 *
 * The weapons (epee.glb for the knight, sabre.glb for the samurai) are static
 * props: they are attached as a child of the mixamorigRightHand bone, so they
 * follow every animation. The right-hand fingers are also forced into a closed
 * grip around the handle: after every mixer update the finger joints get a
 * curl quaternion applied (calibrated on the Mixamo rigs - see GRIP_ANGLES).
 *
 * The orientation is computed in the bind (rest) pose from the rig itself:
 *  - blade axis  = hand -> Middle1 (the direction the blade points)
 *  - handle axis = Pinky1 -> Thumb1 (across the palm, where the grip sits)
 */

const WEAPON_URLS = ["/models/sabre.glb", "/models/epee.glb"] as const;

// Distance from the hand bone (wrist) toward the palm center where the
// handle sits (measured ~0.10 on the Mixamo rigs). The raw weapon models
// are centered mid-blade (symmetric bounding box) - tune if the sword
// sits too high or too low in the fist.
const PALM_OFFSET = 0.1;

// Finger curl around the local Z axis, per joint 1..4 (radians).
// Signs calibrated on the Mixamo rigs: Thumb/Index/Middle curl on +Z,
// Ring/Pinky on -Z.
const GRIP_ANGLES: Record<string, [number, number, number, number]> = {
  Thumb: [0.25, 0.35, 0.35, 0.25],
  Index: [0.35, 0.5, 0.5, 0.35],
  Middle: [0.35, 0.5, 0.5, 0.35],
  Ring: [0.35, 0.5, 0.5, 0.35],
  Pinky: [0.35, 0.5, 0.5, 0.35],
};
const CURL_SIGNS: Record<string, number> = {
  Thumb: 1,
  Index: 1,
  Middle: 1,
  Ring: -1,
  Pinky: -1,
};
const FINGERS = ["Thumb", "Index", "Middle", "Ring", "Pinky"] as const;

let loader: GLTFLoader | null = null;
const getLoader = (): GLTFLoader => {
  if (!loader) loader = new GLTFLoader();
  return loader;
};

export const loadWeaponModel = (seat: 0 | 1): Promise<Group> =>
  new Promise<Group>((resolve, reject) => {
    getLoader().load(
      WEAPON_URLS[seat],
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
    );
  });

/**
 * Attaches the weapon to the character's right hand and returns a per-frame
 * callback that keeps the right-hand fingers closed around the handle.
 * Call the callback after every AnimationMixer update.
 */
export const attachWeaponAndGrip = (model: Object3D, weapon: Object3D): (() => void) => {
  updateRootMatrixWorld(model);

  const hand = findBone(model, "mixamorigRightHand");
  if (!hand) return () => {};

  // --- Weapon orientation, computed in the bind (rest) pose. ---
  const handPos = hand.getWorldPosition(new Vector3());
  const handQuat = hand.getWorldQuaternion(new Quaternion());
  const invHandQuat = handQuat.clone().invert();

  const middle1 = findBone(model, "mixamorigRightHandMiddle1");
  const thumb1 = findBone(model, "mixamorigRightHandThumb1");
  const pinky1 = findBone(model, "mixamorigRightHandPinky1");
  // Finger direction (along the forearm in the bind pose) and handle
  // axis (across the palm, Pinky -> Thumb).
  const fingerDir = middle1
    ? middle1.getWorldPosition(new Vector3()).sub(handPos).normalize()
    : new Vector3(1, 0, 0);
  const handleDir = thumb1 && pinky1
    ? thumb1.getWorldPosition(new Vector3()).sub(pinky1.getWorldPosition(new Vector3())).normalize()
    : new Vector3(0, 0, 1);
  // The blade must point FORWARD, toward where the character looks
  // (rig-local +Z), perpendicular to the forearm - not through the back
  // of the hand and not along the arm. Forward = palmNormal x fingerDir.
  const palmNormal = new Vector3().crossVectors(fingerDir, handleDir).normalize();
  const bladeDir = new Vector3().crossVectors(palmNormal, fingerDir).normalize();

  // Weapon geometry: blade along its local Y (see the manifests' bounding
  // boxes). Align local +Y with the blade direction (character forward),
  // local +X with the handle axis (across the fist), both in the hand
  // bone's local space.
  const localBlade = bladeDir.clone().applyQuaternion(invHandQuat).normalize();
  const localHandle = handleDir.clone().applyQuaternion(invHandQuat).normalize();
  const localX = localHandle.clone().sub(localBlade.clone().multiplyScalar(localHandle.dot(localBlade))).normalize();
  const localZ = new Vector3().crossVectors(localX, localBlade);
  const basis = new Matrix4().makeBasis(localX, localBlade, localZ);
  weapon.quaternion.setFromRotationMatrix(basis);
  // Sit the HANDLE in the palm center: offset from the wrist toward the
  // fingers (finger direction), and shift along the blade so the handle
  // (below the guard) lands in the fist instead of the blade middle.
  const localFinger = fingerDir.clone().applyQuaternion(invHandQuat).normalize();
  const handleY = findHandleOffsetY(weapon);
  weapon.position
    .copy(localFinger)
    .multiplyScalar(PALM_OFFSET)
    .add(localBlade.clone().multiplyScalar(-handleY));
  hand.add(weapon);

  // --- Closed grip: curl quaternions applied to the finger joints. ---
  const curls: { bones: Bone[]; quats: Quaternion[] }[] = [];
  for (const finger of FINGERS) {
    const angles = GRIP_ANGLES[finger]!;
    const sign = CURL_SIGNS[finger]!;
    const bones: Bone[] = [];
    const quats: Quaternion[] = [];
    for (let joint = 1; joint <= 4; joint++) {
      const bone = findBone(model, `mixamorigRightHand${finger}${joint}`);
      if (!bone) continue;
      bones.push(bone);
      quats.push(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), sign * angles[joint - 1]!));
    }
    if (bones.length) curls.push({ bones, quats });
  }

  return () => {
    for (const { bones, quats } of curls) {
      for (let i = 0; i < bones.length; i++) {
        bones[i]!.quaternion.multiply(quats[i]!);
      }
    }
  };
};

const updateRootMatrixWorld = (model: Object3D): void => {
  model.updateMatrixWorld(true);
};

/**
 * Finds the handle's center along the weapon's local Y axis by analyzing
 * the geometry profile: the guard/tsuba is the widest slice, the handle is
 * the thin region below it. Returns a negative Y (handle below the origin).
 */
const findHandleOffsetY = (weapon: Object3D): number => {
  const meshes: Mesh[] = [];
  weapon.traverse((object) => {
    const m = object as Mesh;
    if (m.isMesh) meshes.push(m);
  });
  const mesh = meshes[0];
  if (!mesh) return -0.35;
  const position = (mesh.geometry as BufferGeometry).getAttribute("position");
  if (!position) return -0.35;
  // Bucket the vertices by Y (0.05 slices) and track the widest slice
  // (the guard) and the extent of the thin region below it (the handle).
  const BUCKET = 0.05;
  type Slice = { maxR: number; minY: number; maxY: number };
  const slices = new Map<number, Slice>();
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const key = Math.floor(y / BUCKET);
    const radius = Math.sqrt(x * x + z * z);
    const slice = slices.get(key) ?? { maxR: 0, minY: y, maxY: y };
    slice.maxR = Math.max(slice.maxR, radius);
    slice.minY = Math.min(slice.minY, y);
    slice.maxY = Math.max(slice.maxY, y);
    slices.set(key, slice);
  }
  let guardKey = 0;
  let guardR = -1;
  for (const [key, slice] of slices) {
    if (slice.maxR > guardR) {
      guardR = slice.maxR;
      guardKey = key;
    }
  }
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const [key, slice] of slices) {
    if (key < guardKey) {
      minY = Math.min(minY, slice.minY);
      maxY = Math.max(maxY, slice.maxY);
    }
  }
  if (!Number.isFinite(minY) || !Number.isFinite(maxY)) return -0.35;
  return (minY + maxY) / 2;
};

const findBone = (model: Object3D, name: string): Bone | null => {
  let found: Bone | null = null;
  model.traverse((object) => {
    const bone = object as Bone;
    if (!found && bone.isBone && bone.name === name) found = bone;
  });
  return found;
};

/** Weapon size reference (unused at runtime, handy for tuning). */
export const weaponHeight = (weapon: Object3D): number =>
  new Box3().setFromObject(weapon).getSize(new Vector3()).y;
