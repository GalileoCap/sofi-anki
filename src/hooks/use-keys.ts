import { useEffect } from "react";

const typing = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** `onKey` for each key pressed anywhere on the page, except while typing in a field. */
export function useKeys(onKey: (event: KeyboardEvent) => void) {
  useEffect(() => {
    function listen(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && typing.has(event.target.tagName)) return;
      onKey(event);
    }
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  });
}
