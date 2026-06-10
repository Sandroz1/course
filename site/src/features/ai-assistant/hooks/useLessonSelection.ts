import { useEffect, useState } from "react";

import {
  isPointerInsideAiAssistant,
  readLessonSelection,
  type SelectionPopover,
} from "../utils/selection";

type LessonSelectionClassNames = {
  selectionPopover: string;
  panel: string;
  floatingButton: string;
};

type UseLessonSelectionParams = {
  isOpen: boolean;
  classNames: LessonSelectionClassNames;
};

export function useLessonSelection({ isOpen, classNames }: UseLessonSelectionParams) {
  const [selectedText, setSelectedText] = useState("");
  const [selectionPopover, setSelectionPopover] = useState<SelectionPopover | null>(null);
  const {
    selectionPopover: selectionPopoverClassName,
    panel: panelClassName,
    floatingButton: floatingButtonClassName,
  } = classNames;

  useEffect(() => {
    let selectionTimer: number | null = null;
    let isPointerSelecting = false;

    function clearSelectionTimer() {
      if (selectionTimer !== null) {
        window.clearTimeout(selectionTimer);
        selectionTimer = null;
      }
    }

    function syncSelection() {
      if (isPointerSelecting) {
        return;
      }

      const lessonSelection = readLessonSelection();

      if (!lessonSelection) {
        setSelectionPopover(null);

        if (!isOpen) {
          setSelectedText("");
        }

        return;
      }

      setSelectedText(lessonSelection.text);
      setSelectionPopover(lessonSelection.position);
    }

    function syncSelectionAfterDelay(delay = 130) {
      clearSelectionTimer();

      selectionTimer = window.setTimeout(() => {
        syncSelection();
      }, delay);
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        !(event.target instanceof Element) ||
        isPointerInsideAiAssistant(event.target, {
          selectionPopover: selectionPopoverClassName,
          panel: panelClassName,
          floatingButton: floatingButtonClassName,
        })
      ) {
        return;
      }

      isPointerSelecting = true;
      clearSelectionTimer();
      setSelectionPopover(null);
    }

    function handlePointerUp() {
      isPointerSelecting = false;
      syncSelectionAfterDelay(130);
    }

    function handleSelectionChange() {
      if (isPointerSelecting) {
        setSelectionPopover(null);

        return;
      }

      syncSelectionAfterDelay(130);
    }

    function handleKeyboardSelection() {
      syncSelectionAfterDelay(80);
    }

    function handlePageMove() {
      if (selectionPopover) {
        syncSelectionAfterDelay(40);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("keyup", handleKeyboardSelection);
    document.addEventListener("selectionchange", handleSelectionChange);

    window.addEventListener("scroll", handlePageMove, true);
    window.addEventListener("resize", handlePageMove);

    return () => {
      clearSelectionTimer();

      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("keyup", handleKeyboardSelection);
      document.removeEventListener("selectionchange", handleSelectionChange);

      window.removeEventListener("scroll", handlePageMove, true);
      window.removeEventListener("resize", handlePageMove);
    };
  }, [
    floatingButtonClassName,
    isOpen,
    panelClassName,
    selectionPopover,
    selectionPopoverClassName,
  ]);

  return {
    selectedText,
    setSelectedText,
    selectionPopover,
    setSelectionPopover,
  };
}
