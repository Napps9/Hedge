import { useState, useRef, useEffect } from 'react';

interface InputBoxProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
  initialValue?: string;
}

function InputBox({ onSubmit, isLoading, placeholder, initialValue }: InputBoxProps) {
  const [value, setValue] = useState(initialValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
      inputRef.current?.focus();
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
          placeholder={placeholder || 'Ask anything...'}
          className="w-full py-4 pr-12 text-body bg-transparent border-b border-border
                     placeholder:text-muted/50 focus:border-primary focus:outline-none
                     transition-colors duration-300 disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="absolute right-0 p-2 text-muted hover:text-primary
                     disabled:opacity-20 disabled:hover:text-muted
                     transition-all duration-200"
          aria-label="Send"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}

export default InputBox;
