/* A utility property to retrieve the value of a CSS custom property (CSS variable) */
export function cssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
