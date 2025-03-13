// src/components/ui/color-swatch.tsx
import React from 'react';

interface ColorSwatchProps {
  colors: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  className?: string;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  colors,
  selectedColor,
  onSelectColor,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className={`w-6 h-6 rounded-full transition-all ${
            selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : 'hover:scale-110'
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onSelectColor(color)}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
};