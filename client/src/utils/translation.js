// Translation utility for automatic language translation
// Using Google Translate's free web interface

// Language codes mapping
const LANGUAGE_CODES = {
  en: 'en',
  ms: 'ms', // Bahasa Malaysia
  zh: 'zh'  // Chinese (Simplified)
};

// Cache for translations to avoid repeated API calls
const translationCache = new Map();

/**
 * Translate text using Google Translate's free web interface
 * @param {string} text - Text to translate
 * @param {string} from - Source language code
 * @param {string} to - Target language code
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, from = 'en', to = 'ms') => {
  if (!text || text.trim() === '') {
    return '';
  }

  // Check cache first
  const cacheKey = `${text}-${from}-${to}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    // Use Google Translate's free web interface
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodedText}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data[0]?.[0]?.[0] || text;

    // Cache the result
    translationCache.set(cacheKey, translatedText);
    
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text if translation fails
    return text;
  }
};

/**
 * Translate service data from English to other languages
 * @param {Object} serviceData - Service data with English content
 * @returns {Promise<Object>} - Service data with all languages
 */
export const translateServiceData = async (serviceData) => {
  const { name, description } = serviceData;
  
  try {
    // Translate name and description to Bahasa Malaysia and Chinese
    const [nameMs, nameZh, descMs, descZh] = await Promise.all([
      translateText(name?.en || name, 'en', 'ms'),
      translateText(name?.en || name, 'en', 'zh'),
      translateText(description?.en || description, 'en', 'ms'),
      translateText(description?.en || description, 'en', 'zh')
    ]);

    return {
      ...serviceData,
      name: {
        en: name?.en || name,
        ms: nameMs,
        zh: nameZh
      },
      description: {
        en: description?.en || description,
        ms: descMs,
        zh: descZh
      }
    };
  } catch (error) {
    console.error('Service translation error:', error);
    return serviceData;
  }
};

/**
 * Translate text with fallback to original if translation fails
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @returns {Promise<string>} - Translated text or original if failed
 */
export const translateWithFallback = async (text, targetLang) => {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    const translated = await translateText(text, 'en', targetLang);
    return translated || text;
  } catch (error) {
    console.error('Translation fallback error:', error);
    return text;
  }
};

const translationUtils = {
  translateText,
  translateServiceData,
  translateWithFallback,
  LANGUAGE_CODES
};

export default translationUtils;
