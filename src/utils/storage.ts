const HIGH_SCORE_KEY = 'space-barrage-high-score';

export const getHighScore = (): number => {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

export const setHighScore = (score: number): void => {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
  } catch {
    console.warn('Failed to save high score to localStorage');
  }
};

export const updateHighScore = (currentScore: number): number => {
  const highScore = getHighScore();
  if (currentScore > highScore) {
    setHighScore(currentScore);
    return currentScore;
  }
  return highScore;
};
