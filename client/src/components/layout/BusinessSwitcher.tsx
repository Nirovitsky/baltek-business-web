import { useState } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";

export default function BusinessSwitcher() {
  const [open, setOpen] = useState(false);
  const { selectedOrganization, organizations, switchOrganization } = useAuth();

  // Always show the switcher, but show current organization if only one
  if (organizations.length === 0) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        <div className="flex items-center">
          <Building2 className="mr-2 h-4 w-4" />
          <span className="truncate">Loading businesses...</span>
        </div>
      </Button>
    );
  }

  if (organizations.length === 1) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        <div className="flex items-center">
          <Building2 className="mr-2 h-4 w-4" />
          <span className="truncate">{organizations[0].display_name || organizations[0].official_name}</span>
        </div>
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center">
            <div className="w-5 h-5 mr-2 overflow-hidden rounded-sm flex-shrink-0">
              {selectedOrganization?.logo ? (
                <img 
                  src={selectedOrganization.logo} 
                  alt={selectedOrganization.official_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
            </div>
            <span className="truncate">
              {selectedOrganization?.display_name || selectedOrganization?.official_name || "Select business..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search businesses..." />
          <CommandEmpty>No business found.</CommandEmpty>
          <CommandGroup>
            {organizations.map((org) => (
              <CommandItem
                key={org.id}
                value={org.official_name}
                onSelect={() => {
                  switchOrganization(org);
                  setOpen(false);
                }}
              >
                <div className="flex items-center">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedOrganization?.id === org.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="w-6 h-6 mr-2 overflow-hidden rounded-sm flex-shrink-0">
                    {org.logo ? (
                      <img 
                        src={org.logo} 
                        alt={org.official_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-3 w-3 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{org.display_name || org.official_name}</span>
                    {org.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {org.description}
                      </span>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}