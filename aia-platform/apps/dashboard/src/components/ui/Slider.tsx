import { cn } from '@/lib/utils';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.1,
  label,
  showValue,
  className,
}: SliderProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
          {showValue && (
            <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{value.toFixed(1)}</span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full bg-slate-200 appearance-none cursor-pointer accent-primary-600 dark:bg-slate-700"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export { Slider };
