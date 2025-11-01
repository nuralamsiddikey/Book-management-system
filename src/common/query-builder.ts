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
