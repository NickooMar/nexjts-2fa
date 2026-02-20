import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // next-intl's plugin detects its own bundled Next.js 15.0.3 instead of
      // the project's Next.js 16, so it sets experimental.turbo.resolveAlias
      // (pre-15.3 key) rather than the stable turbopack.resolveAlias (15.3+).
      // This manual entry ensures the alias is applied under Next.js 16.
      'next-intl/config': './src/i18n/request.ts',
    },
  },
};

export default withNextIntl(nextConfig);
