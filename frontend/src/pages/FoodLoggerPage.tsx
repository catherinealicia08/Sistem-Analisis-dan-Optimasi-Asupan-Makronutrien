import { useEffect, useMemo, useState } from "react";
import {
  CalendarBlank,
  Heart,
  MagnifyingGlass,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import type { DailyLog, Food } from "../types";
import { api } from "../api/client";
import { Skeleton } from "../components/ui/Skeleton";
import { foodImageSrc, onFoodImgError } from "../lib/foodImage";
import { MEAL_LABEL, groupByMeal, itemMacros, type MealKey } from "../lib/meals";
import { prettyDate } from "../lib/format";

interface Props {
  userId: string;
  date: string;
  log: DailyLog | null;
  onChange: () => void;
}

interface Filter { key: string; label: string }

const FILTERS: Filter[] = [
  { key: "all",           label: "All" },
  { key: "high-protein",  label: "High Protein" },
  { key: "low-calorie",   label: "Low Calorie" },
  { key: "low-fat",       label: "Low Fat" },
  { key: "low-carb",      label: "Low Carb" },
  { key: "vegetarian",    label: "Vegetarian" },
  { key: "vegan",         label: "Vegan" },
  { key: "indonesian",    label: "Indonesian" },
  { key: "meal-prep",     label: "Meal Prep" },
  { key: "favorites",     label: "Favorites" },
];

type SortKey = "default" | "protein-desc" | "kcal-asc" | "kcal-desc" | "name-asc";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "default",      label: "Default order" },
  { key: "protein-desc", label: "Highest protein" },
  { key: "kcal-asc",     label: "Lowest calories" },
  { key: "kcal-desc",    label: "Highest calories" },
  { key: "name-asc",     label: "Alphabetical" },
];

const FAVORITES_KEY = "macroplus.favs.v1";

function loadFavs(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveFavs(favs: Set<string>) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favs))); } catch { /* noop */ }
}

const VEGAN_CATEGORIES = new Set(["Sayuran", "Buah", "Protein Nabati", "Karbohidrat"]);
const VEGAN_BLOCKED = new Set(["Mentega"]);
const VEGETARIAN_BLOCKED_CATS = new Set(["Protein Hewani"]);
// Indonesian cooked dishes that still count as vegetarian-friendly (no meat).
const VEG_INDO_ALLOWED = new Set([
  "Pecel", "Gado-gado", "Cap Cay", "Tumis Kangkung", "Sambal Goreng Tempe",
  "Telur Balado", "Sayur Asem", "Sayur Lodeh", "Gudeg", "Lontong", "Ketupat",
  "Nasi Uduk", "Nasi Kuning",
]);
// Foods that hold up well as batch-cooked meal prep.
const MEAL_PREP_FOODS = new Set([
  "Dada Ayam Tanpa Kulit", "Paha Ayam", "Daging Sapi Tanpa Lemak", "Ikan Salmon",
  "Ikan Tuna", "Ikan Tongkol", "Ikan Lele", "Nasi Merah", "Nasi Putih", "Quinoa Matang",
  "Ubi Jalar", "Kentang Rebus", "Oatmeal", "Roti Gandum", "Tempe", "Tahu",
  "Edamame Kupas", "Sayur Brokoli Kukus", "Brokoli", "Bayam", "Wortel",
  "Telur Rebus", "Putih Telur", "Greek Yogurt", "Cottage Cheese",
  "Ayam Bakar", "Rendang Sapi",
]);

export function FoodLoggerPage({ userId, date, log, onChange }: Props) {
  const [foods, setFoods] = useState<Food[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [favs, setFavs] = useState<Set<string>>(() => loadFavs());
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      api.listFoods(q).then((res) => { if (alive) setFoods(res); }).catch((e) => setError(e.message));
    }, 160);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  const filtered = useMemo(() => {
    if (!foods) return [];
    let out = foods;
    switch (filter) {
      case "high-protein": out = out.filter((f) => f.protein >= 15); break;
      case "low-calorie":  out = out.filter((f) => f.calories <= 120); break;
      case "low-fat":      out = out.filter((f) => f.fat <= 5); break;
      case "low-carb":     out = out.filter((f) => f.carbs <= 10); break;
      case "vegetarian":
        out = out.filter((f) =>
          !VEGETARIAN_BLOCKED_CATS.has(f.category) &&
          (f.category !== "Makanan Indonesia" || VEG_INDO_ALLOWED.has(f.name))
        );
        break;
      case "vegan":
        out = out.filter((f) => VEGAN_CATEGORIES.has(f.category) && !VEGAN_BLOCKED.has(f.name));
        break;
      case "indonesian":   out = out.filter((f) => f.category === "Makanan Indonesia"); break;
      case "meal-prep":    out = out.filter((f) => MEAL_PREP_FOODS.has(f.name)); break;
      case "favorites":    out = out.filter((f) => favs.has(f.id)); break;
    }
    const sorted = [...out];
    switch (sortKey) {
      case "protein-desc": sorted.sort((a, b) => b.protein - a.protein); break;
      case "kcal-asc":     sorted.sort((a, b) => a.calories - b.calories); break;
      case "kcal-desc":    sorted.sort((a, b) => b.calories - a.calories); break;
      case "name-asc":     sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return sorted;
  }, [foods, filter, favs, sortKey]);

  function toggleFav(id: string) {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveFavs(next);
      return next;
    });
  }

  async function quickAdd(food: Food, grams: number) {
    setAdding(food.id);
    setError(null);
    try {
      await api.addLogItem(userId, date, food.id, grams);
      onChange();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(null);
    }
  }

  async function remove(itemId: string) {
    setError(null);
    try {
      await api.deleteLogItem(userId, date, itemId);
      onChange();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      {/* Browser */}
      <div className="card min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-ink-900">Search Foods</h2>
          <button className="hidden h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 sm:inline-flex" aria-label="Calendar">
            <CalendarBlank size={16} />
          </button>
        </div>

        <label className="relative mt-4 block">
          <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
          <input
            className="input pl-10"
            placeholder="Search foods..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 scroll-thin sm:mx-0 sm:px-0">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`chip shrink-0 ${filter === f.key ? "chip-active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="shrink-0">
            <span className="sr-only">Sort</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded-lg border border-ink-200 bg-surface px-3 py-2 text-xs font-semibold text-ink-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>Sort: {s.label}</option>
              ))}
            </select>
          </label>
        </div>
        {filtered.length > 0 && (
          <p className="mt-3 text-xs text-ink-500">
            {filtered.length} food{filtered.length === 1 ? "" : "s"} matched
            {filter !== "all" && ` · filter: ${FILTERS.find((f) => f.key === filter)?.label}`}
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {!foods && Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
          {foods && filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-12 text-center text-sm text-ink-500">
              No foods match your filters.
            </div>
          )}
          {filtered.map((f) => (
            <FoodCard
              key={f.id}
              food={f}
              isFavorite={favs.has(f.id)}
              onToggleFavorite={() => toggleFav(f.id)}
              onAdd={(grams) => quickAdd(f, grams)}
              adding={adding === f.id}
            />
          ))}
        </div>
      </div>

      {/* Today's Log */}
      <TodayLog
        log={log}
        date={date}
        onRemove={remove}
      />
    </div>
  );
}

function FoodCard({
  food,
  isFavorite,
  onToggleFavorite,
  onAdd,
  adding,
}: {
  food: Food;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAdd: (grams: number) => void;
  adding: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [grams, setGrams] = useState(String(Math.round(food.serving_size || 100)));
  const parsedGrams = Number(grams);
  const validGrams = Number.isFinite(parsedGrams) && parsedGrams > 0 ? parsedGrams : 0;
  const previewKcal = (food.calories * validGrams) / 100;

  function startEdit() {
    setGrams(String(Math.round(food.serving_size || 100)));
    setIsEditing(true);
  }

  function submit() {
    if (!validGrams || adding) return;
    onAdd(validGrams);
    setIsEditing(false);
  }

  return (
    <article className="overflow-hidden rounded-xl2 border border-ink-200 bg-surface shadow-card transition hover:shadow-lift">
      <div className="relative aspect-[4/3] bg-ink-100">
        <img
          src={foodImageSrc(food)}
          alt={food.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={onFoodImgError}
          className="h-full w-full object-cover"
        />
        <button
          onClick={onToggleFavorite}
          aria-label="Favorite"
          className={`absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 shadow-card transition ${
            isFavorite ? "text-red-500" : "text-ink-500 hover:text-red-500"
          }`}
        >
          <Heart size={16} weight={isFavorite ? "fill" : "regular"} />
        </button>
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-semibold text-ink-900">{food.name}</h3>
        <p className="mt-1 text-xs text-ink-500 num">
          {Math.round(food.calories)} kcal &middot; {food.protein.toFixed(1)}g protein
        </p>
        {isEditing ? (
          <div className="mt-3 space-y-2 rounded-lg border border-ink-200 bg-ink-50/70 p-2.5">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                step={1}
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                className="input h-9 flex-1"
                placeholder="Grams"
              />
              <span className="text-xs font-semibold text-ink-500">gram</span>
            </div>
            <p className="text-xs text-ink-500 num">
              Preview: {Math.round(previewKcal || 0)} kcal
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                disabled={adding}
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={adding || !validGrams}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-brand-500 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={14} weight="bold" />
                {adding ? "Adding..." : "Add Food"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={startEdit}
            disabled={adding}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand-500 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={14} weight="bold" />
            {adding ? "Adding..." : "Add"}
          </button>
        )}
      </div>
    </article>
  );
}

function TodayLog({
  log,
  date,
  onRemove,
}: {
  log: DailyLog | null;
  date: string;
  onRemove: (id: string) => void;
}) {
  const groups = useMemo(() => (log ? groupByMeal(log.items) : null), [log]);
  const mealOrder: MealKey[] = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <aside className="card flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink-900">Today&apos;s Food Log</h2>
        <span className="text-xs text-ink-500">{prettyDate(date)}</span>
      </div>

      <div className="mt-4 flex-1 space-y-5">
        {!log && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        {log && log.items.length === 0 && (
          <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/40 px-4 py-10 text-center text-sm text-ink-500">
            No foods logged yet today.
          </div>
        )}
        {groups &&
          mealOrder.map((meal) => {
            const items = groups[meal];
            if (items.length === 0) return null;
            const totalKcal = items.reduce((s, it) => s + itemMacros(it).calories, 0);
            return (
              <div key={meal}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-500">
                    {MEAL_LABEL[meal]}
                  </h3>
                  <span className="text-xs font-semibold text-ink-700 num">{Math.round(totalKcal)} kcal</span>
                </div>
                <ul className="space-y-2">
                  {items.map((it) => {
                    const kcal = itemMacros(it).calories;
                    return (
                      <li
                        key={it.id}
                        className="group flex items-center gap-3 rounded-lg border border-ink-200 px-2.5 py-2 transition hover:bg-ink-50"
                      >
                        <img
                          src={foodImageSrc(it.food)}
                          alt=""
                          onError={onFoodImgError}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-ink-900">{it.food.name}</div>
                          <div className="text-[11px] text-ink-500 num">{Math.round(it.grams)}g</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-ink-900 num">{Math.round(kcal)} kcal</div>
                        </div>
                        <button
                          onClick={() => onRemove(it.id)}
                          aria-label={`Remove ${it.food.name}`}
                          className="ml-1 text-ink-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                        >
                          <Trash size={15} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
      </div>

      <button className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50">
        <Plus size={16} weight="bold" />
        Add Food
      </button>
    </aside>
  );
}
