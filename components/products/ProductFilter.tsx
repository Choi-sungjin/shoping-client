"use client"

type ProductFilterProps = {
  categories: string[]
  selected: string
  onChange: (cat: string) => void
}

export function ProductFilter({ categories, selected, onChange }: ProductFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 text-xs tracking-wider uppercase border transition-colors duration-300 ${
            selected === cat
              ? "bg-foreground text-background border-foreground"
              : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
