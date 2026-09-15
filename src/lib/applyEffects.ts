import { vctrfx } from 'vctrfx';
import { buildEffects, type EffectConfig } from './effects';

/**
 * Run the post-processing stack over a finished shellfie SVG.
 *
 * Every render path funnels through here — preview, export, compare, and
 * the server-side generator behind shared links — so an effect stack can't
 * apply in one place and silently vanish in another.
 *
 * Deliberately forgiving: the stack is user-assembled and a bad parameter
 * combination is a normal thing to hit while dragging a slider, so a
 * throwing effect returns the un-effected SVG rather than taking the whole
 * preview down.
 */
export function applyEffects(
  svg: string,
  stack: readonly EffectConfig[] | undefined,
  settings: { animate?: boolean } = {},
): string {
  if (!svg || !stack?.length) return svg;
  const effects = buildEffects(stack);
  if (!effects.length) return svg;
  try {
    return vctrfx(svg, effects, { animate: settings.animate ?? true });
  } catch (error) {
    console.error('vctrfx: effect stack failed, using the plain SVG', error);
    return svg;
  }
}
