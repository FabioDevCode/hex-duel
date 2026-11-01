import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from "three";

/**
 * Stylized low-poly characters (proportions match the reference art:
 * oversized head, sturdy body, ~2.8 units tall overall).
 * Seat 0 = red samurai, seat 1 = blue knight.
 */

const metal = (color: string): MeshStandardMaterial =>
  new MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.45 });

const cloth = (color: string): MeshStandardMaterial =>
  new MeshStandardMaterial({ color, metalness: 0.05, roughness: 0.9 });

const mesh = (geometry: Mesh["geometry"], material: MeshStandardMaterial): Mesh<Mesh["geometry"], MeshStandardMaterial> =>
  new Mesh(geometry, material);

const buildLegs = (armor: MeshStandardMaterial, boots: MeshStandardMaterial): Group => {
  const legs = new Group();
  for (const x of [-0.16, 0.16]) {
    const thigh = mesh(new CylinderGeometry(0.14, 0.12, 0.42, 8), armor);
    thigh.position.set(x, 0.62, 0);
    legs.add(thigh);
    const boot = mesh(new BoxGeometry(0.24, 0.16, 0.36), boots);
    boot.position.set(x, 0.1, 0.04);
    legs.add(boot);
  }
  return legs;
};

const buildTorso = (armor: MeshStandardMaterial, trim: MeshStandardMaterial): Group => {
  const torso = new Group();
  const chest = mesh(new CylinderGeometry(0.34, 0.28, 0.55, 10), armor);
  chest.position.y = 1.08;
  torso.add(chest);
  const belt = mesh(new CylinderGeometry(0.3, 0.3, 0.12, 10), trim);
  belt.position.y = 0.82;
  torso.add(belt);
  return torso;
};

const buildArms = (armor: MeshStandardMaterial, trim: MeshStandardMaterial): Group => {
  const arms = new Group();
  for (const x of [-0.42, 0.42]) {
    const shoulder = mesh(new SphereGeometry(0.17, 10, 8), trim);
    shoulder.position.set(x, 1.32, 0);
    arms.add(shoulder);
    const arm = mesh(new CylinderGeometry(0.11, 0.1, 0.45, 8), armor);
    arm.position.set(x, 1.05, 0.02);
    arms.add(arm);
    const hand = mesh(new SphereGeometry(0.09, 8, 6), trim);
    hand.position.set(x, 0.82, 0.06);
    arms.add(hand);
  }
  return arms;
};

/** Blue knight: silver plate, blue accents, closed helm with plume, glowing sword. */
const buildKnight = (): Group => {
  const character = new Group();
  const silver = metal("#c8cdd6");
  const blue = metal("#4d91ff");
  const dark = cloth("#2a3140");

  character.add(buildLegs(silver, dark));
  character.add(buildTorso(silver, blue));
  character.add(buildArms(silver, blue));

  // Closed helm: rounded top + visor slit
  const helm = mesh(new SphereGeometry(0.3, 14, 12), silver);
  helm.position.y = 1.62;
  helm.scale.set(1, 1.1, 1);
  character.add(helm);
  const visor = mesh(new BoxGeometry(0.34, 0.08, 0.12), cloth("#10141c"));
  visor.position.set(0, 1.62, 0.24);
  character.add(visor);
  const plume = mesh(new ConeGeometry(0.12, 0.42, 8), cloth("#4d91ff"));
  plume.position.set(0, 2.0, -0.05);
  character.add(plume);

  // Sword in the right hand, blade slightly forward
  const blade = mesh(new BoxGeometry(0.07, 0.9, 0.02), metal("#bfe0ff"));
  blade.material.emissive.set("#4d91ff");
  blade.material.emissiveIntensity = 0.35;
  blade.position.set(0.42, 1.45, 0.28);
  blade.rotation.x = -0.5;
  character.add(blade);
  const guard = mesh(new BoxGeometry(0.22, 0.05, 0.06), blue);
  guard.position.set(0.42, 1.0, 0.1);
  character.add(guard);
  const grip = mesh(new CylinderGeometry(0.035, 0.035, 0.22, 6), cloth("#1d2430"));
  grip.position.set(0.42, 0.88, 0.04);
  character.add(grip);

  return character;
};

/** Red samurai: dark purple plates, gold accents, kabuto with golden crest, katana. */
const buildSamurai = (): Group => {
  const character = new Group();
  const purple = metal("#5a2a6e");
  const gold = metal("#e8b13c");
  const red = cloth("#ff4d5a");

  character.add(buildLegs(purple, cloth("#241a2c")));
  character.add(buildTorso(purple, gold));

  // Sode: large rounded shoulder guards
  const arms = new Group();
  for (const x of [-0.44, 0.44]) {
    const sode = mesh(new SphereGeometry(0.2, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold);
    sode.position.set(x, 1.34, 0);
    sode.rotation.z = x > 0 ? -0.3 : 0.3;
    arms.add(sode);
    const arm = mesh(new CylinderGeometry(0.11, 0.1, 0.45, 8), purple);
    arm.position.set(x, 1.05, 0.02);
    arms.add(arm);
    const hand = mesh(new SphereGeometry(0.09, 8, 6), gold);
    hand.position.set(x, 0.82, 0.06);
    arms.add(hand);
  }
  character.add(arms);

  // Kusazuri: segmented skirt plates
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const plate = mesh(new BoxGeometry(0.2, 0.3, 0.05), purple);
    plate.position.set(Math.sin(angle) * 0.3, 0.72, Math.cos(angle) * 0.3);
    plate.lookAt(0, 0.72, 0);
    character.add(plate);
  }

  // Kabuto: helm bowl + golden crescent crest
  const helm = mesh(new SphereGeometry(0.3, 14, 12), purple);
  helm.position.y = 1.62;
  helm.scale.set(1, 1.05, 1);
  character.add(helm);
  const crest = mesh(new TorusGeometry(0.16, 0.035, 8, 16, Math.PI), gold);
  crest.position.set(0, 1.92, 0);
  crest.rotation.z = 0;
  character.add(crest);
  const facePlate = mesh(new BoxGeometry(0.26, 0.14, 0.1), cloth("#1a1220"));
  facePlate.position.set(0, 1.54, 0.26);
  character.add(facePlate);

  // Red sash
  const sash = mesh(new TorusGeometry(0.31, 0.045, 8, 16), red);
  sash.position.y = 0.86;
  sash.rotation.x = Math.PI / 2;
  character.add(sash);

  // Katana in the right hand, slightly forward
  const blade = mesh(new BoxGeometry(0.06, 1.0, 0.015), metal("#e8c8f0"));
  blade.material.emissive.set("#b0487a");
  blade.material.emissiveIntensity = 0.25;
  blade.position.set(0.44, 1.5, 0.3);
  blade.rotation.x = -0.55;
  character.add(blade);
  const tsuba = mesh(new CylinderGeometry(0.09, 0.09, 0.04, 10), gold);
  tsuba.position.set(0.44, 1.02, 0.12);
  tsuba.rotation.x = -0.55;
  character.add(tsuba);
  const tsuka = mesh(new CylinderGeometry(0.035, 0.035, 0.24, 6), cloth("#5a2a6e"));
  tsuka.position.set(0.44, 0.9, 0.05);
  tsuka.rotation.x = -0.55;
  character.add(tsuka);

  return character;
};

/** Builds the character for a seat: 0 = red samurai, 1 = blue knight. */
export const buildCharacter = (seat: 0 | 1): Group => (seat === 0 ? buildSamurai() : buildKnight());
