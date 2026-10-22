import { useEffect } from "react";
import {
  PaletteRail,
  ShortcutHint,
  StudioHeader,
  ToolRail,
} from "@/components/studio-chrome";
import { PixelCanvas } from "@/components/pixel-canvas";
import { TooltipProvider } from "@/components/ui/tooltip";
import { downloadPng } from "@/lib/pixel-math";
import { usePixelStore, type Tool } from "@/lib/pixel-store";
import { GRID_SIZES, type GridSize } from "@/lib/palette";

const TOOL_KEYS: Record<string, Tool> = {
  p: "pencil",
  b: "pencil",
  e: "eraser",
  f: "fill",
  i: "eyedropper",
};

export function PixelStudio() {
  useEffect(() => {
    void usePixelStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const meta = event.metaKey || event.ctrlKey;
      const store = usePixelStore.getState();

      if (meta && key === "z") {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if (meta && key === "y") {
        event.preventDefault();
        store.redo();
        return;
      }
      if (meta && key === "s") {
        event.preventDefault();
        downloadPng(store.pixels, store.size);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (key === "g") {
        store.toggleGrid();
        return;
      }
      const tool = TOOL_KEYS[key];
      if (tool) {
        store.setTool(tool);
        return;
      }
      if (key >= "1" && key <= "6") {
        const size = GRID_SIZES[Number(key) - 1];
        if (size) store.setSize(size as GridSize);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <StudioHeader />
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <ToolRail />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <main className="flex min-h-0 flex-1 p-3 md:p-5">
              <div className="flex h-full min-h-0 w-full min-w-0 flex-1 rounded-xl bg-card p-3">
                <PixelCanvas />
              </div>
            </main>
            <ShortcutHint />
          </div>
          <PaletteRail />
        </div>
      </div>
    </TooltipProvider>
  );
}
