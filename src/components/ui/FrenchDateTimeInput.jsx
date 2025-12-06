import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";

export function FrenchDateInput({ value, onChange, label, required }) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value) {
      // Convert YYYY-MM-DD to DD/MM/YYYY
      const [year, month, day] = value.split("-");
      setDisplayValue(`${day}/${month}/${year}`);
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e) => {
    let input = e.target.value.replace(/[^0-9/]/g, "");
    
    // Auto-add slashes
    if (input.length === 2 && !input.includes("/")) {
      input += "/";
    } else if (input.length === 5 && input.split("/").length === 2) {
      input += "/";
    }
    
    // Limit length
    if (input.length > 10) {
      input = input.slice(0, 10);
    }
    
    setDisplayValue(input);
    
    // Parse and convert to YYYY-MM-DD if complete
    if (input.length === 10) {
      const parts = input.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        // Validate date
        const testDate = new Date(isoDate);
        if (!isNaN(testDate.getTime())) {
          onChange(isoDate);
        }
      }
    } else if (input === "") {
      onChange("");
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder="jj/mm/aaaa"
          required={required}
          className="pr-10"
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

export function FrenchTimeInput({ value, onChange, label, required }) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value) {
      // Convert HH:MM to HHhMM
      setDisplayValue(value.replace(":", "h"));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e) => {
    let input = e.target.value.replace(/[^0-9h]/gi, "").toLowerCase();
    
    // Auto-add 'h'
    if (input.length === 2 && !input.includes("h")) {
      input += "h";
    }
    
    // Limit length
    if (input.length > 5) {
      input = input.slice(0, 5);
    }
    
    setDisplayValue(input);
    
    // Parse and convert to HH:MM if complete
    if (input.length === 5 && input.includes("h")) {
      const [hours, minutes] = input.split("h");
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const isoTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
        onChange(isoTime);
      }
    } else if (input === "") {
      onChange("");
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder="HHhMM"
          required={required}
          className="pr-10"
        />
        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}