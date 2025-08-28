import { PrismaClient } from '@prisma/client'

declare module '@prisma/client' {
  export interface PrismaClient {
    passwordReset: {
      create: (args: {
        data: {
          token: string;
          userId: string;
          expiresAt: Date;
        };
      }) => Promise<any>;
      findFirst: (args: {
        where: {
          token: string;
          used: boolean;
          expiresAt: { gt: Date };
        };
        include?: { user: boolean };
      }) => Promise<any>;
      update: (args: {
        where: { id: string };
        data: { used: boolean };
      }) => Promise<any>;
    };
  }
}
