/** The class strings shared by things that look alike (CODE.md: a look shared is an entry here). */
export const looks = {
  /** A screen's column. */
  page: "mx-auto w-full max-w-6xl px-4 py-4 sm:px-10 sm:py-6",
  /** A form's or a dialog's parts, one under another. */
  form: "flex flex-col gap-4",
  /** A dialog's paragraph with its controls under it. */
  stack: "flex flex-col gap-3",
  /** A bar or a field with its line of words, close together. */
  tight: "flex flex-col gap-1.5",
  /** A short list, one item under another. */
  column: "flex flex-col gap-2",
  /** Choices or bars that take the full width. */
  wide: "flex w-full flex-col gap-1.5",
  /** Things side by side, centred on one line. */
  row: "flex items-center gap-2",
  /** A label at one end of a line and a control at the other. */
  spread: "flex items-center justify-between",
  /** Buttons side by side. */
  buttons: "flex gap-2",
  /** Chips and badges that wrap. */
  chips: "flex flex-wrap items-center gap-1.5",
  /** A search box with its filters, stacked on a phone. */
  filters: "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4",
  /** A checkbox, in ink when ticked. */
  checkbox: "size-5 shrink-0 accent-primary",
  /** A checkbox with its label. */
  check: "flex items-center gap-2 text-sm",
  /** A dialog wide enough for JSON. */
  wideDialog: "max-h-[85vh] overflow-x-hidden overflow-y-auto sm:max-w-2xl",

  /** A screen read in one column, such as the run's end, narrower than the page. */
  narrow: "mx-auto flex max-w-xl flex-col gap-4",
  /** The bar at a screen's top: a way back or out, where the screen is, and its menu. */
  topbar: "flex min-h-11 items-center justify-between gap-2 text-sm text-muted-foreground",
  /** A section's title under a screen's title. */
  sectionTitle: "mb-1 text-lg font-bold",
  /** A list of lines split by rules. */
  list: "flex flex-col text-sm",
  /** One line of such a list. */
  listRow: "flex items-center justify-between gap-3 border-b-[1.5px] border-border py-3 last:border-b-0",
  /** Solid ink, for what asks to be done now. */
  ink: "bg-primary text-primary-foreground",
  /** Shown on a laptop alone. */
  laptopOnly: "hidden lg:block",
  /** A sentence that says something went well. */
  good: "text-sm font-bold text-positive",
  /** Small text that says less than what is around it. */
  muted: "text-sm text-muted-foreground",
  /** Smaller text that says less still. */
  fine: "text-xs text-muted-foreground",
  /** A smaller side note at a line's end. */
  fineAside: "shrink-0 text-xs text-muted-foreground",
  /** A label over what it names. */
  label: "text-sm font-medium",
  /** A word that stands out in a sentence. */
  strong: "font-medium text-foreground",
  /** A figure: a count or a duration. */
  figure: "tabular-nums text-muted-foreground",
  /** A small figure. */
  fineFigure: "tabular-nums text-xs text-muted-foreground",
  /** A figure that is the point of its line. */
  value: "tabular-nums font-bold",
  /** Code or pasted data. */
  code: "font-mono text-xs",
  /** A message that something failed. */
  error: "text-sm text-destructive",
  /** A screen's title. */
  title: "text-2xl font-extrabold leading-tight text-foreground",
  /** A dropdown menu's panel. */
  menu: "z-50 min-w-56 rounded-md bg-popover p-1.5 text-sm shadow-md",
  /** A rule between groups of a menu's entries. */
  menuRule: "mx-1.5 my-1 h-0.5 bg-border",
  /** An entry in a dropdown menu. */
  menuItem:
    "flex min-h-11 w-full cursor-pointer select-none items-center gap-2 rounded-sm px-3 text-sm outline-none transition-colors data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
  /** A menu entry that deletes. */
  menuDanger: "text-destructive",
} as const;
