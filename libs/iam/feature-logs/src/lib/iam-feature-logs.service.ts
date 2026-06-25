import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter'; // ✨ Import this
import { IamPrismaService } from '@hellokitty/data-access';

@Injectable()
export class IamFeatureLogsService {
  constructor(private readonly prisma: IamPrismaService) {}

  // ✨ This method now automatically triggers whenever ANY file emits an 'audit.*' event!
  // ✨ 1. The Event Bus Listener (Automatically catches events from other modules)
  @OnEvent('audit.*')
  async handleAuditLog(event: { tenantId: string; action: string; actor: string; details: string }) {
    await this.logEvent(event.tenantId, event.action, event.actor, event.details);
  }

  // ✨ 2. The Direct Writer (Used by the controller for manual test events)
  async logEvent(tenantId: string, action: string, actor: string, details?: string) {
    return this.prisma.auditLog.create({
      data: { tenantId, action, actor, details },
    });
  }

  // ✨ 3. The Fetcher (Used by the React Dashboard to display the table)
  async getTenantLogs(tenantId: string) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Only fetch the 50 most recent events
    });
  }
}