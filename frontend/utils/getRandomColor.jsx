const colors = {
    0: "#f97316", // Vibrant orange
    1: "#1d4ed8", // Deep blue
    2: "#22c55e", // Bright green
    3: "#e11d48", // Strong red
    4: "#9333ea", // Bold purple
    5: "#f59e0b", // Warm amber
    6: "#3b82f6", // Sky blue
    7: "#14b8a6", // Teal
    8: "#f43f5e", // Coral pink
    9: "#a855f7", // Violet
    10: "#64748b", // Slate gray
    11: "#84cc16", // Lime green
    12: "#d97706", // Pumpkin orange
    13: "#0ea5e9", // Cyan
    14: "#ef4444", // Bright red
    15: "#4ade80", // Light green
    16: "#8b5cf6", // Light purple
    17: "#eab308", // Golden yellow
    18: "#3f6212", // Forest green
    19: "#9ca3af", // Neutral gray
};


export const getColor = (index) => {
  let random = index;
  if(index > colors.length){
    random = index%(colors.length);
  }
  return colors[random];
}