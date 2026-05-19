const MIN_PANEL_WIDTH = 340;
const MAX_PANEL_WIDTH = 760;
const MIN_PANEL_HEIGHT = 420;
const MAX_PANEL_HEIGHT_CAP = 820;
const STORAGE_KEY_PANEL_SIZE = "aiPanelSize";

export type PanelSize = {
    width: number;
    height: number;
};

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function readStoredPanelSize(): PanelSize {
    const fallback = { width: 430, height: 620 };
    let saved: string | null;

    try {
        saved = localStorage.getItem(STORAGE_KEY_PANEL_SIZE);
    } catch {
        return fallback;
    }

    if (!saved) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(saved) as { width?: unknown; height?: unknown };

        if (
            typeof parsed.width !== "number" ||
            typeof parsed.height !== "number" ||
            !Number.isFinite(parsed.width) ||
            !Number.isFinite(parsed.height)
        ) {
            return fallback;
        }

        return { width: parsed.width, height: parsed.height };
    } catch {
        return fallback;
    }
}

export function writeStoredPanelSize(size: PanelSize) {
    try {
        localStorage.setItem(STORAGE_KEY_PANEL_SIZE, JSON.stringify(size));
    } catch {
        // Resizing should not fail when storage is unavailable.
    }
}

export function getPanelBounds() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxWidth = Math.min(MAX_PANEL_WIDTH, vw - 32);
    const maxHeight = Math.min(MAX_PANEL_HEIGHT_CAP, Math.max(MIN_PANEL_HEIGHT, vh - 112));
    const minWidth = Math.min(MIN_PANEL_WIDTH, maxWidth);
    const minHeight = Math.min(MIN_PANEL_HEIGHT, maxHeight);

    return { minWidth, maxWidth, minHeight, maxHeight };
}

export function clampPanelSize(size: PanelSize) {
    const { minWidth, maxWidth, minHeight, maxHeight } = getPanelBounds();

    return {
        width: clamp(size.width, minWidth, maxWidth),
        height: clamp(size.height, minHeight, maxHeight),
    };
}

export function isNearBottom(element: HTMLDivElement) {
    const distanceFromBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight;

    return distanceFromBottom < 80;
}
