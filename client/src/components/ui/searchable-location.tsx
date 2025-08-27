import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useReferenceData } from "@/hooks/useReferencedData";
import type { Location } from "@/types";

interface SearchableLocationProps {
  value?: number;
  onValueChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableLocation({
  value,
  onValueChange,
  placeholder = "Select location...",
  disabled = false,
  className,
}: SearchableLocationProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { locations, isLoadingLocations } = useReferenceData();
  const commandRef = useRef<HTMLDivElement>(null);

  // Get default/top locations (first 5-6 most common ones)
  const getDefaultLocations = (): Location[] => {
    return locations.slice(0, 6);
  };

  // Filter locations based on search
  const getFilteredLocations = (): Location[] => {
    if (!search.trim()) {
      return getDefaultLocations();
    }
    
    return locations.filter((location) =>
      location.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  const selectedLocation = locations.find((location) => location.id === value);
  const filteredLocations = getFilteredLocations();

  // Reset search when opening
  useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            {selectedLocation ? selectedLocation.name : placeholder}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command ref={commandRef}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search locations..."
              value={search}
              onValueChange={setSearch}
              className="border-0 focus:ring-0"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filteredLocations.length > 0 ? (
              <CommandGroup>
                {!search.trim() && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Popular locations
                  </div>
                )}
                {filteredLocations.map((location) => (
                  <CommandItem
                    key={location.id}
                    value={location.name}
                    onSelect={() => {
                      onValueChange(location.id);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{location.name}</span>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === location.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No results found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your search or select from the default options
                  </p>
                </div>
              </CommandEmpty>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}