// @ts-nocheck
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin'

export default {
  webpack: (config: any, { isServer }: any) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};