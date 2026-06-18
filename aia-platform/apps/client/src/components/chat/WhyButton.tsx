interface WhyButtonProps {
  onAskWhy: () => void;
}

export function WhyButton({ onAskWhy }: WhyButtonProps) {
  return (
    <button
      onClick={onAskWhy}
      className="text-xs text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors bg-transparent border-none p-0 cursor-pointer"
      aria-label="Chiedi perché"
    >
      Perché?
    </button>
  );
}
