import type { Category } from "@/types/pos";
import { cn } from "@/lib/utils";
import { Utensils, Coffee, Cookie, Cake, Grid3X3 } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: Utensils,
  coffee: Coffee,
  cookie: Cookie,
  cake: Cake,
};

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <FilterChip
        active={selected === null}
        onClick={() => onSelect(null)}
        icon={<Grid3X3 className="h-3.5 w-3.5" />}
        label="Semua"
      />
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon ?? ""] ?? Grid3X3;
        return (
          <FilterChip
            key={cat.id}
            active={selected === cat.id}
            onClick={() => onSelect(cat.id)}
            icon={<Icon className="h-3.5 w-3.5" />}
            label={cat.name}
          />
        );
      })}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
