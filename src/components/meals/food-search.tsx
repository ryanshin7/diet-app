"use client";

import { useState, useEffect } from "react";
import { searchFoods } from "@/actions/meals";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { FoodItem } from "@/types/database";

interface FoodSearchProps {
  onSelect: (food: FoodItem) => void;
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      const data = await searchFoods(query);
      setResults(data as FoodItem[]);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="음식을 검색하세요..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      {isSearching && (
        <p className="text-sm text-muted-foreground text-center">검색 중...</p>
      )}
      {results.length > 0 && (
        <div className="max-h-60 overflow-y-auto space-y-1">
          {results.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => {
                onSelect(food);
                setQuery("");
                setResults([]);
              }}
              className="w-full rounded-lg border p-3 text-left hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{food.name}</span>
                <span className="text-xs text-muted-foreground">
                  {food.calories} kcal
                </span>
              </div>
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                <span>단 {food.protein_g}g</span>
                <span>탄 {food.carbs_g}g</span>
                <span>지 {food.fat_g}g</span>
                <span>({food.serving_size}{food.serving_unit})</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {query.length >= 1 && !isSearching && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          검색 결과가 없습니다
        </p>
      )}
    </div>
  );
}
