export const config = {
  port: Number(process.env.PORT || 3001),
  nuvio: {
    baseUrl: process.env.NUVIO_API_URL || 'https://api.nuvio.tv',
    publishableKey:
      process.env.NUVIO_PUBLISHABLE_KEY ||
      'sb_publishable_1Clq8rlTVACkdcZuqr6_AD__xUUC_EN',
  },
}
