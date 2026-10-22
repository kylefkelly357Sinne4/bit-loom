import { useCallback, useEffect, useRef, useState } from "react";
import { bresenham } from "@/lib/pixel-math";
import { usePixelStore, type Cell } from "@/lib/pixel-store";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };

function readCssVar(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function paintCanvas(
  ctx: CanvasRenderingContext2D,
  pixels: Cell[],
  size: number,
  cell: number,
  dpr: number,
  showGrid: boolean,
) {
  const css = size * cell;
  const checkA = readCssVar("--color-check-a", "#121214");
  const checkB = readCssVar("--color-check-b", "#1a1a1e");
  const grid = readCssVar("--color-grid-line", "rgba(255,255,255,0.12)");

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, css, css);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = pixels[y * size + x];
      ctx.fillStyle = color ?? ((x + y) % 2 === 0 ? checkA : checkB);
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  if (showGrid && cell >= 4) {
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= size; i++) {
      const p = i * cell + 0.5;
      ctx.moveTo(p, 0);
      ctx.lineTo(p, css);
      ctx.moveTo(0, p);
      ctx.lineTo(css, p);
    }
    ctx.stroke();
  }
}

function eventToCell(
  event: Pick<PointerEvent, "clientX" | "clientY">,
  canvas: HTMLCanvasElement,
  size: number,
): Point {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * size);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * size);
  return {
    x: Math.min(size - 1, Math.max(0, x)),
    y: Math.min(size - 1, Math.max(0, y)),
  };
}

export function PixelCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<Point | null>(null);
  const [cell, setCell] = useState(16);
  const [hover, setHover] = useState<Point | null>(null);

  const size = usePixelStore((s) => s.size);
  const pixels = usePixelStore((s) => s.pixels);
  const showGrid = usePixelStore((s) => s.showGrid);
  const tool = usePixelStore((s) => s.tool);
  const isEmpty = pixels.every((p) => p == null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const pad = 8;
      const max = Math.max(0, Math.min(width, height) - pad);
      setCell(Math.max(4, Math.floor(max / size)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || cell < 1) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const css = size * cell;
    canvas.width = Math.max(1, Math.floor(css * dpr));
    canvas.height = Math.max(1, Math.floor(css * dpr));
    canvas.style.width = `${css}px`;
    canvas.style.height = `${css}px`;
    paintCanvas(
      ctx,
      usePixelStore.getState().pixels,
      size,
      cell,
      dpr,
      usePixelStore.getState().showGrid,
    );
  }, [cell, size]);

  useEffect(() => {
    redraw();
  }, [redraw, pixels, showGrid]);

  const paintFrom = (from: Point | null, to: Point) => {
    const { tool: currentTool, color, paintCells } = usePixelStore.getState();
    const value = currentTool === "eraser" ? null : color;
    const cells: Array<[number, number]> = from
      ? bresenham(from.x, from.y, to.x, to.y)
      : [[to.x, to.y]];
    paintCells(cells, value);
    last.current = to;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const canvas = event.currentTarget;
    canvas.setPointerCapture(event.pointerId);
    const point = eventToCell(event.nativeEvent, canvas, size);
    const state = usePixelStore.getState();

    if (event.altKey || state.tool === "eyedropper") {
      state.sampleAt(point.x, point.y);
      return;
    }
    if (state.tool === "fill") {
      state.fillAt(point.x, point.y);
      return;
    }

    drawing.current = true;
    last.current = null;
    state.beginStroke();
    paintFrom(null, point);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const point = eventToCell(event.nativeEvent, canvas, size);
    setHover(point);
    if (!drawing.current) return;
    paintFrom(last.current, point);
  };

  const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    usePixelStore.getState().endStroke();
  };

  const cursor =
    tool === "eraser"
      ? "cell"
      : tool === "fill"
        ? "pointer"
        : tool === "eyedropper"
          ? "copy"
          : "crosshair";

  const cssSize = size * cell;

  return (
    <div
      ref={wrapRef}
      className="relative flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-center"
    >
      <div
        className="relative shadow-panel"
        style={{ width: cssSize, height: cssSize }}
      >
        <canvas
          ref={canvasRef}
          className="block touch-none select-none"
          style={{ width: cssSize, height: cssSize, cursor }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={() => setHover(null)}
          onContextMenu={(event) => event.preventDefault()}
          aria-label="Pixel canvas"
        />
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="rounded-md bg-background/70 px-3 py-1.5 text-sm text-muted-foreground">
              Click and drag to draw
            </p>
          </div>
        )}
      </div>
      <div
        className={cn(
          "pointer-events-none absolute bottom-3 left-3 font-mono text-xs tabular-nums text-muted-foreground",
        )}
      >
        {hover ? `${hover.x}, ${hover.y}` : `${size} × ${size}`}
      </div>
    </div>
  );
}
