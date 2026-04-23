import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FormInput = forwardRef(({ label, error, type = 'text', ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-secondary">{label}</label>}
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          className={`w-full bg-white/5 border rounded-xl p-3 text-white placeholder-white/30 outline-none transition-all ${
            error 
              ? 'border-brand-coral focus:border-brand-coral focus:ring-1 focus:ring-brand-coral/50' 
              : 'border-white/10 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50'
          }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-brand-coral">{error}</span>}
    </div>
  );
});

FormInput.displayName = 'FormInput';
export default FormInput;
