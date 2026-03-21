/** Generate a scannable SKU code: PREFIX + timestamp-based unique digits */
export function generateSKU(prefix = "PRD"): string {
  const ts = Date.now().toString(36).toUpperCase(); // base-36 timestamp
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}-${ts}-${rand}`;
}
