// Minimal className combiner (no dependency).
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// Stable color per family for badges, drawn from a restrained set that does not
// compete with the heatmap palettes.
const FAMILY_COLORS: Record<string, string> = {
  logic: '#7aa2c8',
  math: '#c89b6b',
  code: '#7fb59b',
  language: '#b58fc4',
  safety: '#c47f8f',
};

export function familyColor(family: string): string {
  return FAMILY_COLORS[family?.toLowerCase()] ?? '#8a8f9a';
}
