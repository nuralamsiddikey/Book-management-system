function isDateLike(str: string): boolean {
  const s = str.trim();
  // Matches YYYY, YYYY-MM, YYYY-MM-DD
  if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(s)) return true;
  // Also accept any parseable date (ISO with time, etc.)
  const parsed = Date.parse(s);
  return !isNaN(parsed);
}

export function buildFilterFromQuery(
  query: Record<string, any>,
): Record<string, any> {
  const filter: Record<string, any> = {};
  const ignoreFields = ['page', 'limit', 'sort', 'order'];

  for (const [key, value] of Object.entries(query)) {
    if (ignoreFields.includes(key)) continue;
    if (value === undefined || value === null || value === '') continue;

    // Handle *_id or *Id as Mongo references
    if (key.toLowerCase().endsWith('id')) {
      filter[key.replace(/id$/i, '')] = value;
    }
    // Handle date-like fields
    else if (/\bdate\b/i.test(key)) {
      filter[key] = value;
    }
    // Handle text fields
    else if (typeof value === 'string') {
      if (isDateLike(value)) {
        filter[key] = new Date(value);
        continue;
      }
      filter[key] = { $regex: value.trim(), $options: 'i' };
    }
    // Fallback
    else {
      filter[key] = value;
    }
  }

  // If no filters found → return empty object (fetch all)
  return Object.keys(filter).length > 0 ? filter : {};
}
