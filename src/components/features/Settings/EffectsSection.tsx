import { memo, useState } from 'react';
import { useStore } from '@/store';
import { Button, ColorPicker, NumberSlider, Select, Toggle } from '@/components/common';
import {
  EFFECTS,
  EFFECT_GROUPS,
  LOOKS,
  expandLook,
  findEffect,
  groupStack,
  isTuned,
  newEffectUid,
  resolveParams,
  type Control,
  type ControlValue,
  type EffectConfig,
} from '@/lib/effects';
import panel from './SettingsPanel.module.scss';
import styles from './EffectsSection.module.scss';

/**
 * Post-processing stack editor, backed by `@svgfx/postprocessing`.
 *
 * Order is significant — svgfx composes effects as a pipeline, so
 * blur-then-threshold is a different picture from threshold-then-blur.
 * Hence a reorderable list rather than checkboxes, and hence the same
 * effect may legitimately appear twice.
 *
 * The library's presets ("Looks") are added *expanded* into the effects
 * they're composed of, wrapped in a container carrying the Look's name.
 * Added as one opaque effect a preset is a dead end; this way the whole
 * recipe is visible and every knob inside it stays reachable, while the
 * stack underneath stays flat and so cannot render differently.
 */

/** One parameter, rendered according to its declared control type. */
const EffectControl = memo(function EffectControl({
  control,
  value,
  onChange,
}: {
  control: Control;
  value: ControlValue;
  onChange: (next: ControlValue) => void;
}) {
  switch (control.type) {
    case 'number':
      return (
        <NumberSlider
          label={control.label}
          value={typeof value === 'number' ? value : control.default}
          onChange={onChange}
          min={control.min}
          max={control.max}
          step={control.step}
        />
      );
    case 'boolean':
      return (
        <Toggle
          label={control.label}
          checked={typeof value === 'boolean' ? value : control.default}
          onChange={onChange}
        />
      );
    case 'color':
      return (
        <ColorPicker
          label={control.label}
          value={typeof value === 'string' ? value : control.default}
          onChange={onChange}
          fullWidth
        />
      );
    case 'optionalColor':
      // An empty field means "no paper" to the library, i.e. null.
      return (
        <ColorPicker
          label={control.label}
          value={typeof value === 'string' ? value : ''}
          onChange={(next) => onChange(next === '' ? null : next)}
          placeholder="none"
          fullWidth
        />
      );
    case 'enum':
      return (
        <Select
          label={control.label}
          value={typeof value === 'string' ? value : control.default}
          onChange={onChange}
          options={control.options.map((o) => ({ value: o, label: o }))}
          fullWidth
        />
      );
  }
});

/**
 * One effect row: enable, expandable name, reorder, remove, and its
 * parameters when open. Used at top level and nested inside a Look —
 * which is the only reason `nested` exists.
 */
const EffectRow = memo(function EffectRow({
  entry,
  nested = false,
  open,
  onToggleOpen,
  canMoveUp,
  canMoveDown,
  onMove,
  onEnabled,
  onRemove,
  onParam,
  onReset,
}: {
  entry: EffectConfig;
  nested?: boolean;
  open: boolean;
  onToggleOpen: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (delta: number) => void;
  onEnabled: (value: boolean) => void;
  onRemove: () => void;
  onParam: (key: string, value: ControlValue) => void;
  onReset: () => void;
}) {
  const descriptor = findEffect(entry.id);
  if (!descriptor) return null;
  const params = resolveParams(descriptor, entry.params);
  const tuned = isTuned(entry);
  const count = descriptor.controls.length;

  return (
    <li className={`${styles.row} ${nested ? styles.rowNested : ''}`}>
      <div className={styles.rowHead}>
        <Toggle checked={entry.enabled} onChange={onEnabled} />
        <button
          type="button"
          className={`${styles.rowName} ${open ? styles.rowNameOpen : ''}`}
          onClick={onToggleOpen}
          disabled={count === 0}
          aria-expanded={open}
        >
          <span className={styles.rowLabel}>{descriptor.label}</span>
          {count > 0 && (
            <span className={styles.rowMeta}>
              {tuned ? 'edited' : `${count} setting${count === 1 ? '' : 's'}`}
            </span>
          )}
        </button>
        <div className={styles.rowActions}>
          <Button
            variant="ghost"
            size="sm"
            icon="chevronUp"
            onClick={() => onMove(-1)}
            disabled={!canMoveUp}
            aria-label={`Move ${descriptor.label} earlier`}
          />
          <Button
            variant="ghost"
            size="sm"
            icon="chevronDown"
            onClick={() => onMove(1)}
            disabled={!canMoveDown}
            aria-label={`Move ${descriptor.label} later`}
          />
          <Button
            variant="ghost"
            size="sm"
            icon="x"
            onClick={onRemove}
            aria-label={`Remove ${descriptor.label}`}
          />
        </div>
      </div>

      {open && (
        <div className={styles.params}>
          <p className={styles.paramsDesc}>{descriptor.description}</p>
          {descriptor.controls.map((control) => (
            <EffectControl
              key={control.key}
              control={control}
              value={params[control.key]}
              onChange={(v) => onParam(control.key, v)}
            />
          ))}
          {tuned && (
            <button type="button" className={styles.reset} onClick={onReset}>
              {entry.group ? `Reset to ${entry.group.label} values` : 'Reset to defaults'}
            </button>
          )}
        </div>
      )}
    </li>
  );
});

export const EffectsSection = memo(function EffectsSection({
  bare = false,
}: {
  /** Skip the sidebar's `<section>` chrome — the toolbar popover supplies
   *  its own heading, same convention as BackgroundSection. */
  bare?: boolean;
} = {}) {
  const stack = useStore((s) => s.effects);
  const setEffects = useStore((s) => s.setEffects);
  // One expanded row at a time — every effect's parameters at once would
  // be an unreadable wall of sliders in a sidebar.
  const [openUid, setOpenUid] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const add = (id: string) => {
    const descriptor = findEffect(id);
    if (!descriptor) return;
    const entry: EffectConfig = { uid: newEffectUid(id), id, enabled: true, params: {} };
    setEffects([...stack, entry]);
    // Adding an effect is nearly always followed by tuning it.
    if (descriptor.controls.length > 0) setOpenUid(entry.uid);
  };

  const addLook = (lookId: string) => {
    const look = LOOKS.find((l) => l.id === lookId);
    if (!look) return;
    const entries = expandLook(look);
    setEffects([...stack, ...entries]);
    setOpenGroup(entries[0]?.group?.uid ?? null);
  };

  const update = (uid: string, patch: Partial<EffectConfig>) =>
    setEffects(stack.map((e) => (e.uid === uid ? { ...e, ...patch } : e)));

  const remove = (uid: string) => setEffects(stack.filter((e) => e.uid !== uid));

  const move = (uid: string, delta: number) => {
    const index = stack.findIndex((e) => e.uid === uid);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= stack.length) return;
    const next = [...stack];
    [next[index], next[target]] = [next[target], next[index]];
    setEffects(next);
  };

  /** Reorder a whole Look, keeping its members contiguous. */
  const moveGroup = (groupUid: string, delta: number) => {
    const members = stack.filter((e) => e.group?.uid === groupUid);
    if (members.length === 0) return;
    const firstIndex = stack.findIndex((e) => e.group?.uid === groupUid);
    const rest = stack.filter((e) => e.group?.uid !== groupUid);
    const runs = groupStack(rest);
    // Position is expressed against the stack minus this group, so
    // stepping past a neighbouring Look jumps the whole block rather than
    // burrowing into it.
    const at = runs.findIndex((run) =>
      run.kind === 'group' ? run.start >= firstIndex : run.index >= firstIndex,
    );
    const position = at === -1 ? runs.length : at;
    const target = Math.max(0, Math.min(runs.length, position + delta));
    if (target === position) return;
    const flat: EffectConfig[] = [];
    runs.forEach((run, i) => {
      if (i === target) flat.push(...members);
      flat.push(...(run.kind === 'group' ? run.entries : [run.entry]));
    });
    if (target >= runs.length) flat.push(...members);
    setEffects(flat);
  };

  const setGroupEnabled = (groupUid: string, enabled: boolean) =>
    setEffects(stack.map((e) => (e.group?.uid === groupUid ? { ...e, enabled } : e)));

  const removeGroup = (groupUid: string) =>
    setEffects(stack.filter((e) => e.group?.uid !== groupUid));

  const setParam = (entry: EffectConfig, key: string, value: ControlValue) =>
    update(entry.uid, { params: { ...entry.params, [key]: value } });

  /** Back to creation values: the Look's recipe for a Look member, the
   *  effect's own defaults for a standalone entry. */
  const resetParams = (entry: EffectConfig) =>
    update(entry.uid, { params: { ...(entry.baseline ?? {}) } });

  const body = (
    <div className={styles.wrap}>
      <div className={styles.stackHead}>
        <span className={styles.stackTitle}>
          Stack{stack.length > 0 ? ` · ${stack.length}` : ''}
        </span>
        {stack.length > 0 && (
          <button type="button" className={styles.clear} onClick={() => setEffects([])}>
            Clear all
          </button>
        )}
      </div>

      {stack.length === 0 ? (
        <p className={styles.empty}>
          Nothing applied. Add a Look for a whole recipe, or a single effect —
          they stack in order, top to bottom.
        </p>
      ) : (
        <ul className={styles.rows}>
          {groupStack(stack).map((run) =>
            run.kind === 'effect' ? (
              <EffectRow
                key={run.entry.uid}
                entry={run.entry}
                open={openUid === run.entry.uid}
                onToggleOpen={() =>
                  setOpenUid(openUid === run.entry.uid ? null : run.entry.uid)
                }
                canMoveUp={run.index > 0}
                canMoveDown={run.index < stack.length - 1}
                onMove={(d) => move(run.entry.uid, d)}
                onEnabled={(v) => update(run.entry.uid, { enabled: v })}
                onRemove={() => remove(run.entry.uid)}
                onParam={(k, v) => setParam(run.entry, k, v)}
                onReset={() => resetParams(run.entry)}
              />
            ) : (
              <li key={run.uid} className={styles.group}>
                <div className={styles.groupHead}>
                  <Toggle
                    checked={run.entries.some((e) => e.enabled)}
                    onChange={(v) => setGroupEnabled(run.uid, v)}
                  />
                  <button
                    type="button"
                    className={`${styles.rowName} ${openGroup === run.uid ? styles.rowNameOpen : ''}`}
                    onClick={() => setOpenGroup(openGroup === run.uid ? null : run.uid)}
                    aria-expanded={openGroup === run.uid}
                  >
                    <span className={styles.groupChevron} aria-hidden>
                      {openGroup === run.uid ? '▾' : '▸'}
                    </span>
                    <span className={styles.rowLabel}>{run.label}</span>
                    <span className={styles.rowMeta}>Look · {run.entries.length} effects</span>
                  </button>
                  <div className={styles.rowActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="chevronUp"
                      onClick={() => moveGroup(run.uid, -1)}
                      aria-label={`Move ${run.label} earlier`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="chevronDown"
                      onClick={() => moveGroup(run.uid, 1)}
                      aria-label={`Move ${run.label} later`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon="x"
                      onClick={() => removeGroup(run.uid)}
                      aria-label={`Remove ${run.label}`}
                    />
                  </div>
                </div>

                {openGroup === run.uid && (
                  <ul className={styles.groupChildren}>
                    {run.entries.map((entry) => {
                      const index = stack.indexOf(entry);
                      return (
                        <EffectRow
                          key={entry.uid}
                          entry={entry}
                          nested
                          open={openUid === entry.uid}
                          onToggleOpen={() =>
                            setOpenUid(openUid === entry.uid ? null : entry.uid)
                          }
                          canMoveUp={index > run.start}
                          canMoveDown={index < run.start + run.entries.length - 1}
                          onMove={(d) => move(entry.uid, d)}
                          onEnabled={(v) => update(entry.uid, { enabled: v })}
                          onRemove={() => remove(entry.uid)}
                          onParam={(k, v) => setParam(entry, k, v)}
                          onReset={() => resetParams(entry)}
                        />
                      );
                    })}
                  </ul>
                )}
              </li>
            ),
          )}
        </ul>
      )}

      <div className={styles.library}>
        <div className={styles.libGroup}>
          <span className={styles.groupName}>
            Looks
            <span className={styles.groupNote}>added as editable effects</span>
          </span>
          <div className={styles.chips}>
            {LOOKS.map((look) => (
              <button
                key={look.id}
                type="button"
                className={`${styles.chip} ${styles.chipLook}`}
                onClick={() => addLook(look.id)}
                title={`${look.description} — ${look.recipe.length} effects`}
              >
                {look.label}
              </button>
            ))}
          </div>
        </div>

        {EFFECT_GROUPS.map((group) => {
          const inGroup = EFFECTS.filter((e) => e.group === group);
          if (inGroup.length === 0) return null;
          return (
            <div key={group} className={styles.libGroup}>
              <span className={styles.groupName}>{group}</span>
              <div className={styles.chips}>
                {inGroup.map((descriptor) => (
                  <button
                    key={descriptor.id}
                    type="button"
                    className={styles.chip}
                    onClick={() => add(descriptor.id)}
                    title={descriptor.description}
                  >
                    {descriptor.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (bare) return body;

  return (
    <section className={panel.section}>
      <div className={panel.sectionHeader}>
        <h3 className={panel.sectionTitle}>Effects</h3>
      </div>
      <div className={panel.sectionContent}>{body}</div>
    </section>
  );
});
