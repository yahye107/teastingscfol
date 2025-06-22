import React from "react";
import Select from "react-select";

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  isDisabled,
}) => {
  const formattedOptions = options.map((opt) =>
    typeof opt === "string"
      ? { label: opt, value: opt }
      : {
          label: opt.label || opt.name || `${opt.grade} - ${opt.section}`,
          value: opt.value || opt._id,
        }
  );

  const selected = formattedOptions.find((o) => o.value === value) || null;

  return (
    <Select
      className="react-select"
      classNamePrefix="select"
      options={formattedOptions}
      value={selected}
      onChange={(selectedOption) => onChange(selectedOption?.value || "")}
      placeholder={placeholder}
      isSearchable
      isDisabled={isDisabled}
    />
  );
};

export default SearchableSelect;
