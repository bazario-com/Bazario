export default () => ({
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  COOKIE_SECRET: process.env.COOKIE_SECRET ?? 'dev_only_change_me',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev_only_change_me_access',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev_only_change_me_refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },
  courier: {
    leopards: {
      apiKey: process.env.LEOPARDS_API_KEY ?? '',
      apiPassword: process.env.LEOPARDS_API_PASSWORD ?? '',
      baseUrl: process.env.LEOPARDS_BASE_URL ?? 'https://merchantapi.leopardscourier.com/api',
      bookingCode: process.env.LEOPARDS_BOOKING_CODE ?? '',
    },
  },
});
