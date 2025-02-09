export const calculateDiscount = (mrp, sellingPrice) => {
  if (!mrp || !sellingPrice) return 0;
  const discount = ((mrp - sellingPrice) / mrp) * 100;
  return Math.round(discount);
}; 