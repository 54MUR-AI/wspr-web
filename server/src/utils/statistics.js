/**
 * Calculate statistical measures for an array of numeric values
 * @param {number[]} values Array of numeric values
 * @returns {Object} Object containing min, max, avg, p95, and p99 values
 */
function calculateStatistics(values) {
  if (!values || values.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      p95: 0,
      p99: 0
    };
  }

  // Sort values for percentile calculations
  const sortedValues = [...values].sort((a, b) => a - b);
  
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((sum, val) => sum + val, 0) / values.length,
    p95: calculatePercentile(sortedValues, 95),
    p99: calculatePercentile(sortedValues, 99)
  };
}

/**
 * Calculate a specific percentile from sorted values
 * @param {number[]} sortedValues Sorted array of numeric values
 * @param {number} percentile Percentile to calculate (0-100)
 * @returns {number} The calculated percentile value
 */
function calculatePercentile(sortedValues, percentile) {
  if (!sortedValues || sortedValues.length === 0) {
    return 0;
  }

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) {
    return sortedValues[lower];
  }
  
  const fraction = index - lower;
  return sortedValues[lower] * (1 - fraction) + sortedValues[upper] * fraction;
}

module.exports = {
  calculateStatistics,
  calculatePercentile
};
