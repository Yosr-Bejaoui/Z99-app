/**
 * Utility functions for AI model display formatting
 */

// Map of model base names to their clean display names (ordered by priority - more specific first)
const MODEL_DISPLAY_NAMES: [string, string][] = [
  ['gpt-4o', 'ChatGPT'],
  ['gpt-4', 'ChatGPT'],
  ['gpt-3.5', 'ChatGPT'],
  ['chatgpt', 'ChatGPT'],
  ['gpt', 'ChatGPT'],
  ['gemini', 'Gemini'],
  ['claude', 'Claude'],
  ['deepseek', 'DeepSeek'],
  ['mistral', 'Mistral'],
  ['llama', 'Llama'],
  ['dall-e', 'DALL·E'],
  ['dalle', 'DALL·E'],
  ['stable-diffusion', 'Stable Diffusion'],
  ['midjourney', 'Midjourney'],
  ['flux', 'Flux'],
  ['leonardo', 'Leonardo'],
  ['wavespeed', 'WaveSpeed'],
  ['fal', 'Fal AI'],
];

/**
 * Removes version numbers and technical suffixes from model names
 * and returns a user-friendly display name with "آخر إصدار" (latest version)
 */
export function formatModelDisplayName(modelName: string, language: string = 'ar'): string {
  if (!modelName) return 'AI';
  
  // Normalize the name for matching
  const normalizedName = modelName.toLowerCase().trim();
  
  // Try to find a matching base name (array is ordered by priority)
  for (const [key, displayName] of MODEL_DISPLAY_NAMES) {
    if (normalizedName.includes(key)) {
      // Return with "latest version" suffix based on language
      const latestSuffix = getLatestVersionSuffix(language);
      return `${displayName} ${latestSuffix}`;
    }
  }
  
  // If no match found, clean up the name and return with suffix
  const cleanedName = cleanModelName(modelName);
  const latestSuffix = getLatestVersionSuffix(language);
  return `${cleanedName} ${latestSuffix}`;
}

/**
 * Gets the "latest version" text in the appropriate language
 */
function getLatestVersionSuffix(language: string): string {
  const suffixes: Record<string, string> = {
    'ar': 'آخر إصدار',
    'en': 'Latest',
    'fr': 'Dernière version',
    'es': 'Última versión',
    'bn': 'সর্বশেষ সংস্করণ',
  };
  return suffixes[language] || suffixes['ar'];
}

/**
 * Cleans up a model name by removing version numbers and technical suffixes
 */
export function cleanModelName(modelName: string): string {
  if (!modelName) return 'AI';
  
  let cleaned = modelName
    // Remove version patterns like -4, -3.5, -4o, -v2, etc.
    .replace(/[-_]?v?\d+(\.\d+)?[a-z]?$/i, '')
    .replace(/[-_]?(turbo|mini|pro|plus|ultra|preview|beta|alpha)$/i, '')
    // Remove common suffixes
    .replace(/[-_]?(latest|stable|base)$/i, '')
    // Clean up any remaining dashes/underscores at the end
    .replace(/[-_]+$/, '')
    .trim();
  
  // Capitalize first letter of each word
  return cleaned
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Gets just the clean model name without the "latest version" suffix
 * Useful for places where you don't want the suffix
 */
export function getCleanModelName(modelName: string): string {
  if (!modelName) return 'AI';
  
  const normalizedName = modelName.toLowerCase().trim();
  
  for (const [key, displayName] of MODEL_DISPLAY_NAMES) {
    if (normalizedName.includes(key)) {
      return displayName;
    }
  }
  
  return cleanModelName(modelName);
}
