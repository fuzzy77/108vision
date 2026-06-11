import { useState, useEffect, useRef } from 'react';
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_LABELS, getEntityColor } from '@/lib/graph-colors';
import { useEntitySearch, type GraphEntity } from '@/hooks/useGraph';
import { Button } from '@/components/ui/Button';
import { Search, RotateCcw } from 'lucide-react';

interface GraphFiltersProps {
  tenantId: string;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  minConfidence: number;
  onMinConfidenceChange: (value: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEntitySelect: (entityId: string) => void;
  onReset: () => void;
}

function GraphFilters({
  tenantId,
  selectedTypes,
  onTypesChange,
  minConfidence,
  onMinConfidenceChange,
  searchQuery,
  onSearchChange,
  onEntitySelect,
  onReset,
}: GraphFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults } = useEntitySearch(tenantId, localSearch);

  // Sync external search query
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allTypes = Object.keys(ENTITY_TYPE_COLORS);

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const handleSearchSubmit = () => {
    onSearchChange(localSearch);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (entity: GraphEntity) => {
    setLocalSearch(entity.name);
    onSearchChange(entity.name);
    onEntitySelect(entity.id);
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-800 rounded-xl border border-slate-700">
      {/* Search */}
      <div ref={searchRef} className="relative flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit();
            }}
            placeholder="Cerca entita..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Autocomplete suggestions */}
        {showSuggestions && searchResults && searchResults.length > 0 && localSearch.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-50 max-h-[200px] overflow-y-auto">
            {searchResults.map((entity) => (
              <button
                key={entity.id}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-600 text-left"
                onClick={() => handleSuggestionClick(entity)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getEntityColor(entity.type) }}
                />
                <span className="text-sm text-slate-200 truncate">{entity.name}</span>
                <span className="text-xs text-slate-400 ml-auto shrink-0">
                  {ENTITY_TYPE_LABELS[entity.type] ?? entity.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entity type filters */}
      <div className="flex flex-wrap gap-1.5">
        {allTypes.map((type) => {
          const isActive = selectedTypes.length === 0 || selectedTypes.includes(type);
          const color = ENTITY_TYPE_COLORS[type];
          const label = ENTITY_TYPE_LABELS[type] ?? type;

          return (
            <button
              key={type}
              onClick={() => handleTypeToggle(type)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-600 text-slate-200'
                  : 'bg-slate-750 text-slate-500 opacity-50'
              }`}
              title={label}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color, opacity: isActive ? 1 : 0.4 }}
              />
              <span className="hidden lg:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Confidence slider */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 whitespace-nowrap">Min. confidenza:</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={minConfidence}
          onChange={(e) => onMinConfidenceChange(parseInt(e.target.value))}
          className="w-20 h-1.5 rounded-full bg-slate-600 appearance-none cursor-pointer accent-primary-500"
        />
        <span className="text-xs text-slate-300 font-mono w-8">{minConfidence}%</span>
      </div>

      {/* Reset */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="text-slate-400 hover:text-slate-200"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset
      </Button>
    </div>
  );
}

export { GraphFilters };
