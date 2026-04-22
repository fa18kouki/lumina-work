"use client";

interface AtmosphereTagFilterProps {
  tags: readonly string[];
  selectedTags: readonly string[];
  onToggleTag: (tag: string) => void;
}

export function AtmosphereTagFilter({
  tags,
  selectedTags,
  onToggleTag,
}: AtmosphereTagFilterProps) {
  if (tags.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {tags.map((tag) => {
        const selected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleTag(tag)}
            aria-pressed={selected}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selected
                ? "bg-(--primary) text-white"
                : "bg-(--primary-bg) text-(--primary) hover:bg-(--primary-bg)/80"
            }`}
          >
            #{tag}
          </button>
        );
      })}
    </div>
  );
}
