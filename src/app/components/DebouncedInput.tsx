import React, { useState, useEffect } from "react";

interface DebouncedInputProps {
  value?: string;
  placeholder?: string;
  className?: string;
  style?: Record<string, string>;
  handleChange: (input: string) => void;
  debounceTime?: number;
}

const DebouncedInput= ({value, className, style, handleChange, placeholder, debounceTime}: DebouncedInputProps) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, debounceTime || 500);

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [inputValue, debounceTime]);

  useEffect(() => {
    handleChange(debouncedValue);
  }, [debouncedValue, handleChange]);

  const localChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
      <input
        type="text"
        value={inputValue}
        onChange={localChange}
        placeholder={placeholder}
        className={className}
        style={style}
      />
  );
};

export default DebouncedInput;
