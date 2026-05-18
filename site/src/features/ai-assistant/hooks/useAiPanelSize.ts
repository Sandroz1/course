import {
    type PointerEvent as ReactPointerEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    clamp,
    clampPanelSize,
    getPanelBounds,
    readStoredPanelSize,
    writeStoredPanelSize,
} from "../panelSize";

type ResizeDirection = "left" | "top" | "corner";

export function useAiPanelSize() {
    const [panelSize, setPanelSize] = useState(() =>
        clampPanelSize(readStoredPanelSize())
    );
    const resizeSessionRef = useRef<{
        direction: ResizeDirection;
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
    } | null>(null);
    const panelSizeDuringResizeRef = useRef(panelSize);

    useEffect(() => {
        panelSizeDuringResizeRef.current = panelSize;
    }, [panelSize]);

    useEffect(() => {
        function handleWindowResize() {
            setPanelSize((prev) => clampPanelSize(prev));
        }

        handleWindowResize();
        window.addEventListener("resize", handleWindowResize);

        return () => window.removeEventListener("resize", handleWindowResize);
    }, []);

    function startResize(
        event: ReactPointerEvent<HTMLSpanElement>,
        direction: ResizeDirection
    ) {
        event.preventDefault();
        event.stopPropagation();

        const size = panelSizeDuringResizeRef.current;

        resizeSessionRef.current = {
            direction,
            startX: event.clientX,
            startY: event.clientY,
            startWidth: size.width,
            startHeight: size.height,
        };

        function onPointerMove(moveEvent: PointerEvent) {
            const session = resizeSessionRef.current;

            if (!session) {
                return;
            }

            const { minWidth, maxWidth, minHeight, maxHeight } = getPanelBounds();
            let nextW = session.startWidth;
            let nextH = session.startHeight;

            if (session.direction === "left" || session.direction === "corner") {
                nextW = session.startWidth + (session.startX - moveEvent.clientX);
            }

            if (session.direction === "top" || session.direction === "corner") {
                nextH = session.startHeight + (session.startY - moveEvent.clientY);
            }

            const clamped = {
                width: clamp(nextW, minWidth, maxWidth),
                height: clamp(nextH, minHeight, maxHeight),
            };

            panelSizeDuringResizeRef.current = clamped;
            setPanelSize(clamped);
        }

        function onPointerUp() {
            resizeSessionRef.current = null;
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);

            writeStoredPanelSize(panelSizeDuringResizeRef.current);
        }

        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
    }

    return { panelSize, startResize };
}
