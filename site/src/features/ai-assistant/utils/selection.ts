import { clamp } from "../panelSize";

const SELECTION_POPOVER_WIDTH = 132;
const SELECTION_POPOVER_HEIGHT = 34;
const SELECTION_POPOVER_GAP = 10;
const SELECTION_POPOVER_MARGIN = 12;

export type SelectionPopover = {
    x: number;
    y: number;
    placement: "above" | "below";
};

type AssistantClassNames = {
    selectionPopover: string;
    panel: string;
    floatingButton: string;
};

function getElementFromNode(node: Node | null) {
    if (!node) {
        return null;
    }

    return node.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : node.parentElement;
}

function isInsideLessonContent(node: Node | null) {
    const element = getElementFromNode(node);

    return Boolean(element?.closest(".lesson-content"));
}

function getClosestCodeBlock(node: Node | null) {
    return getElementFromNode(node)?.closest("pre, .shiki") ?? null;
}

function isInputSelection() {
    const activeElement = document.activeElement;
    const tagName = activeElement?.tagName?.toLowerCase();

    return tagName === "textarea" || tagName === "input";
}

function getSelectionPopoverPosition(selectionRect: DOMRect, anchorRect: DOMRect) {
    const maxLeft = Math.max(
        SELECTION_POPOVER_MARGIN,
        window.innerWidth - SELECTION_POPOVER_WIDTH - SELECTION_POPOVER_MARGIN
    );
    const maxTop = Math.max(
        SELECTION_POPOVER_MARGIN,
        window.innerHeight - SELECTION_POPOVER_HEIGHT - SELECTION_POPOVER_MARGIN
    );
    const selectionCenter = selectionRect.left + selectionRect.width / 2;
    const spaceAbove = anchorRect.top - SELECTION_POPOVER_MARGIN;
    const spaceBelow = window.innerHeight - anchorRect.bottom - SELECTION_POPOVER_MARGIN;
    const shouldPlaceBelow =
        spaceAbove < SELECTION_POPOVER_HEIGHT + SELECTION_POPOVER_GAP &&
        spaceBelow >= spaceAbove;
    const rawTop = shouldPlaceBelow
        ? anchorRect.bottom + SELECTION_POPOVER_GAP
        : anchorRect.top - SELECTION_POPOVER_HEIGHT - SELECTION_POPOVER_GAP;

    return {
        x: clamp(
            selectionCenter - SELECTION_POPOVER_WIDTH / 2,
            SELECTION_POPOVER_MARGIN,
            maxLeft
        ),
        y: clamp(rawTop, SELECTION_POPOVER_MARGIN, maxTop),
        placement: shouldPlaceBelow ? "below" as const : "above" as const,
    };
}

export function isPointerInsideAiAssistant(
    target: EventTarget | null,
    classNames: AssistantClassNames
) {
    if (!(target instanceof Element)) {
        return false;
    }

    return Boolean(
        target.closest(`.${classNames.selectionPopover}`) ||
            target.closest(`.${classNames.panel}`) ||
            target.closest(`.${classNames.floatingButton}`)
    );
}

export function readLessonSelection() {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return null;
    }

    if (isInputSelection()) {
        return null;
    }

    const text = selection.toString().trim();

    if (text.length < 3) {
        return null;
    }

    const anchorInsideLesson = isInsideLessonContent(selection.anchorNode);
    const focusInsideLesson = isInsideLessonContent(selection.focusNode);

    if (!anchorInsideLesson || !focusInsideLesson) {
        return null;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const firstRect = range.getClientRects()[0];

    const finalRect = rect.width > 0 && rect.height > 0 ? rect : firstRect;

    if (!finalRect) {
        return null;
    }

    const isSelectionOutsideViewport =
        finalRect.bottom < SELECTION_POPOVER_MARGIN ||
        finalRect.top > window.innerHeight - SELECTION_POPOVER_MARGIN ||
        finalRect.right < SELECTION_POPOVER_MARGIN ||
        finalRect.left > window.innerWidth - SELECTION_POPOVER_MARGIN;

    if (isSelectionOutsideViewport) {
        return null;
    }

    const anchorCodeBlock = getClosestCodeBlock(selection.anchorNode);
    const focusCodeBlock = getClosestCodeBlock(selection.focusNode);
    const anchorRect =
        anchorCodeBlock && anchorCodeBlock === focusCodeBlock
            ? anchorCodeBlock.getBoundingClientRect()
            : finalRect;

    return {
        text: text.slice(0, 5000),
        position: getSelectionPopoverPosition(finalRect, anchorRect),
    };
}
