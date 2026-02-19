export function nowIso(clock = () => new Date()) {
  return clock().toISOString();
}

export function asDate(value) {
  if (value instanceof Date) {
    return value;
  }

  return new Date(value);
}
