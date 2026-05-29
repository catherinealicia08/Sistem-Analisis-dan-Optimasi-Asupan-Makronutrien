import type { Food } from "../types";

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'>
      <defs>
        <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
          <stop offset='0' stop-color='#F0FDF4'/>
          <stop offset='1' stop-color='#DCFCE7'/>
        </linearGradient>
      </defs>
      <rect width='200' height='150' fill='url(#g)'/>
      <g transform='translate(100 75)' fill='none' stroke='#16A34A' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'>
        <circle r='22'/>
        <path d='M-10 -2 q10 14 20 0'/>
        <circle cx='-7' cy='-8' r='1.6' fill='#16A34A'/>
        <circle cx='8' cy='-8' r='1.6' fill='#16A34A'/>
      </g>
      <text x='100' y='130' text-anchor='middle' font-family='Inter, sans-serif' font-size='10' fill='#16A34A' font-weight='600'>MacroPlus</text>
    </svg>`
  );

export const foodImageSrc = (food: Pick<Food, "image_url"> | { image_url: string | null }): string =>
  food.image_url && food.image_url.trim().length > 0 ? food.image_url : FALLBACK;

export const onFoodImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const el = e.currentTarget;
  if (el.src !== FALLBACK) el.src = FALLBACK;
};

export const FALLBACK_FOOD_IMG = FALLBACK;
