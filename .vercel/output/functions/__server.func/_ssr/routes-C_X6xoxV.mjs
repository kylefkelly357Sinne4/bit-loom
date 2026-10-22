import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Pipette, c as Grid3x3, i as Redo2, l as Eraser, o as Pencil, r as Trash2, s as PaintBucket, t as Undo2, u as Download } from "../_libs/lucide-react.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { i as Slot } from "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { a as Trigger, i as Root3, n as Portal, r as Provider, t as Content2 } from "../_libs/@radix-ui/react-tooltip+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C_X6xoxV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** PICO-8 16 — limited retro drawing palette, not UI chrome. */
var PALETTE = [
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
	"#FFCCAA"
];
var GRID_SIZES = [
	8,
	16,
	24,
	32,
	48,
	64
];
var DEFAULT_COLOR = PALETTE[8];
function cellIndex(x, y, size) {
	return y * size + x;
}
function emptyPixels(size) {
	return Array.from({ length: size * size }, () => null);
}
function clonePixels(pixels) {
	return pixels.slice();
}
function pixelsEqual(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
}
function remapSize(pixels, from, to) {
	const next = emptyPixels(to);
	const copy = Math.min(from, to);
	for (let y = 0; y < copy; y++) for (let x = 0; x < copy; x++) next[cellIndex(x, y, to)] = pixels[cellIndex(x, y, from)] ?? null;
	return next;
}
/** Inclusive line of cells between two points so fast strokes never skip. */
function bresenham(x0, y0, x1, y1) {
	const points = [];
	const dx = Math.abs(x1 - x0);
	const dy = Math.abs(y1 - y0);
	const sx = x0 < x1 ? 1 : -1;
	const sy = y0 < y1 ? 1 : -1;
	let err = dx - dy;
	let x = x0;
	let y = y0;
	for (;;) {
		points.push([x, y]);
		if (x === x1 && y === y1) break;
		const e2 = 2 * err;
		if (e2 > -dy) {
			err -= dy;
			x += sx;
		}
		if (e2 < dx) {
			err += dx;
			y += sy;
		}
	}
	return points;
}
function floodFill(pixels, size, x, y, color) {
	if (x < 0 || y < 0 || x >= size || y >= size) return pixels;
	const start = pixels[cellIndex(x, y, size)] ?? null;
	if (start === color) return pixels;
	const next = clonePixels(pixels);
	const stack = [cellIndex(x, y, size)];
	while (stack.length) {
		const i = stack.pop();
		if (next[i] !== start) continue;
		next[i] = color;
		const cx = i % size;
		const cy = i / size | 0;
		if (cx > 0) stack.push(i - 1);
		if (cx < size - 1) stack.push(i + 1);
		if (cy > 0) stack.push(i - size);
		if (cy < size - 1) stack.push(i + size);
	}
	return next;
}
function downloadPng(pixels, size) {
	const scale = Math.max(8, Math.round(512 / size));
	const canvas = document.createElement("canvas");
	canvas.width = size * scale;
	canvas.height = size * scale;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
		const color = pixels[cellIndex(x, y, size)];
		if (!color) continue;
		ctx.fillStyle = color;
		ctx.fillRect(x * scale, y * scale, scale, scale);
	}
	const name = `bitloom-${size}x${size}.png`;
	canvas.toBlob((blob) => {
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = name;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}, "image/png");
}
var MAX_HISTORY = 50;
function pushHistory(past, snapshot) {
	const next = [...past, snapshot];
	if (next.length > MAX_HISTORY) next.shift();
	return next;
}
var usePixelStore = create()(persist((set, get) => ({
	size: 16,
	pixels: emptyPixels(16),
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
			tool: tool === "eraser" || tool === "eyedropper" ? "pencil" : tool
		});
	},
	toggleGrid: () => set({ showGrid: !get().showGrid }),
	setSize: (size) => {
		const state = get();
		if (size === state.size) return;
		set({
			size,
			pixels: remapSize(state.pixels, state.size, size),
			past: pushHistory(state.past, clonePixels(state.pixels)),
			future: [],
			strokeBase: null
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
			future: []
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
		set({
			color: sampled,
			tool: "pencil"
		});
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
				strokeBase: null
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
			future: []
		});
	},
	undo: () => {
		const { past, pixels, future } = get();
		if (past.length === 0) return;
		const prev = past[past.length - 1];
		set({
			past: past.slice(0, -1),
			pixels: clonePixels(prev),
			future: [clonePixels(pixels), ...future],
			strokeBase: null
		});
	},
	redo: () => {
		const { past, pixels, future } = get();
		if (future.length === 0) return;
		const next = future[0];
		set({
			past: pushHistory(past, clonePixels(pixels)),
			pixels: clonePixels(next),
			future: future.slice(1),
			strokeBase: null
		});
	}
}), {
	name: "bitloom-canvas",
	skipHydration: true,
	partialize: (state) => ({
		size: state.size,
		pixels: state.pixels,
		color: state.color,
		tool: state.tool,
		showGrid: state.showGrid
	}),
	merge: (persisted, current) => {
		const p = persisted ?? {};
		const size = p.size ?? current.size;
		const pixels = Array.isArray(p.pixels) && p.pixels.length === size * size ? p.pixels : emptyPixels(size);
		return {
			...current,
			...p,
			size,
			pixels,
			past: [],
			future: [],
			strokeBase: null
		};
	}
}));
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:opacity-90", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
			outline: "bg-transparent shadow-panel hover:bg-secondary",
			secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
			ghost: "hover:bg-secondary hover:text-foreground",
			pressed: "bg-primary text-primary-foreground"
		},
		size: {
			default: "h-10 px-3.5",
			sm: "h-9 rounded-md px-3",
			lg: "h-11 px-5",
			icon: "size-11",
			chip: "h-9 px-2.5 text-xs tabular-nums"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var TooltipProvider = Provider;
var Tooltip = Root3;
var TooltipTrigger = Trigger;
var TooltipContent = import_react.forwardRef(({ className, sideOffset = 6, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 origin-[--radix-tooltip-content-transform-origin] rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-panel data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0", className),
	...props
}) }));
TooltipContent.displayName = Content2.displayName;
function ToolTipButton({ label, shortcut, pressed, disabled, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			size: "icon",
			variant: pressed ? "pressed" : "ghost",
			"aria-label": label,
			"aria-pressed": pressed,
			disabled,
			onClick,
			children
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipContent, { children: [label, shortcut ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "text-muted-foreground",
		children: [" ", shortcut]
	}) : null] })] });
}
function Mark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "grid size-6 grid-cols-3 gap-px",
		"aria-hidden": "true",
		children: [
			1,
			0,
			1,
			0,
			1,
			0,
			1,
			0,
			1
		].map((on, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: on ? "bg-primary" : "bg-transparent" }, i))
	});
}
function StudioHeader() {
	const size = usePixelStore((s) => s.size);
	const canUndo = usePixelStore((s) => s.past.length > 0);
	const canRedo = usePixelStore((s) => s.future.length > 0);
	const undo = usePixelStore((s) => s.undo);
	const redo = usePixelStore((s) => s.redo);
	const clear = usePixelStore((s) => s.clear);
	const setSize = usePixelStore((s) => s.setSize);
	const pixels = usePixelStore((s) => s.pixels);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex shrink-0 flex-col gap-2 border-b border-border px-3 py-2 md:flex-row md:items-center md:gap-3 md:px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "truncate text-sm font-semibold tracking-tight text-foreground",
							children: "Bitloom"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "hidden text-xs text-muted-foreground sm:block",
							children: "Pixel studio"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex items-center gap-1 md:hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolTipButton, {
							label: "Undo",
							shortcut: "⌘Z",
							disabled: !canUndo,
							onClick: undo,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolTipButton, {
							label: "Redo",
							shortcut: "⇧⌘Z",
							disabled: !canRedo,
							onClick: redo,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo2, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "icon",
							onClick: () => downloadPng(pixels, size),
							"aria-label": "Export PNG",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-center gap-1 md:flex-1",
				children: GRID_SIZES.map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					size: "chip",
					variant: size === value ? "pressed" : "ghost",
					"aria-pressed": size === value,
					onClick: () => setSize(value),
					className: "min-w-9 font-mono",
					children: value
				}, value))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hidden items-center gap-1 md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolTipButton, {
						label: "Undo",
						shortcut: "⌘Z",
						disabled: !canUndo,
						onClick: undo,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolTipButton, {
						label: "Redo",
						shortcut: "⇧⌘Z",
						disabled: !canRedo,
						onClick: redo,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo2, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolTipButton, {
						label: "Clear canvas",
						onClick: clear,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						onClick: () => downloadPng(pixels, size),
						className: "ml-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Export PNG" })]
					})
				]
			})
		]
	});
}
var TOOLS = [
	{
		id: "pencil",
		label: "Pencil",
		shortcut: "P",
		icon: Pencil
	},
	{
		id: "eraser",
		label: "Eraser",
		shortcut: "E",
		icon: Eraser
	},
	{
		id: "fill",
		label: "Fill",
		shortcut: "F",
		icon: PaintBucket
	},
	{
		id: "eyedropper",
		label: "Eyedropper",
		shortcut: "I",
		icon: Pipette
	}
];
function ToolRail() {
	const tool = usePixelStore((s) => s.tool);
	const setTool = usePixelStore((s) => s.setTool);
	const showGrid = usePixelStore((s) => s.showGrid);
	const toggleGrid = usePixelStore((s) => s.toggleGrid);
	const clear = usePixelStore((s) => s.clear);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-2 md:py-3",
		children: [
			TOOLS.map(({ id, label, shortcut, icon: Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolTipButton, {
				label,
				shortcut,
				pressed: tool === id,
				onClick: () => setTool(id),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {})
			}, id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-1 hidden h-px w-7 bg-border md:block" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-7 w-px bg-border md:hidden" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolTipButton, {
				label: "Toggle grid",
				shortcut: "G",
				pressed: showGrid,
				onClick: toggleGrid,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Grid3x3, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolTipButton, {
					label: "Clear canvas",
					onClick: clear,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {})
				})
			})
		]
	});
}
function PaletteRail() {
	const color = usePixelStore((s) => s.color);
	const setColor = usePixelStore((s) => s.setColor);
	const tool = usePixelStore((s) => s.tool);
	const setTool = usePixelStore((s) => s.setTool);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "shrink-0 border-t border-border px-3 py-3 md:w-52 md:border-t-0 md:border-l",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("size-11 shrink-0 rounded-md shadow-panel", tool === "eraser" && "bg-checkboard"),
					style: tool === "eraser" ? void 0 : { backgroundColor: color },
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium text-muted-foreground",
						children: "Paint"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate font-mono text-sm tabular-nums text-foreground",
						children: tool === "eraser" ? "Erase" : color
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-8 gap-1.5 md:grid-cols-4",
				children: PALETTE.map((hex) => {
					const active = tool !== "eraser" && color.toLowerCase() === hex.toLowerCase();
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": hex,
						"aria-pressed": active,
						onClick: () => setColor(hex),
						className: cn("relative size-9 rounded-sm shadow-panel transition-transform duration-150 ease-out hover:z-10 hover:scale-105 md:size-10", active && "z-10 ring-2 ring-ring ring-offset-2 ring-offset-background"),
						style: { backgroundColor: hex }
					}, hex);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setTool("eraser"),
				"aria-pressed": tool === "eraser",
				className: cn("mt-2 flex h-10 w-full items-center justify-center rounded-md text-xs font-medium text-muted-foreground shadow-panel transition-colors duration-150 hover:bg-secondary hover:text-foreground", tool === "eraser" && "bg-secondary text-foreground"),
				children: "Transparent"
			})
		]
	});
}
function ShortcutHint() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "hidden px-4 py-2 text-center text-xs text-muted-foreground md:block",
		children: "P pencil · E eraser · F fill · I eyedropper · G grid · Alt-click sample · ⌘Z undo"
	});
}
function readCssVar(name, fallback) {
	if (typeof document === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function paintCanvas(ctx, pixels, size, cell, dpr, showGrid) {
	const css = size * cell;
	const checkA = readCssVar("--color-check-a", "#121214");
	const checkB = readCssVar("--color-check-b", "#1a1a1e");
	const grid = readCssVar("--color-grid-line", "rgba(255,255,255,0.12)");
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.clearRect(0, 0, css, css);
	for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
		ctx.fillStyle = pixels[y * size + x] ?? ((x + y) % 2 === 0 ? checkA : checkB);
		ctx.fillRect(x * cell, y * cell, cell, cell);
	}
	if (showGrid && cell >= 4) {
		ctx.strokeStyle = grid;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i = 0; i <= size; i++) {
			const p = i * cell + .5;
			ctx.moveTo(p, 0);
			ctx.lineTo(p, css);
			ctx.moveTo(0, p);
			ctx.lineTo(css, p);
		}
		ctx.stroke();
	}
}
function eventToCell(event, canvas, size) {
	const rect = canvas.getBoundingClientRect();
	const x = Math.floor((event.clientX - rect.left) / rect.width * size);
	const y = Math.floor((event.clientY - rect.top) / rect.height * size);
	return {
		x: Math.min(size - 1, Math.max(0, x)),
		y: Math.min(size - 1, Math.max(0, y))
	};
}
function PixelCanvas() {
	const wrapRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const drawing = (0, import_react.useRef)(false);
	const last = (0, import_react.useRef)(null);
	const [cell, setCell] = (0, import_react.useState)(16);
	const [hover, setHover] = (0, import_react.useState)(null);
	const size = usePixelStore((s) => s.size);
	const pixels = usePixelStore((s) => s.pixels);
	const showGrid = usePixelStore((s) => s.showGrid);
	const tool = usePixelStore((s) => s.tool);
	const isEmpty = pixels.every((p) => p == null);
	(0, import_react.useEffect)(() => {
		const el = wrapRef.current;
		if (!el) return;
		const measure = () => {
			const { width, height } = el.getBoundingClientRect();
			const max = Math.max(0, Math.min(width, height) - 8);
			setCell(Math.max(4, Math.floor(max / size)));
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, [size]);
	const redraw = (0, import_react.useCallback)(() => {
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
		paintCanvas(ctx, usePixelStore.getState().pixels, size, cell, dpr, usePixelStore.getState().showGrid);
	}, [cell, size]);
	(0, import_react.useEffect)(() => {
		redraw();
	}, [
		redraw,
		pixels,
		showGrid
	]);
	const paintFrom = (from, to) => {
		const { tool: currentTool, color, paintCells } = usePixelStore.getState();
		const value = currentTool === "eraser" ? null : color;
		paintCells(from ? bresenham(from.x, from.y, to.x, to.y) : [[to.x, to.y]], value);
		last.current = to;
	};
	const onPointerDown = (event) => {
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
	const onPointerMove = (event) => {
		const canvas = event.currentTarget;
		const point = eventToCell(event.nativeEvent, canvas, size);
		setHover(point);
		if (!drawing.current) return;
		paintFrom(last.current, point);
	};
	const endStroke = (event) => {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
		if (!drawing.current) return;
		drawing.current = false;
		last.current = null;
		usePixelStore.getState().endStroke();
	};
	const cursor = tool === "eraser" ? "cell" : tool === "fill" ? "pointer" : tool === "eyedropper" ? "copy" : "crosshair";
	const cssSize = size * cell;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapRef,
		className: "relative flex h-full min-h-0 w-full min-w-0 flex-1 items-center justify-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative shadow-panel",
			style: {
				width: cssSize,
				height: cssSize
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "block touch-none select-none",
				style: {
					width: cssSize,
					height: cssSize,
					cursor
				},
				onPointerDown,
				onPointerMove,
				onPointerUp: endStroke,
				onPointerCancel: endStroke,
				onPointerLeave: () => setHover(null),
				onContextMenu: (event) => event.preventDefault(),
				"aria-label": "Pixel canvas"
			}), isEmpty && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 flex items-center justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-md bg-background/70 px-3 py-1.5 text-sm text-muted-foreground",
					children: "Click and drag to draw"
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("pointer-events-none absolute bottom-3 left-3 font-mono text-xs tabular-nums text-muted-foreground"),
			children: hover ? `${hover.x}, ${hover.y}` : `${size} × ${size}`
		})]
	});
}
var TOOL_KEYS = {
	p: "pencil",
	b: "pencil",
	e: "eraser",
	f: "fill",
	i: "eyedropper"
};
function PixelStudio() {
	(0, import_react.useEffect)(() => {
		usePixelStore.persist.rehydrate();
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			const target = event.target;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
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
				if (size) store.setSize(size);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, {
		delayDuration: 400,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-0 flex-1 flex-col md:flex-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolRail, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-h-0 min-w-0 flex-1 flex-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
							className: "flex min-h-0 flex-1 p-3 md:p-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-full min-h-0 w-full min-w-0 flex-1 rounded-xl bg-card p-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PixelCanvas, {})
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShortcutHint, {})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaletteRail, {})
				]
			})]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PixelStudio, {});
}
//#endregion
export { Home as component };
