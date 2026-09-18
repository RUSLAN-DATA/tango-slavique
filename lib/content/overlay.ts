export function applyContentOverrides<T>(source: T, overrides: Record<string, string>): T {
  const clone = JSON.parse(JSON.stringify(source)) as T;
  for (const [path, value] of Object.entries(overrides)) {
    if (!value) continue;
    setByPath(clone as Record<string, unknown>, path, value);
  }
  return clone;
}

export function getByPath(source: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = source;
  for (const part of parts) {
    if (current == null) {
      return undefined;
    }
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index)) {
        return undefined;
      }
      current = current[index];
      continue;
    }
    if (typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

function setByPath(root: Record<string, unknown>, path: string, value: string) {
  const parts = path.split(".");
  let current: unknown = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    if (current == null || typeof current !== "object") {
      return;
    }
    const record = current as Record<string, unknown>;
    if (Array.isArray(current)) {
      const index = Number(key);
      if (!Number.isInteger(index) || !current[index]) {
        return;
      }
      current = current[index];
      continue;
    }
    if (record[key] == null) {
      record[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    current = record[key];
  }
  const last = parts[parts.length - 1];
  if (Array.isArray(current)) {
    const index = Number(last);
    if (Number.isInteger(index) && current[index] !== undefined && typeof current[index] !== "object") {
      current[index] = value;
    }
    return;
  }
  if (current && typeof current === "object") {
    (current as Record<string, unknown>)[last] = value;
  }
}
