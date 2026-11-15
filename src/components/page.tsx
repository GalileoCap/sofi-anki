import type { ReactNode } from "react";

import { looks } from "@/lib/ui-looks";

/** A screen's column: the full width of a phone less its margins, and a reading width on a laptop. */
export function Page({ children }: { children: ReactNode }) {
  return <div className={looks.page}>{children}</div>;
}
