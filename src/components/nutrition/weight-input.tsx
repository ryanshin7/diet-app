"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addWeightLog } from "@/actions/weight";
import { Scale } from "lucide-react";

export function WeightInput() {
  const [weight, setWeight] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async () => {
    if (!weight) return;
    setIsPending(true);
    await addWeightLog(
      Number(weight),
      new Date().toISOString().split("T")[0]
    );
    setWeight("");
    setIsPending(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Scale className="h-4 w-4 text-muted-foreground" />
      <Input
        type="number"
        placeholder="오늘 체중 (kg)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        className="w-32"
        step={0.1}
        min={30}
        max={300}
      />
      <Button size="sm" onClick={handleSubmit} disabled={isPending || !weight}>
        {isPending ? "..." : "기록"}
      </Button>
    </div>
  );
}
