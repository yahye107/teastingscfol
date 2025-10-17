import React, { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import CommonButton from "./common-button";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"; // Add these imports
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash } from "lucide-react";

function CommonForm({
  formControls = [],
  handleSubmit,
  form,
  btnText,
  customLayout,
  className,
  inputClassName = "bg-white p-5 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500",
  labelClassName = "text-sm mt-2 text-xl font-medium text-gray-700 dark:text-gray-300",
  errorClassName,
  buttonClassName,
  iconClassName,
  // gridClassName,
}) {
  const renderField = (controlItem, fieldId) => {
    const [searchTerm, setSearchTerm] = useState("");
    const error = form.formState.errors[controlItem.id];
    return (
      <FormField
        key={controlItem.id}
        control={form.control}
        name={controlItem.id}
        render={({ field }) => (
          <FormItem className="space-y-2 relative">
            <FormLabel
              className={`${labelClassName} !text-gray-700 dark:!text-gray-300 mt-2`}
            >
              {controlItem.label}
            </FormLabel>
            {controlItem.componentType === "input" && (
              <div className="relative">
                {customLayout?.icons?.[fieldId] &&
                  (() => {
                    const IconComponent = customLayout.icons[fieldId];
                    return (
                      <IconComponent
                        className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black ${
                          iconClassName || ""
                        }`}
                      />
                    );
                  })()}
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (controlItem.onChange) {
                      controlItem.onChange(e);
                    }
                  }}
                  type={controlItem.type}
                  placeholder={controlItem.placeholder}
                  className={`${inputClassName} ${
                    customLayout?.icons?.[fieldId] ? "pl-10" : ""
                  }`}
                />
              </div>
            )}
            {/* ////////////// */}

            {/* {controlItem.componentType === "file" && (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      field.onChange(file);
                      if (controlItem.onChange) {
                        controlItem.onChange(file);
                      }
                    }
                  }}
                  className={inputClassName}
                />
                {field.value && (
                  <p className="text-sm text-gray-500">
                    Selected: {field.value.name}
                  </p>
                )}
              </div>
            )} */}
            {controlItem.componentType === "file" && (
              <div className="space-y-3 flex flex-col items-center">
                {/* Square Image Preview Box */}
                <div
                  className="w-32 h-32 border-2 border-dashed rounded-xl 
        flex items-center justify-center 
        border-gray-300 dark:border-gray-600 
        bg-gray-50 dark:bg-gray-800/40 overflow-hidden"
                >
                  {field.value && field.value instanceof File ? (
                    <img
                      src={URL.createObjectURL(field.value)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400 text-center px-2">
                      No Image
                    </span>
                  )}
                </div>

                {/* Upload Button */}
                <label
                  className="px-4 py-2 text-sm font-medium rounded-lg 
      bg-indigo-600 text-white hover:bg-indigo-700 
      cursor-pointer transition"
                >
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        field.onChange(file);
                        if (controlItem.onChange) {
                          controlItem.onChange(file);
                        }
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* ////////// */}
            {controlItem.componentType === "textarea" && (
              <Textarea
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  if (controlItem.onChange) {
                    controlItem.onChange(e);
                  }
                }}
                placeholder={controlItem.placeholder}
                className={`${inputClassName} resize-none min-h-[120px]`}
              />
            )}
            {/* //////// */}
            {controlItem.componentType === "multi-object" && (
              <div className="space-y-6">
                {(field.value || []).map((obj, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 shadow-sm"
                  >
                    <div className="grid grid-cols-2 gap-6 mb-4">
                      {controlItem.subFields?.map((subField) => (
                        <div key={subField.id} className="space-y-2">
                          {subField.componentType === "search-select" ? (
                            <Select
                              value={obj[subField.id] || ""}
                              onValueChange={(val) => {
                                const updated = [...(field.value || [])];
                                updated[index] = {
                                  ...updated[index],
                                  [subField.id]: val,
                                };
                                field.onChange(updated);
                              }}
                            >
                              <SelectTrigger
                                className={`${inputClassName} hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                              >
                                <SelectValue
                                  placeholder={
                                    <span className="text-gray-400">
                                      {subField.placeholder}
                                    </span>
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                <Command>
                                  <CommandInput
                                    placeholder={`Search ${subField.label}...`}
                                    className="placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                  />
                                  <CommandGroup className="max-h-48 overflow-y-auto">
                                    {subField.options?.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        className="hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={obj[subField.id] || ""}
                              type={subField.type}
                              placeholder={subField.label}
                              onChange={(e) => {
                                const updated = [...(field.value || [])];
                                updated[index] = {
                                  ...updated[index],
                                  [subField.id]: e.target.value,
                                };
                                field.onChange(updated);
                              }}
                              className={`${inputClassName} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(field.value || [])];
                          updated.splice(index, 1);
                          field.onChange(updated);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                        Remove
                      </button>
                      {/* <button
                        type="button"
                        onClick={() => {
                          const updated = [...(field.value || []), {}];
                          field.onChange(updated);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-md transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Add Another
                      </button> */}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...(field.value || []), {}];
                    field.onChange(updated);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add New Entry
                </button>
              </div>
            )}
            {/* ////////// */}
            {controlItem.componentType === "select" && (
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
                <SelectContent className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 shadow-lg">
                  <Command>
                    <CommandInput
                      placeholder={`Search ${controlItem.label}...`}
                    />
                    {/* <CommandEmpty>No {controlItem.label} found.</CommandEmpty> */}
                    <CommandGroup>
                      {(controlItem.options ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </SelectContent>
              </Select>
            )}

            {controlItem.componentType === "search-select" && (
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
                <SelectContent className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 shadow-lg p-0">
                  <Command
                    shouldFilter={false}
                    loop={false} // prevents up/down arrow selection
                    // ideally, stop propagation too
                    onKeyDown={(e) => e.stopPropagation()} // prevent Radix Select keyboard handling
                    className=""
                    // className="rounded-lg border shadow-md"
                  >
                    <CommandInput
                      placeholder={`Search ${controlItem.label}...`}
                      className="border-b"
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    {/* <CommandEmpty>No {controlItem.label} found.</CommandEmpty> */}
                    <CommandGroup className="max-h-60 overflow-y-auto">
                      {(controlItem.options ?? [])
                        .filter(
                          (option) =>
                            typeof option.label === "string" &&
                            option.label
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                        )
                        .map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 px-4 py-2"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </SelectContent>
              </Select>
            )}
            {controlItem.componentType === "search-selectImg" && (
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
                <SelectContent className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 shadow-lg p-0">
                  <Command
                    shouldFilter={false}
                    loop={false} // prevents up/down arrow selection
                    // ideally, stop propagation too
                    onKeyDown={(e) => e.stopPropagation()} // prevent Radix Select keyboard handling
                    className=""
                    // className="rounded-lg border shadow-md"
                  >
                    <CommandInput
                      placeholder={`Search ${controlItem.label}...`}
                      className="border-b"
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    {/* <CommandEmpty>No {controlItem.label} found.</CommandEmpty> */}
                    <CommandGroup className="max-h-60 overflow-y-auto">
                      {(controlItem.options ?? [])
                        .filter((option) =>
                          option.searchText
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        )
                        .map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 px-4 py-2 flex items-center gap-2"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </SelectContent>
              </Select>
            )}
            {error && (
              <p className="absolute text-red-500 text-sm left-0 top-full mb-1">
                {error.message}
              </p>
            )}
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        {customLayout?.grid
          ? customLayout.grid.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={
                  row.length === 1
                    ? "grid grid-cols-1 gap-4"
                    : row.length === 2
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                      : row.length === 3
                        ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                        : row.length >= 4
                          ? "grid grid-cols-2 md:grid-cols-4 gap-4"
                          : "grid grid-cols-1 gap-4" // fallback
                }
              >
                {row.map((fieldId) => {
                  const controlItem = formControls.find(
                    (c) => c.id === fieldId
                  );
                  if (!controlItem) return null;
                  return renderField(controlItem, fieldId);
                })}
              </div>
            ))
          : formControls.map((controlItem) =>
              renderField(controlItem, controlItem.id)
            )}

        <div className="mt-6">
          <CommonButton
            type="submit"
            buttonText={btnText}
            className={buttonClassName}
          />
        </div>
      </form>
    </Form>
  );
}

export default CommonForm;
