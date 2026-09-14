import type { RawScheduleBlock } from '../types';

type ScheduleOverride =
  | { remove: true }
  | { changes: Partial<Pick<RawScheduleBlock, 'raw' | 'slotStart' | 'slotEnd'>> };

/** Ruční změny doručené po vydání zdrojového Excelu. */
export const SCHEDULE_OVERRIDES: Record<string, ScheduleOverride> = {};

export function applyScheduleOverride(
  block: RawScheduleBlock,
): RawScheduleBlock | undefined {
  const override = SCHEDULE_OVERRIDES[block.id];
  if (!override) return block;
  if ('remove' in override) return undefined;
  return { ...block, ...override.changes };
}
