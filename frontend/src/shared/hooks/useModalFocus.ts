import { useEffect, useRef, type RefObject } from "react";
let openModals = 0;
let originalOverflow = "";
let originalInert = false;
let originalPadding = "";
let originalGutter = "";
export function useModalFocus(
  ref: RefObject<HTMLDivElement | null>,
  close: () => void,
) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = document.getElementById("root");
    if (openModals++ === 0) {
      originalOverflow = document.body.style.overflow;
      originalPadding = document.body.style.paddingRight;
      originalGutter = document.documentElement.style.scrollbarGutter;
      const gutter = window.innerWidth - document.documentElement.clientWidth;
      if (gutter > 0)
        document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + gutter}px`;
      document.documentElement.style.scrollbarGutter = "auto";
      originalInert = root?.inert || false;
      document.body.style.overflow = "hidden";
      if (root) root.inert = true;
    }
    const focusable = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
        ) || [],
      ).filter((element) => element.getClientRects().length > 0);
    (focusable()[0] || ref.current)?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) {
        event.preventDefault();
        ref.current?.focus();
        return;
      }
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !ref.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      if (--openModals === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPadding;
        document.documentElement.style.scrollbarGutter = originalGutter;
        if (root) root.inert = originalInert;
      }
      if (previous?.isConnected) previous.focus();
    };
  }, [ref]);
}
