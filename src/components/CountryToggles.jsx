/**
 * CountryToggles — reusable multi-select toggle button group.
 *
 * Props:
 *   countries  – string[]           Full list of available countries
 *   selected   – string[]           Currently selected countries
 *   onToggle   – (country) => void  Called when a button is clicked
 *   palette    – string[]           Color array (Okabe-Ito country palette)
 */
export function CountryToggles({ countries, selected, onToggle, palette }) {
  return (
    <div className="country-toggles">
      {countries.map((c) => {
        const idx = selected.indexOf(c);
        const isActive = idx !== -1;
        const color = isActive ? palette[idx % palette.length] : undefined;

        return (
          <button
            key={c}
            className={`toggle-btn${isActive ? " active" : ""}`}
            style={isActive ? { borderColor: color } : {}}
            onClick={() => onToggle(c)}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
