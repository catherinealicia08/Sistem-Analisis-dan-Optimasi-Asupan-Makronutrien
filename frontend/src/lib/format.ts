export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const clamp = (n: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, n));

export const fmt = (n: number, digits = 0) =>
  Number.isFinite(n) ? n.toFixed(digits) : "0";

export const prettyDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export const shortDay = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short" });
  } catch {
    return iso;
  }
};

export const greetingFor = (d: Date = new Date()): string => {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};
