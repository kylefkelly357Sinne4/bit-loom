import type { ReactNode } from "react";
import {
  Download,
  Eraser,
  Grid3x3,
  PaintBucket,
  Pencil,
  Pipette,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { GRID_SIZES, PALETTE, type GridSize } from "@/lib/palette";
import { downloadPng } from "@/lib/pixel-math";
import { usePixelStore, type Tool } from "@/lib/pixel-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function ToolTipButton({
  label,
  shortcut,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant={pressed ? "pressed" : "ghost"}
          aria-label={label}
          aria-pressed={pressed}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut ? (
          <span className="text-muted-foreground"> {shortcut}</span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

function Mark() {
  const cells = [1, 0, 1, 0, 1, 0, 1, 0, 1];
  return (
    <span className="grid size-6 grid-cols-3 gap-px" aria-hidden="true">
      {cells.map((on, i) => (
        <span key={i} className={on ? "bg-primary" : "bg-transparent"} />
      ))}
    </span>
  );
}

export function StudioHeader() {
  const size = usePixelStore((s) => s.size);
  const canUndo = usePixelStore((s) => s.past.length > 0);
  const canRedo = usePixelStore((s) => s.future.length > 0);
  const undo = usePixelStore((s) => s.undo);
  const redo = usePixelStore((s) => s.redo);
  const clear = usePixelStore((s) => s.clear);
  const setSize = usePixelStore((s) => s.setSize);
  const pixels = usePixelStore((s) => s.pixels);

  return (
    <header className="flex shrink-0 flex-col gap-2 border-b border-border px-3 py-2 md:flex-row md:items-center md:gap-3 md:px-4">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Mark />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">
              Bitloom
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Pixel studio
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <ToolTipButton label="Undo" shortcut="⌘Z" disabled={!canUndo} onClick={undo}>
            <Undo2 />
          </ToolTipButton>
          <ToolTipButton label="Redo" shortcut="⇧⌘Z" disabled={!canRedo} onClick={redo}>
            <Redo2 />
          </ToolTipButton>
          <Button
            type="button"
            size="icon"
            onClick={() => downloadPng(pixels, size)}
            aria-label="Export PNG"
          >
            <Download />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 md:flex-1">
        {GRID_SIZES.map((value) => (
          <Button
            key={value}
            type="button"
            size="chip"
            variant={size === value ? "pressed" : "ghost"}
            aria-pressed={size === value}
            onClick={() => setSize(value as GridSize)}
            className="min-w-9 font-mono"
          >
            {value}
          </Button>
        ))}
      </div>

      <div className="hidden items-center gap-1 md:flex">
        <ToolTipButton label="Undo" shortcut="⌘Z" disabled={!canUndo} onClick={undo}>
          <Undo2 />
        </ToolTipButton>
        <ToolTipButton label="Redo" shortcut="⇧⌘Z" disabled={!canRedo} onClick={redo}>
          <Redo2 />
        </ToolTipButton>
        <ToolTipButton label="Clear canvas" onClick={clear}>
          <Trash2 />
        </ToolTipButton>
        <Button type="button" onClick={() => downloadPng(pixels, size)} className="ml-1">
          <Download />
          <span>Export PNG</span>
        </Button>
      </div>
    </header>
  );
}

const TOOLS: Array<{
  id: Tool;
  label: string;
  shortcut: string;
  icon: typeof Pencil;
}> = [
  { id: "pencil", label: "Pencil", shortcut: "P", icon: Pencil },
  { id: "eraser", label: "Eraser", shortcut: "E", icon: Eraser },
  { id: "fill", label: "Fill", shortcut: "F", icon: PaintBucket },
  { id: "eyedropper", label: "Eyedropper", shortcut: "I", icon: Pipette },
];

export function ToolRail() {
  const tool = usePixelStore((s) => s.tool);
  const setTool = usePixelStore((s) => s.setTool);
  const showGrid = usePixelStore((s) => s.showGrid);
  const toggleGrid = usePixelStore((s) => s.toggleGrid);
  const clear = usePixelStore((s) => s.clear);

  return (
    <aside className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-2 md:py-3">
      {TOOLS.map(({ id, label, shortcut, icon: Icon }) => (
        <ToolTipButton
          key={id}
          label={label}
          shortcut={shortcut}
          pressed={tool === id}
          onClick={() => setTool(id)}
        >
          <Icon />
        </ToolTipButton>
      ))}
      <div className="mx-1 hidden h-px w-7 bg-border md:block" />
      <div className="h-7 w-px bg-border md:hidden" />
      <ToolTipButton
        label="Toggle grid"
        shortcut="G"
        pressed={showGrid}
        onClick={toggleGrid}
      >
        <Grid3x3 />
      </ToolTipButton>
      <div className="md:hidden">
        <ToolTipButton label="Clear canvas" onClick={clear}>
          <Trash2 />
        </ToolTipButton>
      </div>
    </aside>
  );
}

export function PaletteRail() {
  const color = usePixelStore((s) => s.color);
  const setColor = usePixelStore((s) => s.setColor);
  const tool = usePixelStore((s) => s.tool);
  const setTool = usePixelStore((s) => s.setTool);

  return (
    <aside className="shrink-0 border-t border-border px-3 py-3 md:w-52 md:border-t-0 md:border-l">
      <div className="mb-3 flex items-center gap-3">
        <span
          className={cn(
            "size-11 shrink-0 rounded-md shadow-panel",
            tool === "eraser" && "bg-checkboard",
          )}
          style={tool === "eraser" ? undefined : { backgroundColor: color }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Paint</p>
          <p className="truncate font-mono text-sm tabular-nums text-foreground">
            {tool === "eraser" ? "Erase" : color}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-8 gap-1.5 md:grid-cols-4">
        {PALETTE.map((hex) => {
          const active =
            tool !== "eraser" && color.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              aria-label={hex}
              aria-pressed={active}
              onClick={() => setColor(hex)}
              className={cn(
                "relative size-9 rounded-sm shadow-panel transition-transform duration-150 ease-out hover:z-10 hover:scale-105 md:size-10",
                active &&
                  "z-10 ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
              style={{ backgroundColor: hex }}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setTool("eraser")}
        aria-pressed={tool === "eraser"}
        className={cn(
          "mt-2 flex h-10 w-full items-center justify-center rounded-md text-xs font-medium text-muted-foreground shadow-panel transition-colors duration-150 hover:bg-secondary hover:text-foreground",
          tool === "eraser" && "bg-secondary text-foreground",
        )}
      >
        Transparent
      </button>
    </aside>
  );
}

export function ShortcutHint() {
  return (
    <p className="hidden px-4 py-2 text-center text-xs text-muted-foreground md:block">
      P pencil · E eraser · F fill · I eyedropper · G grid · Alt-click sample ·
      ⌘Z undo
    </p>
  );
}
