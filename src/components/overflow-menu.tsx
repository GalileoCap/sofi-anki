import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DropdownMenu } from "radix-ui";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { looks } from "@/lib/ui-looks";

const icons = { "icon-sm": 16, "icon-xs": 14 } as const;

/** A "⋮" button that opens `children`, entries made with `DropdownMenu.Item` and `looks.menuItem`. */
export function OverflowMenu({ size, children }: { size: keyof typeof icons; children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size={size} aria-label={t("deckList.moreOptions")}>
          <HugeiconsIcon icon={MoreVerticalIcon} size={icons[size]} strokeWidth={2} />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={looks.menu} align="end" sideOffset={4}>
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
