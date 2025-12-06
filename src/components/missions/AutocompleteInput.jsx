import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";

export default function AutocompleteInput({ 
  value, 
  onChange, 
  suggestions = [], 
  placeholder,
  onSelectSuggestion,
  ...props 
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  
  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (suggestion) => {
    setSearch(suggestion);
    onChange(suggestion);
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val);
    if (val && suggestions.length > 0) {
      setOpen(true);
    }
  };

  return (
    <div className="relative">
      <Input
        value={search}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        {...props}
      />
      {open && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredSuggestions.slice(0, 10).map((suggestion, idx) => (
              <div
                key={idx}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 rounded"
                onClick={() => handleSelect(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}