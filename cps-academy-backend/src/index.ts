import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    // Force app to trust proxy
    strapi.server.app.proxy = true;
  },

  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Log that we're in proxy mode
    if (process.env.NODE_ENV === 'production') {
      strapi.log.info(' Railway production mode - proxy enabled');
    }
  },
};
