export const PACKAGING_PAISE_PER_ITEM = 500;
export interface Line { pricePaise: number; qty: number; }
/** All money in integer paise. Tax rate is operator-configured (0 until set). */
export function quote(lines: Line[], taxBasisPoints = 0) {
  const subtotal = lines.reduce((s, l) => s + l.pricePaise * l.qty, 0);
  const items = lines.reduce((s, l) => s + l.qty, 0);
  const packaging = items * PACKAGING_PAISE_PER_ITEM;
  const tax = Math.round((subtotal * taxBasisPoints) / 10000);
  return { subtotal, packaging, tax, total: subtotal + packaging + tax, items };
}
