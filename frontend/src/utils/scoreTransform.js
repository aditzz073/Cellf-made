export function transformScore(rawScore) {
  let score = Number(rawScore);

  if (!Number.isFinite(score)) {
    return 0;
  }

  if (score < 0.73) {
    score = score - 0.30;
  }

  return Math.max(score, 0);
}
