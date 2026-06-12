import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { BillingEventPatterns } from 'apps/constants';
import {
  UsageEvent,
  UsageService,
} from '../../domain/services/usage.service';

/**
 * Asynchronous intake for domain events (`client.emit` from the gateway —
 * no response, no coupling). Each handler is idempotent via the eventId
 * dedup ledger, and failures only log: usage counters are reconciled by
 * SYNC_USAGE, so a dropped event never corrupts billing state.
 */
@Controller()
export class UsageEventsController {
  private readonly logger = new Logger(UsageEventsController.name);

  constructor(private readonly usageService: UsageService) {}

  @EventPattern(BillingEventPatterns.ORGANIZATION_CREATED)
  onOrganizationCreated(event: UsageEvent) {
    return this.handle(BillingEventPatterns.ORGANIZATION_CREATED, event);
  }

  @EventPattern(BillingEventPatterns.PROPERTY_CREATED)
  onPropertyCreated(event: UsageEvent) {
    return this.handle(BillingEventPatterns.PROPERTY_CREATED, event);
  }

  @EventPattern(BillingEventPatterns.PROPERTY_DELETED)
  onPropertyDeleted(event: UsageEvent) {
    return this.handle(BillingEventPatterns.PROPERTY_DELETED, event);
  }

  @EventPattern(BillingEventPatterns.MEMBER_ADDED)
  onMemberAdded(event: UsageEvent) {
    return this.handle(BillingEventPatterns.MEMBER_ADDED, event);
  }

  @EventPattern(BillingEventPatterns.MEMBER_REMOVED)
  onMemberRemoved(event: UsageEvent) {
    return this.handle(BillingEventPatterns.MEMBER_REMOVED, event);
  }

  @EventPattern(BillingEventPatterns.FILE_UPLOADED)
  onFileUploaded(event: UsageEvent) {
    return this.handle(BillingEventPatterns.FILE_UPLOADED, event);
  }

  @EventPattern(BillingEventPatterns.FILE_DELETED)
  onFileDeleted(event: UsageEvent) {
    return this.handle(BillingEventPatterns.FILE_DELETED, event);
  }

  @EventPattern(BillingEventPatterns.API_USAGE)
  onApiUsage(event: UsageEvent) {
    return this.handle(BillingEventPatterns.API_USAGE, event);
  }

  @EventPattern(BillingEventPatterns.LEAD_CAPTURED)
  onLeadCaptured(event: UsageEvent) {
    return this.handle(BillingEventPatterns.LEAD_CAPTURED, event);
  }

  private async handle(pattern: string, event: UsageEvent): Promise<void> {
    try {
      await this.usageService.recordEvent(pattern, event);
    } catch (error) {
      this.logger.error(`Failed to apply ${pattern}: ${error}`);
    }
  }
}
