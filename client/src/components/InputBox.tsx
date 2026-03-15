import { useState, useRef, useEffect } from 'react';

interface Props {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export default function InputBox({ onSubmit, isLoading, initialValue }: Props) {
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
          onChange={e => setValue(e.target.value)}
          disabled={isLoading}
          placeholder="Find a place, ask about your schedule..."
          className="w-full py-4 pr-12 text-body bg-transparent border-b border-border placeholder:text-muted/40 focus:border-black focus:outline-none transition-colors disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="absolute right-0 p-2 text-muted hover:text-black disabled:opacity-20 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}
