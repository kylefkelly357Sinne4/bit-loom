/** PICO-8 16 — limited retro drawing palette, not UI chrome. */
export const PALETTE = [
  "#000000",
  "#1D2B53",
  "#7E2553",
  "#008751",
  "#AB5236",
  "#5F574F",
  "#C2C3C7",
  "#FFF1E8",
  "#FF004D",
  "#FFA300",
  "#FFEC27",
  "#00E436",
  "#29ADFF",
  "#83769C",
  "#FF77A8",
  "#FFCCAA",
] as const;

export const GRID_SIZES = [8, 16, 24, 32, 48, 64] as const;

export type GridSize = (typeof GRID_SIZES)[number];

export const DEFAULT_COLOR = PALETTE[8];
export const DEFAULT_SIZE: GridSize = 16;
