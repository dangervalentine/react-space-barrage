import rocketSvg from '../Assets/rocket.svg';
import fireSvg from '../Assets/fire.svg';
import enemy1Svg from '../Assets/enemy1.svg';
import enemy2Svg from '../Assets/enemy2.svg';
import enemy3Svg from '../Assets/enemy3.svg';
import shieldSvg from '../Assets/shield.svg';
import fontPath from '../Assets/PressStart2P-Regular.ttf';

export interface GameAssets {
  rocket: HTMLImageElement;
  fire: HTMLImageElement;
  enemies: [HTMLImageElement, HTMLImageElement, HTMLImageElement];
  shield: HTMLImageElement;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function loadFont(): Promise<void> {
  try {
    console.log('loadFont: attempting to load from', fontPath);
    const face = new FontFace(
      'PressStart2P',
      `url('${fontPath}')`
    );
    document.fonts.add(face);
    await Promise.race([
      face.load(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Font load timeout')), 5000))
    ]);
    console.log('loadFont: font loaded successfully');
  } catch (error) {
    console.warn('loadFont: failed to load custom font, will use fallback:', error);
    // Don't throw - we can use a fallback monospace font
  }
}

export async function loadAssets(): Promise<GameAssets> {
  try {
    console.log('Loading assets...');

    // Load font in parallel, but don't block on failure
    const fontPromise = loadFont().catch(err => {
      console.warn('Font load failed, continuing anyway:', err);
    });

    const [rocket, fire, enemy1, enemy2, enemy3, shield] = await Promise.all([
      loadImage(rocketSvg),
      loadImage(fireSvg),
      loadImage(enemy1Svg),
      loadImage(enemy2Svg),
      loadImage(enemy3Svg),
      loadImage(shieldSvg),
    ]);

    await fontPromise;

    console.log('All assets loaded successfully');

    return {
      rocket,
      fire,
      enemies: [enemy1, enemy2, enemy3],
      shield,
    };
  } catch (error) {
    console.error('Failed to load game assets:', error);
    throw error;
  }
}
