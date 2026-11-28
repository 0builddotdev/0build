export function parseOptions(value: string, forceJson: boolean = false): object | string {
  if (forceJson) {
    if (value.startsWith('{')) {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.error('Error parsing JSON:', value, error);

        return value;
      }
    }

    return value;
  }

  if (value.startsWith('{')) {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('Error parsing JSON:', value, error);

      return {};
    }
  }

  if (value.replace(/\\:/g, '').includes(':')) {
    try {
      const result: Record<string, string> = {};

      const pairs = splitByUnescaped(value.replace(/[;\s]+$/, ''), ';');

      pairs.forEach(pair => {
        const parts = splitByUnescaped(pair.trim(), ':');

        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(':').trim();

          if (key) {
            result[key] = unescape(val);
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Error parsing key-value pairs:', value, error);

      return {};
    }
  }

  return unescape(value);
}

function splitByUnescaped(str: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let i = 0;

  while (i < str.length) {
    if (str[i] === '\\' && i + 1 < str.length && str[i + 1] === delimiter) {
      current += '\\' + delimiter;
      i += 2;
    } else if (str[i] === delimiter) {
      result.push(current);
      current = '';
      i++;
    } else {
      current += str[i];
      i++;
    }
  }

  result.push(current);

  return result;
}

function unescape(str: string): string {
  return str.replace(/\\:/g, ':').replace(/\\;/g, ';');
}

export function parseAttrObject(
  raw: string,
  knownKeys: ReadonlySet<string>,
): Record<string, unknown> | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }

    return null;
  }

  if (trimmed.includes(':')) {
    const parsed = parseOptions(trimmed);

    if (typeof parsed === 'object' && parsed !== null) {
      const keys = Object.keys(parsed);

      if (keys.length > 0 && keys.every(key => knownKeys.has(key))) {
        return parsed as Record<string, unknown>;
      }
    }
  }

  return null;
}
