export function safeParseJson(input?: string | null): any {
  if (!input || typeof input !== 'string') return {};

  let text = input.trim();

  // Strip triple backtick code fences, e.g., ```json ... ```
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch && fencedMatch[1]) {
    text = fencedMatch[1].trim();
  }

  // First, try a straightforward parse
  try {
    return JSON.parse(text);
  } catch {}

  // Attempt to extract the first top-level JSON object {...}
  const startIndex = text.indexOf('{');
  if (startIndex === -1) return {};

  let depth = 0;
  let inString = false;
  let endIndex = -1;
  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    const prev = text[i - 1];

    if (char === '"' && prev !== '\\') {
      inString = !inString;
    }

    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') depth--;
      if (depth === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  if (endIndex !== -1) {
    const candidate = text.slice(startIndex, endIndex);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  return {};
}


