import type { AnimationClip, Object3D } from "three";
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

  /** Advances the mixer. Call once per rendered frame with the frame delta. */
  update(deltaSeconds: number): void {
    this.mixer.update(deltaSeconds);
    // Applied after the mixer so per-frame overrides (e.g. a closed grip
    // around a weapon) always win over the clip's finger poses.
    this.postUpdate?.();
  }
}
