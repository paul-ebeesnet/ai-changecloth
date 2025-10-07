// 固定背景圖片
export const FIXED_BACKGROUND = '/img/bg.jpg';

// 固定框架圖片
export const FIXED_FRAME = '/img/frame1.png';

// 隨機圖案選項
export const COSTUME_PATTERN_IMAGES = [
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

// 獲取隨機圖案的函數
export const getRandomPattern = (): string => {
  const randomIndex = Math.floor(Math.random() * COSTUME_PATTERN_IMAGES.length);
  return COSTUME_PATTERN_IMAGES[randomIndex];
};