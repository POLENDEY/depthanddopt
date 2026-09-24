const hits = new Map<string, { count: number; reset: number }>();

export function limit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}
