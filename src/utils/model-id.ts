export function getModelId(model: string | undefined, fallback = 'gpt-4o'): string {
  if (!model) return fallback;
  const idx = model.indexOf('/');
  return idx >= 0 ? model.slice(idx + 1) : model;
}
