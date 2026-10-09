// Colours. Brand values come from the official logo file; app values are
// sampled from the real Kizzo screenshots (assets/screens/*.jpg) so every
// graphic sits in the same world as the interface it frames.
export const BRAND = {
  navy: '#071B39',
  cyan: '#2BBBED',
  orange: '#FF7A1B',
  white: '#FFFFFF',
};

export const APP = {
  skyTop: '#ABD9E6',   // screen background, top
  sand: '#DADBD3',     // screen background, middle
  peach: '#F6C8AE',    // screen background, bottom
  teal: '#45A4B8',     // primary buttons
  cta: '#EE6A2C',      // orange call-to-action
  ink: '#0C2937',      // titles
  mint: '#E3F2ED',     // correct-answer fill
  cream: '#FFFCF7',
};

export const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
