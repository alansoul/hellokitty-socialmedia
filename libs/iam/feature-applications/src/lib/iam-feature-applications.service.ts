import { Injectable } from '@nestjs/common';
import { IamPrismaService } from '@hellokitty/data-access';
import * as crypto from 'crypto';

@Injectable()
export class IamFeatureApplicationsService {
  constructor(private readonly prisma: IamPrismaService) {}

  // ✨ Helper to generate secure random strings like "client_abc123..."
  private generateSecureId(prefix: string, length = 32): string {
    return `${prefix}_${crypto.randomBytes(length).toString('hex').slice(0, length)}`;
  }

  async createApplication(
    tenantId: string,
    name: string,
    type: 'SPA' | 'WEB' | 'M2M',
  ) {
    const clientId = this.generateSecureId('hk'); // Example: hk_a7b8c9...

    // SPAs (React/Next) don't get secrets because they can't hide them!
    // Web (Node) and M2M (Servers) get secure secrets.
    const clientSecret =
      type === 'SPA' ? null : this.generateSecureId('sec', 64);

    const app = await this.prisma.application.create({
      data: {
        tenantId,
        name,
        type,
        clientId,
        clientSecret,
        authMethod: type === 'SPA' ? 'none' : 'client_secret_post',
        pkceRequired: type === 'SPA' ? true : false,
      },
    });

    return app;
  }

  async getApplicationsByTenant(tenantId: string) {
    return this.prisma.application.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
