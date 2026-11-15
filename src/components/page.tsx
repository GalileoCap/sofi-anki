import type { ReactNode } from "react";

import { looks } from "@/lib/ui-looks";

/** A screen's column, its main landmark: the full width of a phone less its margins, and a reading width on a laptop. */
export function Page({ children }: { children: ReactNode }) {
  return <main className={looks.page}>{children}</main>;
}
