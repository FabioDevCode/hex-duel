/**
 * Generic .glb/.gltf analyzer: inspects a model file and prints a JSON
 * manifest of its structure: scene hierarchy, meshes, materials, bones,
 * and especially the animation clips (name, duration, tracks, targets).
 *
 * Usage:
 *   npx tsx scripts/analyze-glb.ts <model.glb> [--out manifest.json]
 *
 * The script has no project-specific logic - it can be reused for any
 * glTF/GLB file.
 */
// Node environment shim: three.js loaders reference the browser global "self".
declare global {
  var self: unknown;
}
globalThis.self = globalThis;

import * as fs from "node:fs";
import * as path from "node:path";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

type ManifestTrack = {
  type: string;
  target: string;
  property: string;
};

type ManifestClip = {
  name: string;
  duration: number;
  frameRate: number | null;
  tracks: ManifestTrack[];
  targetNodes: string[];
};

type ManifestMaterial = {
  name: string;
  type: string;
  vertexColors: boolean;
  skinning: boolean;
};

type ManifestNode = {
  name: string;
  type: string;
  children: ManifestNode[];
  mesh?: string;
  bone?: boolean;
};

type Manifest = {
  file: string;
  bytes: number;
  generator: string | null;
  sceneNodes: number;
  meshes: { name: string; vertices: number; triangles: number; morphTargets: number }[];
  materials: ManifestMaterial[];
  bones: string[];
  animations: ManifestClip[];
  boundingBox: { min: [number, number, number]; max: [number, number, number] };
  size: [number, number, number];
  rootNodes: ManifestNode[];
};

const buildNodeManifest = (object: THREE.Object3D): ManifestNode => {
  const isMesh = (object as THREE.Mesh).isMesh === true;
  const isBone = (object as THREE.Bone).isBone === true;
  const mesh = object as THREE.Mesh;
  const geometry = isMesh ? mesh.geometry : null;
  return {
    name: object.name || "(unnamed)",
    type: isBone ? "Bone" : isMesh ? "Mesh" : object.type,
    children: object.children.map(buildNodeManifest),
    ...(isMesh && geometry ? { mesh: geometry.name || "(unnamed geometry)" } : {}),
    ...(isBone ? { bone: true } : {}),
  };
};

const analyze = async (file: string, outFile?: string): Promise<void> => {
  const buffer = fs.readFileSync(file);
  const loader = new GLTFLoader();

  const gltf = await new Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[]; asset: { generator?: string } }>(
    (resolve, reject) => {
      loader.parse(
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        "",
        (result) => resolve(result as never),
        (error) => reject(error instanceof Error ? error : new Error(String(error))),
      );
    },
  );

  const scene = gltf.scene;
  const meshes: Manifest["meshes"] = [];
  const materials: ManifestMaterial[] = [];
  const bones: string[] = [];
  let sceneNodes = 0;

  scene.traverse((object) => {
    sceneNodes += 1;
    const bone = object as THREE.Bone;
    if (bone.isBone) bones.push(bone.name || "(unnamed bone)");
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh) {
      const geometry = mesh.geometry as THREE.BufferGeometry & { morphAttributes: Record<string, unknown[]> };
      const position = geometry.getAttribute("position");
      const index = geometry.getIndex();
      const triangles = index ? index.count / 3 : position ? position.count / 3 : 0;
      meshes.push({
        name: mesh.name || "(unnamed)",
        vertices: position ? position.count : 0,
        triangles,
        morphTargets: Object.keys(geometry.morphAttributes ?? {}).length,
      });
      const material = mesh.material as THREE.Material | THREE.Material[];
      for (const m of Array.isArray(material) ? material : [material]) {
        const std = m as THREE.MeshStandardMaterial;
        materials.push({
          name: m.name || "(unnamed)",
          type: m.type,
          vertexColors: std.vertexColors === true,
          skinning: (m as unknown as { skinning?: boolean }).skinning === true,
        });
      }
    }
  });

  const animations: ManifestClip[] = gltf.animations.map((clip) => {
    const tracks: ManifestTrack[] = clip.tracks.map((track) => {
      const target = track.name.slice(0, track.name.lastIndexOf("."));
      const property = track.name.slice(track.name.lastIndexOf(".") + 1);
      return { type: track.constructor.name, target, property };
    });
    const targetNodes = [...new Set(tracks.map((t) => t.target))];
    const times = (clip.tracks[0] as THREE.KeyframeTrack | undefined)?.times;
    let frameRate: number | null = null;
    if (times && times.length > 1 && clip.duration > 0) {
      const interval = (times[times.length - 1] - times[0]) / (times.length - 1);
      if (interval > 0) frameRate = Math.round(1 / interval);
    }
    return {
      name: clip.name || "(unnamed clip)",
      duration: Number(clip.duration.toFixed(3)),
      frameRate,
      tracks: tracks.map((t) => ({ ...t, target: t.target.split(".").pop() ?? t.target })),
      targetNodes,
    };
  });

  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());

  const manifest: Manifest = {
    file: path.basename(file),
    bytes: buffer.byteLength,
    generator: gltf.asset?.generator ?? null,
    sceneNodes,
    meshes,
    materials,
    bones,
    animations,
    boundingBox: {
      min: [box.min.x, box.min.y, box.min.z].map((v) => Number(v.toFixed(3))) as [number, number, number],
      max: [box.max.x, box.max.y, box.max.z].map((v) => Number(v.toFixed(3))) as [number, number, number],
    },
    size: [size.x, size.y, size.z].map((v) => Number(v.toFixed(3))) as [number, number, number],
    rootNodes: scene.children.map(buildNodeManifest),
  };

  const json = JSON.stringify(manifest, null, 2);
  if (outFile) {
    fs.writeFileSync(outFile, json + "\n");
    console.log(`Manifest written to ${outFile}`);
  } else {
    console.log(json);
  }
  console.error(`Analyzed ${manifest.file}: ${manifest.animations.length} animation clip(s).`);
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const file = args[0];
  if (!file) {
    console.error("Usage: npx tsx scripts/analyze-glb.ts <model.glb> [--out manifest.json]");
    process.exit(1);
  }
  const outIndex = args.indexOf("--out");
  const outFile = outIndex >= 0 ? args[outIndex + 1] : undefined;
  try {
    await analyze(file, outFile);
  } catch (error) {
    console.error(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
};

void main();
