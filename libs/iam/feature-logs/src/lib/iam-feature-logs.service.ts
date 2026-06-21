import { Injectable } from '@nestjs/common';
import { IamPrismaService } from '@hellokitty/data-access';

@Injectable()
export class IamFeatureLogsService {
  constructor(private readonly prisma: IamPrismaService) {}

  // ✨ Write a log (We will use this later to track logins/signups)
  async logEvent(tenantId: string, action: string, actor: string, details?: string) {
    return this.prisma.auditLog.create({
      data: { tenantId, action, actor, details },
    });
  }

  // ✨ Fetch all logs for the dashboard
  async getTenantLogs(tenantId: string) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Only fetch the 50 most recent events
    });
  }
}