export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'https://cpsacademy-production.up.railway.app'),
  proxy: true,
  app: {
    keys: env.array('APP_KEYS', [
      'emUoNGkpBV16ukuY1AHXMA==',
      'mgE44A1c3QGdkrP6G0q3UA==',
      'j8kk2EOWOR8Sp36Q2jToyQ==',
      'MQAwvW49G9/7Owu+uoF5eQ=='
    ]),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
