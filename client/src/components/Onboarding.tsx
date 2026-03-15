import { useState } from 'react';
import { UserPreferences } from '../types';

interface Props {
  preferences: UserPreferences;
  onToggle: (category: 'restaurants' | 'cafes' | 'bars', item: string) => void;
  onComplete: () => void;
  onSkip: () => void;
}

const sections: { key: 'restaurants' | 'cafes' | 'bars'; label: string; icon: string; options: string[] }[] = [
  {
    key: 'restaurants',
    label: 'Restaurants',
    icon: '🍽',
    options: ['Italian', 'Japanese', 'Mexican', 'Indian', 'Thai', 'French', 'Mediterranean', 'Korean', 'Chinese', 'American', 'Vegan', 'Seafood'],
  },
  {
    key: 'cafes',
    label: 'Cafes',
    icon: '☕',
    options: ['Specialty coffee', 'Quiet workspace', 'Brunch spot', 'Bakery', 'Tea house', 'Juice bar', 'Late-night', 'Outdoor seating'],
  },
  {
    key: 'bars',
    label: 'Bars',
    icon: '🍸',
    options: ['Cocktail bar', 'Wine bar', 'Rooftop', 'Dive bar', 'Sports bar', 'Speakeasy', 'Pub', 'Beer garden'],
  },
];

export default function Onboarding({ preferences, onToggle, onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const section = sections[step];
  const isLast = step === sections.length - 1;
  const selected = preferences[section.key];
  const totalSelected = preferences.restaurants.length + preferences.cafes.length + preferences.bars.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {sections.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all ${
              i < step ? 'bg-black border-black text-white' :
              i === step ? 'border-black text-black' :
              'border-neutral-300 text-neutral-300'
            }`}>
              {i < step ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : i + 1}
            </div>
            {i < sections.length - 1 && (
              <div className={`w-12 h-0.5 ${i < step ? 'bg-black' : 'bg-neutral-200'} transition-all`} />
            )}
          </div>
        ))}
      </div>

      {/* Section header */}
      <div className="text-center mb-8">
        <span className="text-3xl mb-3 block">{section.icon}</span>
        <h2 className="text-headline text-black mb-2">
          Your favourite {section.label.toLowerCase()}
        </h2>
        <p className="text-caption text-muted">
          Select the types you enjoy — helps us find better places
        </p>
      </div>

      {/* Options grid */}
      <div className="flex flex-wrap justify-center gap-2.5 max-w-lg mb-10">
        {section.options.map(opt => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(section.key, opt)}
              className={`px-4 py-2.5 text-[0.85rem] rounded-full border-2 transition-all ${
                isSelected
                  ? 'bg-black border-black text-white'
                  : 'border-neutral-300 text-neutral-600 hover:border-black hover:text-black'
              }`}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="inline mr-1.5 -mt-0.5">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {opt}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-6 py-3 text-[0.85rem] font-medium text-neutral-500 hover:text-black transition-colors"
          >
            Back
          </button>
        )}
        {isLast ? (
          <button
            onClick={onComplete}
            className="px-8 py-3 text-[0.85rem] font-medium bg-black text-white rounded-full hover:bg-neutral-800 transition-colors"
          >
            Done — let's go
          </button>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            className="px-8 py-3 text-[0.85rem] font-medium bg-black text-white rounded-full hover:bg-neutral-800 transition-colors"
          >
            Next
          </button>
        )}
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        className="mt-6 text-caption text-muted hover:text-black transition-colors"
      >
        Skip for now
      </button>

      {totalSelected > 0 && (
        <p className="mt-4 text-micro text-muted">
          {totalSelected} preference{totalSelected !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
