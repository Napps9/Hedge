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
          placeholder="When are you free? What are you looking for?"
          className="w-full py-4 pr-14 text-body bg-transparent border-b-2 border-neutral-800 placeholder:text-neutral-400 focus:border-black focus:outline-none transition-colors disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="absolute right-0 px-4 py-2 bg-black text-white rounded-full text-caption font-medium disabled:opacity-20 hover:bg-neutral-800 transition-all"
        >
          Search
        </button>
      </div>
    </form>
  );
}
