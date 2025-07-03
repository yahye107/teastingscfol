// SearchSelectField.jsx
import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { Command, CommandInput, CommandGroup } from "../ui/command";

function SearchSelectField({ controlItem, field, inputClassName }) {
  const [inputValue, setInputValue] = useState("");

  const filteredOptions = (controlItem.options ?? []).filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Select
      value={field.value}
      onValueChange={(val) => {
        field.onChange(val);
        if (controlItem.onChange) {
          controlItem.onChange(val);
        }
      }}
    >
      <SelectTrigger className={inputClassName}>
        <SelectValue placeholder={controlItem.placeholder} />
      </SelectTrigger>
      <SelectContent
        className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 shadow-lg p-0"
        forceMount
        onCloseAutoFocus={(e) => {
          if (inputValue) e.preventDefault();
        }}
      >
        <Command shouldFilter={false} className="rounded-lg border shadow-md">
          <CommandInput
            autoFocus
            placeholder={`Search ${controlItem.label}...`}
            className="border-b"
            value={inputValue}
            onInput={(e) => setInputValue(e.currentTarget.value)}
          />
          <CommandGroup className="max-h-60 overflow-y-auto">
            {filteredOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 px-4 py-2"
                onSelect={(e) => e.preventDefault()}
              >
                {option.label}
              </SelectItem>
            ))}
          </CommandGroup>
        </Command>
      </SelectContent>
    </Select>
  );
}

export default SearchSelectField;
