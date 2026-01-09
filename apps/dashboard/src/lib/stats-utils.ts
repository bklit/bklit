interface ChangeResult {
  change: number;
  changeType: "increase" | "decrease" | "neutral";
}

export function calculateChange(
  current: number,
  previous: number
): ChangeResult {
  if (previous === 0 && current === 0) {
    return {
      change: 0,
      changeType: "neutral",
    };
  }

  if (previous === 0 && current > 0) {
    return {
      change: 100,
      changeType: "increase",
    };
  }

  if (previous === 0 && current < 0) {
    return {
      change: -100,
      changeType: "decrease",
    };
  }

  const percentageChange = ((current - previous) / previous) * 100;

  const changeType =
    Math.abs(percentageChange) < 0.01
      ? "neutral"
      : percentageChange > 0
        ? "increase"
        : "decrease";

  return {
    change: Number(percentageChange.toFixed(1)),
    changeType,
  };
}
