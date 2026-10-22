import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_COLOR, DEFAULT_SIZE, type GridSize } from "@/lib/palette";
import {
  type Cell,
  clonePixels,
  emptyPixels,
  floodFill,
  pixelsEqual,
  remapSize,
} from "@/lib/pixel-math";

export type { Cell };

export type Tool = "pencil" | "eraser" | "fill" | "eyedropper";

const MAX_HISTORY = 50;

type PixelState = {
  size: GridSize;
  pixels: Cell[];
  color: string;
  tool: Tool;
  showGrid: boolean;
  past: Cell[][];
  future: Cell[][];
  strokeBase: Cell[] | null;
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  toggleGrid: () => void;
  setSize: (size: GridSize) => void;
  paintCells: (cells: Array<[number, number]>, value: Cell) => void;
  fillAt: (x: number, y: number) => void;
  sampleAt: (x: number, y: number) => void;
  beginStroke: () => void;
  endStroke: () => void;
  clear: () => void;
  undo: () => void;
  redo: () => void;
};

function pushHistory(past: Cell[][], snapshot: Cell[]): Cell[][] {
  const next = [...past, snapshot];
  if (next.length > MAX_HISTORY) next.shift();
  return next;
}

export const usePixelStore = create<PixelState>()(
  persist(
    (set, get) => ({
      size: DEFAULT_SIZE,
      pixels: emptyPixels(DEFAULT_SIZE),
      color: DEFAULT_COLOR,
      tool: "pencil",
      showGrid: true,
      past: [],
      future: [],
      strokeBase: null,
      setTool: (tool) => set({ tool }),
      setColor: (color) => {
        const tool = get().tool;
        set({
          color,
          tool: tool === "eraser" || tool === "eyedropper" ? "pencil" : tool,
        });
      },
      toggleGrid: () => set({ showGrid: !get().showGrid }),
      setSize: (size) => {
        const state = get();
        if (size === state.size) return;
        const pixels = remapSize(state.pixels, state.size, size);
        set({
          size,
          pixels,
          past: pushHistory(state.past, clonePixels(state.pixels)),
          future: [],
          strokeBase: null,
        });
      },
      paintCells: (cells, value) => {
        const { pixels, size } = get();
        const next = clonePixels(pixels);
        let changed = false;
        for (const [x, y] of cells) {
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const i = y * size + x;
          if (next[i] === value) continue;
          next[i] = value;
          changed = true;
        }
        if (changed) set({ pixels: next });
      },
      fillAt: (x, y) => {
        const { pixels, size, color } = get();
        const next = floodFill(pixels, size, x, y, color);
        if (pixelsEqual(next, pixels)) return;
        set({
          pixels: next,
          past: pushHistory(get().past, clonePixels(pixels)),
          future: [],
        });
      },
      sampleAt: (x, y) => {
        const { pixels, size } = get();
        if (x < 0 || y < 0 || x >= size || y >= size) return;
        const sampled = pixels[y * size + x];
        if (sampled == null) {
          set({ tool: "eraser" });
          return;
        }
        set({ color: sampled, tool: "pencil" });
      },
      beginStroke: () => {
        set({ strokeBase: clonePixels(get().pixels) });
      },
      endStroke: () => {
        const { strokeBase, pixels } = get();
        if (!strokeBase) return;
        if (!pixelsEqual(strokeBase, pixels)) {
          set({
            past: pushHistory(get().past, strokeBase),
            future: [],
            strokeBase: null,
          });
          return;
        }
        set({ strokeBase: null });
      },
      clear: () => {
        const { pixels, size } = get();
        const next = emptyPixels(size);
        if (pixelsEqual(next, pixels)) return;
        set({
          pixels: next,
          past: pushHistory(get().past, clonePixels(pixels)),
          future: [],
        });
      },
      undo: () => {
        const { past, pixels, future } = get();
        if (past.length === 0) return;
        const prev = past[past.length - 1]!;
        set({
          past: past.slice(0, -1),
          pixels: clonePixels(prev),
          future: [clonePixels(pixels), ...future],
          strokeBase: null,
        });
      },
      redo: () => {
        const { past, pixels, future } = get();
        if (future.length === 0) return;
        const next = future[0]!;
        set({
          past: pushHistory(past, clonePixels(pixels)),
          pixels: clonePixels(next),
          future: future.slice(1),
          strokeBase: null,
        });
      },
    }),
    {
      name: "bitloom-canvas",
      skipHydration: true,
      partialize: (state) => ({
        size: state.size,
        pixels: state.pixels,
        color: state.color,
        tool: state.tool,
        showGrid: state.showGrid,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PixelState>;
        const size = (p.size ?? current.size) as GridSize;
        const pixels =
          Array.isArray(p.pixels) && p.pixels.length === size * size
            ? p.pixels
            : emptyPixels(size);
        return {
          ...current,
          ...p,
          size,
          pixels,
          past: [],
          future: [],
          strokeBase: null,
        };
      },
    },
  ),
);
