/** The class strings shared by things that look alike (CODE.md: a look shared is an entry here). */
export const looks = {
  /** A screen's column. */
  page: "mx-auto w-[80%] p-4 sm:p-8",
  /** The row of toggles at a screen's top. */
  toolbar: "flex justify-end mb-4",
  /** Small text that says less than what is around it. */
  muted: "text-sm text-muted-foreground",
  /** A screen's title. */
  title: "text-2xl font-medium text-foreground",
  /** A dropdown menu's panel. */
  menu: "z-50 min-w-36 rounded-lg border bg-popover p-1 shadow-md",
  /** An entry in a dropdown menu. */
  menuItem:
    "flex w-full cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
} as const;
