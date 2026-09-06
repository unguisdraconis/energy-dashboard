/**
 * CountryToggles — reusable multi-select toggle button group.
 *
 * Props:
 *   countries  – string[]           Full list of available countries
 *   selected   – string[]           Currently selected countries
 *   onToggle   – (country) => void  Called when a button is clicked
 *   palette    – string[]           Color array (Okabe-Ito country palette)
 */
import { motion, useReducedMotion } from "motion/react";

export function CountryToggles({ countries, selected, onToggle, palette }) {
  const prefersReducedMotion = useReducedMotion();
  const buttonTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: "easeOut" };

  return (
    <div
      className="country-toggles"
      role="group"
      aria-label="Countries included in the comparison"
    >
      {countries.map((c) => {
        const idx = selected.indexOf(c);
        const isActive = idx !== -1;
        const color = isActive ? palette[idx % palette.length] : undefined;

        return (
          <motion.button
            key={c}
            type="button"
            className={`toggle-btn${isActive ? " active" : ""}`}
            style={isActive ? { borderColor: color } : {}}
            onClick={() => onToggle(c)}
            aria-pressed={isActive}
            whileHover={
              isActive ? undefined : { scale: prefersReducedMotion ? 1 : 1.02 }
            }
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            transition={buttonTransition}
          >
            {c}
          </motion.button>
        );
      })}
    </div>
  );
}
