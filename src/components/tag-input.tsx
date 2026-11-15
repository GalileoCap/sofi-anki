import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

/** Tags typed one at a time, each ended by Enter or a comma, each shown as a chip that removes it. */
export function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const { t } = useLanguage();
  const [input, setInput] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
      setInput("");
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.includes(",")) {
      const parts = val.split(",");
      for (const part of parts.slice(0, -1)) {
        addTag(part);
      }
      setInput(parts[parts.length - 1]);
    } else {
      setInput(val);
    }
  }

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border-2 border-input bg-card px-3 py-1.5 text-base font-normal focus-within:border-primary">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => removeTag(tag)}
          aria-label={t("deckForm.removeTag").replace("{tag}", tag)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          {tag} <span aria-hidden="true">×</span>
        </button>
      ))}
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) {
            addTag(input);
            setInput("");
          }
        }}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="min-w-20 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
