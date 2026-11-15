import type { ReactNode } from "react";

/** A field's label over its control. */
const fieldLook = "flex flex-col gap-1.5 text-sm font-bold";

/** A form's field: its bold label over the control it names. A group of buttons takes the label as its name instead. */
export function Field({ label, group, children }: { label: string; group?: boolean; children: ReactNode }) {
  if (group) {
    return (
      <div role="group" aria-label={label} className={fieldLook}>
        <span aria-hidden="true">{label}</span>
        {children}
      </div>
    );
  }
  return (
    <label className={fieldLook}>
      {label}
      {children}
    </label>
  );
}
