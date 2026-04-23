import React from 'react';

export default function MultiSelectPills({ options, selected, onChange, colorTheme = 'primary' }) {
  const toggleSelect = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter(i => i !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const themeClasses = colorTheme === 'primary' 
    ? 'bg-brand-primary/20 border-brand-primary text-brand-light'
    : 'bg-brand-accent/20 border-brand-accent text-brand-accent';

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggleSelect(opt)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              isSelected
                ? themeClasses
                : 'bg-white/5 border-white/10 text-secondary hover:border-white/20'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
