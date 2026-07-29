const USD_PER_CREDIT = 0.01;
const OPUS_SPEC_COST_USD = 0.018;
const IMAGE_RENDER_COST_USD = 0.045;
const STANDARD_JOB_IMAGE_COUNT = 4;

export function getUsdPerCredit() {
  return USD_PER_CREDIT;
}

export function estimateJobCostUsd(imageCount: number) {
  const safeCount = Math.min(Math.max(imageCount, 1), 10);
  return safeCount * OPUS_SPEC_COST_USD + safeCount * IMAGE_RENDER_COST_USD;
}

export function usdToCredits(costUsd: number) {
  return Math.max(1, Math.ceil(costUsd / USD_PER_CREDIT));
}

export function estimateCreditsForGenerationCount(imageCount: number) {
  return usdToCredits(estimateJobCostUsd(imageCount));
}

export function estimateStandardJobCredits() {
  return estimateCreditsForGenerationCount(STANDARD_JOB_IMAGE_COUNT);
}

export function estimateStandardJobsFromCredits(credits: number) {
  return Math.max(0, Math.floor(credits / estimateStandardJobCredits()));
}

export function formatUsd(value: number) {
  return Number(value.toFixed(4));
}
