export default function normalizeItemType(itemType: string): string | null {
  const type = itemType.toLowerCase();

  if (type.includes('down'))
    return 'Downpayment';
  if (type.includes('1st'))
    return '1st Quarter';
  if (type.includes('2nd'))
    return '2nd Quarter';
  if (type.includes('3rd'))
    return '3rd Quarter';
  if (type.includes('4th'))
    return '4th Quarter';
  if (type.includes('full'))
    return 'Full Payment';

  return null;
}
