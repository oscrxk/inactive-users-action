const { throttling } = require('@octokit/plugin-throttling'),
      { retry } = require('@octokit/plugin-retry'),
      { Octokit } = require('@octokit/rest');

const RetryThrottlingOctokit = Octokit.plugin(throttling, retry);

// Permite configurar baseUrl para GitHub Enterprise Server (GHES)
module.exports.create = (token, maxRetries, baseUrl) => {
  const MAX_RETRIES = maxRetries || 3;

  const octokit = new RetryThrottlingOctokit({
    auth: `token ${token}`,
    baseUrl: baseUrl || 'https://api.github.com', // Usa GitHub público por defecto

    throttle: {
      onRateLimit: (retryAfter, options) => {
        octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
        octokit.log.warn(`  request retries: ${options.request.retryCount}, MAX: ${MAX_RETRIES}`);

        if (options.request.retryCount < MAX_RETRIES) {
          octokit.log.warn(`Retrying after ${retryAfter} seconds.`);
          return true;
        }
      },

      onAbuseLimit: (retryAfter, options) => {
        octokit.log.warn(`Abuse detection triggered for request ${options.method} ${options.url}`);
        return false;
      }
    }
  });

  return octokit;
}
