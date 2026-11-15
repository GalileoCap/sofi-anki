/** The class strings shared by things that look alike (CODE.md: a look shared is an entry here). */
export const looks = {
  /** A screen's column. */
  page: "mx-auto w-[80%] p-4 sm:p-8",
  /** The row of toggles at a screen's top. */
  toolbar: "flex justify-end mb-4",
  /** The sections of a screen, one under another. */
  sections: "flex flex-col gap-6",
  /** A form's or a dialog's parts, one under another. */
  form: "flex flex-col gap-4",
  /** A dialog's paragraph with its controls under it. */
  stack: "flex flex-col gap-3",
  /** A short list, one item under another. */
  column: "flex flex-col gap-2",
  /** Lines of a list that sit close. */
  lines: "flex flex-col gap-1",
  /** Rows of a table that sit closer still. */
  rows: "flex flex-col gap-0.5",
  /** Choices or bars that take the full width. */
  wide: "flex w-full flex-col gap-1.5",
  /** Things side by side, centred on one line. */
  row: "flex items-center gap-2",
  /** Things side by side that sit close, such as an icon and its count. */
  tightRow: "flex items-center gap-1",
  /** A label and its value side by side. */
  pair: "flex items-center gap-1.5",
  /** A label at one end of a line and a control at the other. */
  spread: "flex items-center justify-between",
  /** Buttons side by side. */
  buttons: "flex gap-2",
  /** Actions that wrap onto a second line when the screen is narrow. */
  actions: "flex flex-wrap items-center gap-2",
  /** Chips and badges that wrap. */
  chips: "flex flex-wrap items-center gap-1.5",
  /** A search box with its filters, stacked on a phone. */
  filters: "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4",
  /** A checkbox with its label. */
  check: "flex items-center gap-2 text-sm",
  /** A chart's key: small swatches with their names, side by side. */
  legend: "flex items-center gap-3 text-xs text-muted-foreground",
  /** A line of small figures. */
  smallRow: "flex items-center gap-2 text-xs",
  /** A dialog wide enough for JSON. */
  wideDialog: "max-h-[85vh] overflow-x-hidden overflow-y-auto sm:max-w-2xl",

  /** Small text that says less than what is around it. */
  muted: "text-sm text-muted-foreground",
  /** Smaller text that says less still. */
  fine: "text-xs text-muted-foreground",
  /** A side note at a line's end that keeps its width. */
  aside: "shrink-0 text-muted-foreground",
  /** A smaller side note at a line's end. */
  fineAside: "shrink-0 text-xs text-muted-foreground",
  /** A badge at a line's end that keeps its width. */
  endBadge: "shrink-0 text-xs",
  /** A label over what it names. */
  label: "text-sm font-medium",
  /** A word that stands out in a sentence. */
  strong: "font-medium text-foreground",
  /** A line's title, which takes the room left and cuts off. */
  lineTitle: "flex-1 truncate text-foreground",
  /** A figure: a count or a duration. */
  figure: "font-mono text-muted-foreground",
  /** A small figure. */
  fineFigure: "font-mono text-xs text-muted-foreground",
  /** A figure that is the point of its line. */
  value: "font-mono font-medium",
  /** Code or pasted data. */
  code: "font-mono text-xs",
  /** A message that something failed. */
  error: "text-sm text-destructive",
  /** A button that deletes. */
  danger: "text-destructive hover:text-destructive",
  /** A line that opens something when clicked. */
  clickable: "cursor-pointer hover:bg-muted/50",
  /** A screen's title. */
  title: "text-2xl font-medium text-foreground",
  /** A filter chip, and its look when chosen. */
  chip: "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
  chosen: "border-foreground/20 bg-foreground/5 text-foreground",
  /** A dropdown menu's panel. */
  menu: "z-50 min-w-36 rounded-lg border bg-popover p-1 shadow-md",
  /** An entry in a dropdown menu. */
  menuItem:
    "flex w-full cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
  /** A card's hint, in amber. */
  hint: "rounded-lg border border-caution/40 bg-caution-soft px-3 py-2 text-sm text-caution",
  /** Text that reads as good, as a warning, and as bad. */
  positive: "text-positive",
  caution: "text-caution",
  negative: "text-negative",
} as const;

/** The look of an accuracy in percent. */
export const accuracyLook = (percent: number): string =>
  percent >= 80 ? looks.positive : percent >= 50 ? looks.caution : looks.negative;

/** A filter chip's state: chosen, or quiet until hovered. */
export const chipState = (on: boolean): string => (on ? looks.chosen : "border-transparent text-muted-foreground hover:bg-muted");
