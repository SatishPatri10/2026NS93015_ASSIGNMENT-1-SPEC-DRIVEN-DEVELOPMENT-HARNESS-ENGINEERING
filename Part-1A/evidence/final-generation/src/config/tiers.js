/**
 * Tier configurations and API key definitions.
 */
const TIERS = {
  free: {
    name: 'free',
    windowMs: 60 * 1000,
    burst: 5,
    allowancePerMinute: 10,
    refillRate: 10 / 60 // 0.16667 tokens per second
  },
  standard: {
    name: 'standard',
    windowMs: 60 * 1000,
    burst: 15,
    allowancePerMinute: 60,
    refillRate: 60 / 60 // 1.0 token per second
  },
  premium: {
    name: 'premium',
    windowMs: 60 * 1000,
    burst: 50,
    allowancePerMinute: 300,
    refillRate: 300 / 60 // 5.0 tokens per second
  }
};

const VALID_API_KEYS = {
  'std-key-123': 'standard',
  'std-key-prod': 'standard',
  'prem-key-999': 'premium',
  'prem-key-prod': 'premium'
};

function resolveTierByKey(apiKey) {
  if (!apiKey) {
    return TIERS.free;
  }

  // Exact registered key match
  if (VALID_API_KEYS[apiKey]) {
    return TIERS[VALID_API_KEYS[apiKey]];
  }

  // Prefix conventions
  if (apiKey.startsWith('std-key-')) {
    return TIERS.standard;
  }
  if (apiKey.startsWith('prem-key-')) {
    return TIERS.premium;
  }

  // Invalid key pattern
  return null;
}

module.exports = {
  TIERS,
  VALID_API_KEYS,
  resolveTierByKey
};
