import type { SVGProps } from "react";
import type { PokemonType } from "@/lib/pokemon-types";

/**
 * Minimalist white-on-color SVG glyphs for each Pokémon type.
 * Hand-drawn 24×24 paths styled to read at small sizes (14–24px).
 * Each glyph uses `currentColor` and `fill` so the parent can control color.
 */
type IconProps = SVGProps<SVGSVGElement>;

const wrap =
  (children: React.ReactNode) =>
  (props: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );

export const TYPE_ICONS: Record<PokemonType, (p: IconProps) => JSX.Element> = {
  // Normal — simple ring (neutral).
  normal: wrap(<circle cx="12" cy="12" r="6" fill="none" strokeWidth={2.5} />),
  // Fire — flame.
  fire: wrap(
    <path d="M12 3c1 3 4 5 4 9a4 4 0 11-8 0c0-1.5.5-2.5 1.5-3.5C8 11 7 13 7 14a5 5 0 0010 0c0-3.5-3-6-5-11z" />,
  ),
  // Water — droplet.
  water: wrap(<path d="M12 3c-3 4.5-6 8-6 11a6 6 0 0012 0c0-3-3-6.5-6-11z" />),
  // Electric — lightning bolt.
  electric: wrap(<path d="M13 2L4 14h6l-2 8 10-13h-6l1-7z" />),
  // Grass — leaf.
  grass: wrap(
    <path d="M5 19c0-8 6-14 14-14 0 9-5 15-14 15zM5 19l4-4" strokeWidth={1.5} />,
  ),
  // Ice — snowflake.
  ice: wrap(
    <g strokeWidth={2} fill="none">
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="4.5" y1="7.5" x2="19.5" y2="16.5" />
      <line x1="4.5" y1="16.5" x2="19.5" y2="7.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </g>,
  ),
  // Fighting — fist.
  fighting: wrap(
    <path d="M7 10c0-2 1-3 2.5-3S12 8 12 10v1h1V8c0-1.5 1-2.5 2.5-2.5S18 6.5 18 8v6a5 5 0 01-5 5H10a4 4 0 01-4-4v-3l-1-1c-.5-.5-.5-1.5 0-2s1.5-.5 2 0z" />,
  ),
  // Poison — skull-ish drop with bubbles.
  poison: wrap(
    <g>
      <path d="M12 4c-3 4-5 7-5 10a5 5 0 0010 0c0-3-2-6-5-10z" />
      <circle cx="18" cy="17" r="1.5" />
      <circle cx="5" cy="18" r="1" />
    </g>,
  ),
  // Ground — three stacked layers.
  ground: wrap(
    <g strokeWidth={2}>
      <path d="M3 8c3-2 6-2 9 0s6 2 9 0" fill="none" />
      <path d="M3 13c3-2 6-2 9 0s6 2 9 0" fill="none" />
      <path d="M3 18c3-2 6-2 9 0s6 2 9 0" fill="none" />
    </g>,
  ),
  // Flying — wing.
  flying: wrap(
    <path d="M3 14c4-1 8-3 12-7 1 4 0 8-3 11-3 2-7 2-9-1l-1-1z" />,
  ),
  // Psychic — swirl/eye.
  psychic: wrap(
    <g>
      <ellipse cx="12" cy="12" rx="9" ry="5" fill="none" strokeWidth={2} />
      <circle cx="12" cy="12" r="2.5" />
    </g>,
  ),
  // Bug — antennae + body.
  bug: wrap(
    <g strokeWidth={1.8}>
      <path d="M9 4l2 3M15 4l-2 3" fill="none" />
      <ellipse cx="12" cy="14" rx="5" ry="6" />
      <line x1="12" y1="9" x2="12" y2="20" stroke="hsl(var(--background))" />
    </g>,
  ),
  // Rock — chunky polygon.
  rock: wrap(<path d="M5 17l3-9 5-3 5 4 1 7-4 3H8z" />),
  // Ghost — classic ghost silhouette.
  ghost: wrap(
    <path d="M6 11a6 6 0 0112 0v8l-2-1.5L14 19l-2-1.5L10 19l-2-1.5L6 19z" />,
  ),
  // Dragon — angular D / claw.
  dragon: wrap(
    <path d="M4 6c4 0 8 2 11 5l3-2-1 5-4 1c-2 2-5 3-9 3 2-3 3-6 3-9z" />,
  ),
  // Dark — crescent moon.
  dark: wrap(<path d="M16 3a9 9 0 100 18 7 7 0 010-18z" />),
  // Steel — gear.
  steel: wrap(
    <g>
      <path d="M12 2l1.5 2.5 3-.5.5 3 2.5 1.5-1.5 2.5 1.5 2.5-2.5 1.5-.5 3-3-.5L12 22l-1.5-2.5-3 .5-.5-3L4.5 15.5 6 13l-1.5-2.5L7 9l.5-3 3 .5z" />
      <circle cx="12" cy="12" r="3" fill="hsl(var(--background))" />
    </g>,
  ),
  // Fairy — four-point star/sparkle.
  fairy: wrap(
    <path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />,
  ),
};
