import fontPath from '../Assets/PressStart2P-Regular.ttf';

export async function loadFont(): Promise<void> {
  try {
    const face = new FontFace('PressStart2P', `url('${fontPath}')`);
    document.fonts.add(face);
    await Promise.race([
      face.load(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Font load timeout')), 5000)),
    ]);
  } catch (error) {
    console.warn('loadFont: failed to load custom font, will use fallback:', error);
  }
}
