import type { ReactNode } from "react";

import { looks } from "@/lib/ui-looks";

type FieldProps = {
  label: string;
  /** A small control beside the label, such as a preview toggle. */
  action?: ReactNode;
  children: ReactNode;
};

/** A form's field: its label above what it names. */
export function Field({ label, action, children }: FieldProps) {
  const labelText = <label className={looks.muted}>{label}</label>;
  return (
    <div className="flex flex-col gap-1.5">
      {action ? (
        <div className={looks.spread}>
          {labelText}
          {action}
        </div>
      ) : (
        labelText
      )}
      {children}
    </div>
  );
}
