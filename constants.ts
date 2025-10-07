// 固定背景圖片
export const FIXED_BACKGROUND = '/img/bg.jpg';

// 固定框架圖片
export const FIXED_FRAME = '/img/frame1.png';

// 隨機圖案選項 - will be loaded from localStorage or defaults
let CUSTOM_PATTERNS: string[] = [];

// Load custom patterns from localStorage or use defaults
try {
  const savedPatterns = localStorage.getItem('customPatterns');
  if (savedPatterns) {
    const patterns = JSON.parse(savedPatterns);
    CUSTOM_PATTERNS = patterns.map((p: any) => p.url);
  } else {
    // Default patterns
    CUSTOM_PATTERNS = [
      '/img/pattern1.png',
      '/img/pattern2.png',
      '/img/pattern3.png',
      '/img/pattern4.png',
      '/img/pattern5.png',
      '/img/pattern6.png',
      '/img/pattern7.png',
      '/img/pattern8.png',
      '/img/pattern9.png',
      '/img/pattern10.png',
    ];
  }
} catch (e) {
  // Fallback to default patterns if there's an error
  CUSTOM_PATTERNS = [
    '/img/pattern1.png',
    '/img/pattern2.png',
    '/img/pattern3.png',
    '/img/pattern4.png',
    '/img/pattern5.png',
    '/img/pattern6.png',
    '/img/pattern7.png',
    '/img/pattern8.png',
    '/img/pattern9.png',
    '/img/pattern10.png',
  ];
}

// Export the patterns
export const COSTUME_PATTERN_IMAGES = CUSTOM_PATTERNS;

// 獲取隨機圖案的函數
export const getRandomPattern = (): string => {
  // Refresh patterns from localStorage if available
  try {
    const savedPatterns = localStorage.getItem('customPatterns');
    if (savedPatterns) {
      const patterns = JSON.parse(savedPatterns);
      const patternUrls = patterns.map((p: any) => p.url);
      const randomIndex = Math.floor(Math.random() * patternUrls.length);
      return patternUrls[randomIndex];
    }
  } catch (e) {
    console.warn('Failed to load custom patterns from localStorage', e);
  }
  
  // Fallback to default patterns
  const randomIndex = Math.floor(Math.random() * CUSTOM_PATTERNS.length);
  return CUSTOM_PATTERNS[randomIndex];
};