"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getActiveCities, type City } from "@/lib/actions/city";

interface CitySearchProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: "header" | "form";
  disabled?: boolean;
  showIcon?: boolean;
}

export function CitySearch({
  value = "",
  onValueChange,
  placeholder = "Search cities...",
  className,
  variant = "form",
  disabled = false,
  showIcon = true,
}: CitySearchProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoading(true);
      try {
        const result = await getActiveCities();
        if (result.success && result.data) {
          // Sort cities by priority (popular cities first) then alphabetically
          const sortedCities = result.data.sort((a, b) => {
            // First sort by priority (higher priority first)
            if (b.priority !== a.priority) {
              return b.priority - a.priority;
            }
            // Then sort alphabetically by name
            return a.name.localeCompare(b.name);
          });
          setCities(sortedCities);
          setFilteredCities(sortedCities);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
  }, []);

  // Set initial selected city based on value prop
  useEffect(() => {
    if (value && cities.length > 0) {
      const city = cities.find((c) => c.name === value);
      if (city) {
        setSelectedCity(city);
        setSearchQuery(city.name);
      }
    }
  }, [value, cities]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        // When no search query, show cities ordered by priority
        const sortedCities = [...cities].sort(
          (a, b) => b.priority - a.priority
        );
        setFilteredCities(sortedCities);
        return;
      }

      const filtered = cities.filter(
        (city) =>
          city.name.toLowerCase().includes(query.toLowerCase()) ||
          city.state.toLowerCase().includes(query.toLowerCase())
      );

      // Sort filtered results by priority (popular cities first) then alphabetically
      const sortedFiltered = filtered.sort((a, b) => {
        // First sort by priority (higher priority first)
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        // Then sort alphabetically by name
        return a.name.localeCompare(b.name);
      });

      setFilteredCities(sortedFiltered);
    }, 300),
    [cities]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedCity(null);
    setIsOpen(true);

    // Immediate search for better responsiveness
    if (!query.trim()) {
      const sortedCities = [...cities].sort((a, b) => b.priority - a.priority);
      setFilteredCities(sortedCities);
    } else {
      const filtered = cities.filter(
        (city) =>
          city.name.toLowerCase().includes(query.toLowerCase()) ||
          city.state.toLowerCase().includes(query.toLowerCase())
      );

      const sortedFiltered = filtered.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.name.localeCompare(b.name);
      });

      setFilteredCities(sortedFiltered);
    }

    // Also use debounced search for performance
    debouncedSearch(query);
  };

  // Handle city selection
  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setSearchQuery(city.name);
    setIsOpen(false);
    onValueChange?.(city.name);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCities.length > 0) {
        handleCitySelect(filteredCities[0]);
      }
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "header":
        return {
          container:
            "bg-white/10 rounded-full px-4 py-2 hover:bg-white/20 transition-colors",
          input:
            "bg-transparent border-none text-white placeholder:text-white/60 h-auto p-0 focus-visible:ring-0",
          dropdown:
            "bg-white rounded-2xl shadow-2xl border border-gray-100 mt-2",
          item: "text-gray-900 hover:bg-gray-50 hover:text-[#b81ce3]",
        };
      case "form":
      default:
        return {
          container: "relative",
          input:
            "pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-[#b81ce3] focus:ring-1 focus:ring-[#b81ce3]",
          dropdown: "bg-white rounded-lg shadow-lg border border-gray-200 mt-1",
          item: "text-gray-900 hover:bg-[#b81ce3]/5 hover:text-[#b81ce3]",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      ref={searchRef}
      className={cn("relative", styles.container, className)}
    >
      <div className="relative flex items-center">
        {showIcon && variant === "form" && (
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
        {showIcon && variant === "header" && (
          <MapPin className="w-4 h-4 text-white/90 mr-2" />
        )}

        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(styles.input, {
            "pl-3": variant === "header" || !showIcon,
          })}
        />

        {variant === "header" && (
          <ChevronDown
            className={cn(
              "w-4 h-4 text-white/70 ml-2 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 w-full max-h-60 overflow-y-auto",
            styles.dropdown,
            variant === "header" ? "left-0 right-0" : "top-full"
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">
                Loading cities...
              </span>
            </div>
          ) : filteredCities.length > 0 ? (
            <div className="py-1">
              {filteredCities.slice(0, 10).map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm transition-colors",
                    styles.item,
                    selectedCity?.id === city.id &&
                      "bg-[#b81ce3]/10 text-[#b81ce3]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-2 opacity-60" />
                      <span className="font-medium">{city.name}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        , {city.state}
                      </span>
                    </div>
                    {city.priority > 0 && (
                      <span className="text-xs text-gray-400">
                        {city.priority >= 90
                          ? "•"
                          : city.priority >= 80
                          ? "•"
                          : city.priority >= 70
                          ? "•"
                          : ""}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {filteredCities.length > 10 && (
                <div className="px-4 py-2 text-xs text-gray-500 border-t">
                  Showing first 10 of {filteredCities.length} results
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 px-4 text-center text-sm text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No cities found</p>
              <p className="text-xs">
                {searchQuery.trim()
                  ? `No cities match "${searchQuery}". Try different keywords.`
                  : "Try searching with different keywords"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
