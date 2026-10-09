// Brand palette, measured directly from the supplied logo file
// (see tools/extract_logo_layers.py). Everything else in the film is a
// tint or shade of these four colours — no new hues.
export const BRAND = {
  navy: '#071B39',
  blue: '#2BBBED',
  orange: '#FF7A1B',
  white: '#FFFFFF',
};

// Shades and tints derived from the brand hues.
export const TONE = {
  void: '#010610',      // navy pushed toward black: the film's ground
  abyss: '#030C1D',
  navyLift: '#0C2A55',  // navy, lighter: glass panels
  navyLine: '#1B3F72',
  blueDeep: '#1592C9',  // brand blue, darker: kid screen gradient floor
  blueMist: '#E6F6FD',  // brand blue, near-white tint: answer chips
  orangeMist: '#FFF1E6',
  ink: '#071B39',
  mute: '#8DA2C0',      // navy-tinted grey for secondary UI copy
};

export const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
