import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const DarkSelect = ({ value, onChange, options = [], className = '', disabled = false, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    // Handle escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    if (!disabled) {
      // Simulate native event structure for drop-in compatibility
      onChange({ target: { value: optionValue } });
      setIsOpen(false);
    }
  };

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : (placeholder || 'Select an option');

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`flex items-center justify-between w-full px-4 py-2.5 bg-[#0f172a] border border-slate-800/50 rounded-xl text-sm transition-all shadow-sm
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50'}
          ${isOpen ? 'ring-2 ring-red-500/20 border-red-500/50' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={`truncate ${!selectedOption && placeholder ? 'text-slate-500' : 'text-white'}`}>
          {displayLabel}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#0f172a] border border-slate-800/50 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
          <ul className="py-1 m-0 list-none">
            {options.map((option, idx) => (
              <li
                key={option.value || idx}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors
                  ${String(option.value) === String(value) ? 'bg-red-500/10 text-red-400 font-medium' : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'}
                `}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-4 py-2 text-sm text-slate-500 text-center">No options</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DarkSelect;
