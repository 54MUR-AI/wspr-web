import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Paperclip, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Checkbox } from '../ui/checkbox';
import { Message } from '../../types/message';
import searchService from '../../services/search.service';
import { useDebounce } from '../../hooks/useDebounce';

interface MessageSearchProps {
  onResultSelect: (message: Message) => void;
}

const MessageSearch: React.FC<MessageSearchProps> = ({ onResultSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    hasAttachment: false,
  });

  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchSuggestions();
      performSearch();
    } else {
      setSuggestions([]);
      setResults([]);
    }
  }, [debouncedQuery, filters]);

  const fetchSuggestions = async () => {
    try {
      const suggestions = await searchService.getSearchSuggestions(debouncedQuery);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const performSearch = async () => {
    if (!debouncedQuery.trim()) return;

    setLoading(true);
    try {
      const searchResults = await searchService.searchMessages(debouncedQuery, filters);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    performSearch();
  };

  const handleResultClick = (message: Message) => {
    onResultSelect(message);
    setQuery('');
    setResults([]);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setFilters({
      startDate: null,
      endDate: null,
      hasAttachment: false,
    });
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={handleQueryChange}
            placeholder="Search messages..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Calendar className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-4 space-y-4">
              <div>
                <CalendarComponent
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) =>
                    setFilters((prev) => ({ ...prev, startDate: date }))
                  }
                  disabled={(date) =>
                    filters.endDate ? date > filters.endDate : false
                  }
                />
              </div>
              <div>
                <CalendarComponent
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) =>
                    setFilters((prev) => ({ ...prev, endDate: date }))
                  }
                  disabled={(date) =>
                    filters.startDate ? date < filters.startDate : false
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasAttachment"
                  checked={filters.hasAttachment}
                  onCheckedChange={(checked) =>
                    setFilters((prev) => ({
                      ...prev,
                      hasAttachment: checked as boolean,
                    }))
                  }
                />
                <label
                  htmlFor="hasAttachment"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Has attachment
                </label>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
          {results.map((message) => (
            <button
              key={message.id}
              className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
              onClick={() => handleResultClick(message)}
            >
              <div className="flex-1">
                <p className="text-sm font-medium truncate">{message.content}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(message.timestamp).toLocaleDateString()}
                </p>
              </div>
              {message.hasAttachment && (
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
