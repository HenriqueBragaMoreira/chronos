import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryCombobox({ value, onChange }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    invoke<string[]>("get_categories")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const filtered = categories.filter((cat) =>
    cat.toLowerCase().includes(search.toLowerCase())
  );

  const showCreateOption = search.trim() && !filtered.includes(search.trim());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <button className="flex h-9 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm text-left ring-offset-background hover:bg-muted">
          {value || "Selecione ou crie uma categoria..."}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar ou criar categoria..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup>
              {filtered.map((cat) => (
                <CommandItem
                  key={cat}
                  value={cat}
                  onSelect={() => {
                    onChange(cat);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {cat}
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem
                  value={search.trim()}
                  onSelect={() => {
                    onChange(search.trim());
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  Criar "{search.trim()}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
