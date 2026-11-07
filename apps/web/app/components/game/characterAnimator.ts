import type { AnimationClip, Object3D, VectorKeyframeTrack } from "three";
import { AnimationMixer, LoopOnce, LoopRepeat } from "three";

/**
 * Per-character animation driver built on three.js AnimationMixer.
 *
 * Shared by every character model (both seats) - only the clip names differ,
 * as declared in the *.manifest.json files beside the models:
 *   idle:  "Axe_Breathe_and_Look_Around"
 *   walk:  "Walking"
 *   (future: attack / jump clips)
 *
 * Transitions use a crossfade (default 0.3s) so no clip ever cuts abruptly,
 * and starting a new action cleanly interrupts the current one.
 */

const DEFAULT_CROSSFADE_S = 0.3;

export type CharacterAnimatorClips = {
  idle: string;
  walk: string;
};

type ClipAction = ReturnType<AnimationMixer["clipAction"]>;

export class CharacterAnimator {
  private readonly mixer: AnimationMixer;
  private readonly clips = new Map<string, AnimationClip>();
  private current: ClipAction | null = null;

  private readonly postUpdate?: () => void;
  /** Clips with their horizontal root motion pinned (see playOncePinned). */
  private readonly pinnedClips = new Map<string, AnimationClip>();

  constructor(
    model: Object3D,
    clips: AnimationClip[],
    private readonly clipNames: CharacterAnimatorClips,
    postUpdate?: () => void,
  ) {
    this.postUpdate = postUpdate;
    for (const clip of clips) {
      this.clips.set(clip.name, clip);
    }
    this.mixer = new AnimationMixer(model);
    // Default state from the very first frame - never a T-pose.
    this.playIdle(0);
  }

  /** Crossfades to a clip action, cleanly interrupting whatever is playing. */
  private play(clipName: string, loop: boolean, crossfadeS: number): void {
    const clip = this.clips.get(clipName);
    if (!clip) return;
    const next = this.mixer.clipAction(clip);
    next.setLoop(loop ? LoopRepeat : LoopOnce, Infinity);
    next.clampWhenFinished = !loop;
    next.reset();
    if (this.current && crossfadeS > 0 && this.current !== next) {
      // Warped crossfade: the outgoing clip is time-scaled to finish together.
      next.crossFadeFrom(this.current, crossfadeS, true);
    } else {
      this.current?.stop();
    }
    this.current = next;
    next.play();
  }

  /** Idle breathing loop - the default state, never a T-pose. */
  playIdle(crossfadeS = DEFAULT_CROSSFADE_S): void {
    this.play(this.clipNames.idle, true, crossfadeS);
  }

  /** Walking loop, used while the character travels to its destination. */
  playWalking(crossfadeS = DEFAULT_CROSSFADE_S): void {
    this.play(this.clipNames.walk, true, crossfadeS);
  }

  /**
   * Plays a one-shot clip (attack, jump...) time-scaled to fit durationMs,
   * then crossfades back to idle. onFinished fires when the clip ends.
   */
  playOnce(clipName: string, durationMs: number, onFinished?: () => void): void {
    const clip = this.clips.get(clipName);
    if (!clip) {
      onFinished?.();
      return;
    }
    this.playClip(clip, durationMs, onFinished);
  }

  /**
   * Same as playOnce, but the clip's baked horizontal root motion (hips
   * X/Z) is pinned to the idle standing pose: the character falls and gets
   * up exactly where it stands on the arena instead of sliding backward.
   */
  playOncePinned(clipName: string, durationMs: number, onFinished?: () => void): void {
    const clip = this.clips.get(clipName);
    const idle = this.clips.get(this.clipNames.idle);
    if (!clip || !idle) {
      this.playOnce(clipName, durationMs, onFinished);
      return;
    }
    let pinned = this.pinnedClips.get(clipName);
    if (!pinned) {
      pinned = this.pinRootMotion(clip, idle);
      this.pinnedClips.set(clipName, pinned);
    }
    this.playClip(pinned, durationMs, onFinished);
  }

  /** One-shot playback of a (possibly pre-processed) clip. */
  private playClip(clip: AnimationClip, durationMs: number, onFinished?: () => void): void {
    const action = this.mixer.clipAction(clip);
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset();
    this.current?.stop();
    this.current = action;
    // Time-scale the clip so it completes within durationMs.
    action.timeScale = clip.duration / Math.max(0.001, durationMs / 1000);
    action.play();

    const onMixerFinished = (event: { action: ClipAction }): void => {
      if (event.action !== action) return;
      this.mixer.removeEventListener("finished", onMixerFinished);
      this.playIdle();
      onFinished?.();
    };
    this.mixer.addEventListener("finished", onMixerFinished);
  }

  /**
   * Pins the hips X/Z of a clip's position track to the idle pose's frame-0
   * X/Z: the vertical motion (falling) is kept, the horizontal slide is not.
   */
  private pinRootMotion(source: AnimationClip, idle: AnimationClip): AnimationClip {
    const refTrack = idle.tracks.find((track) => track.name.endsWith("Hips.position"));
    if (!refTrack) return source;
    const refValues = (refTrack as VectorKeyframeTrack).values;
    const refX = refValues[0] ?? 0;
    const refZ = refValues[2] ?? 0;
    const pinned = source.clone();
    for (const track of pinned.tracks) {
      if (!track.name.endsWith("Hips.position")) continue;
      const values = (track as VectorKeyframeTrack).values;
      for (let i = 0; i < values.length; i += 3) {
        values[i] = refX;
        values[i + 2] = refZ;
      }
    }
    return pinned;
  }

  /** Advances the mixer. Call once per rendered frame with the frame delta. */
  update(deltaSeconds: number): void {
    this.mixer.update(deltaSeconds);
    // Applied after the mixer so per-frame overrides (e.g. a closed grip
    // around a weapon) always win over the clip's finger poses.
    this.postUpdate?.();
  }
}
