import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  UNLIMITED,
  PlanLimitKeys,
  PlanFeatureKeys,
} from 'apps/constants';
import { PlanRepository } from '../repository/plan.repository';

/**
 * Idempotent plan migration: runs on every boot but only *inserts* missing
 * slugs (`$setOnInsert`), so operator edits made through the API/DB are never
 * overwritten. These seeds are starting data, not hardcoded limits — change
 * plans at runtime via the BILLING_*_PLAN patterns or directly in Mongo.
 */
@Injectable()
export class PlanSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PlanSeedService.name);

  constructor(private readonly planRepository: PlanRepository) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      for (const plan of DEFAULT_PLANS) {
        await this.planRepository.upsertBySlug(plan);
      }
      this.logger.log(`Plan catalog ensured (${DEFAULT_PLANS.length} seeds)`);
    } catch (error) {
      // Seeding must never block the service from starting.
      this.logger.error(`Plan seeding failed: ${error}`);
    }
  }
}

const DEFAULT_PLANS = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Get started managing a handful of properties.',
    prices: {
      monthly: { amount: 0, currency: 'USD' },
      yearly: { amount: 0, currency: 'USD' },
    },
    limits: {
      [PlanLimitKeys.PROPERTIES]: 3,
      [PlanLimitKeys.STORAGE_GB]: 1,
      [PlanLimitKeys.ACTIVE_LISTINGS]: 3,
      [PlanLimitKeys.MEMBERS]: 2,
      [PlanLimitKeys.API_REQUESTS_PER_MONTH]: 10_000,
      [PlanLimitKeys.FILE_UPLOADS_PER_MONTH]: 50,
      [PlanLimitKeys.LEADS_PER_MONTH]: 20,
      [PlanLimitKeys.CUSTOM_DOMAINS]: 0,
      [PlanLimitKeys.INTEGRATIONS]: 0,
    },
    features: {
      [PlanFeatureKeys.CRM]: false,
      [PlanFeatureKeys.ANALYTICS]: false,
      [PlanFeatureKeys.AI_DESCRIPTIONS]: false,
      [PlanFeatureKeys.WHATSAPP_INTEGRATION]: false,
      [PlanFeatureKeys.CUSTOM_BRANDING]: false,
      [PlanFeatureKeys.API_ACCESS]: false,
      [PlanFeatureKeys.PRIORITY_SUPPORT]: false,
    },
    trialDays: 0,
    isPublic: true,
    sortOrder: 0,
  },
  {
    name: 'Starter',
    slug: 'starter',
    description: 'For growing portfolios and small teams.',
    prices: {
      monthly: { amount: 2900, currency: 'USD' },
      yearly: { amount: 29_000, currency: 'USD' },
    },
    limits: {
      [PlanLimitKeys.PROPERTIES]: 25,
      [PlanLimitKeys.STORAGE_GB]: 10,
      [PlanLimitKeys.ACTIVE_LISTINGS]: 25,
      [PlanLimitKeys.MEMBERS]: 5,
      [PlanLimitKeys.API_REQUESTS_PER_MONTH]: 100_000,
      [PlanLimitKeys.FILE_UPLOADS_PER_MONTH]: 500,
      [PlanLimitKeys.LEADS_PER_MONTH]: 200,
      [PlanLimitKeys.CUSTOM_DOMAINS]: 1,
      [PlanLimitKeys.INTEGRATIONS]: 2,
    },
    features: {
      [PlanFeatureKeys.CRM]: true,
      [PlanFeatureKeys.ANALYTICS]: true,
      [PlanFeatureKeys.AI_DESCRIPTIONS]: false,
      [PlanFeatureKeys.WHATSAPP_INTEGRATION]: false,
      [PlanFeatureKeys.CUSTOM_BRANDING]: false,
      [PlanFeatureKeys.API_ACCESS]: true,
      [PlanFeatureKeys.PRIORITY_SUPPORT]: false,
    },
    trialDays: 14,
    isPublic: true,
    sortOrder: 1,
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'Full toolkit for professional property managers.',
    prices: {
      monthly: { amount: 7900, currency: 'USD' },
      yearly: { amount: 79_000, currency: 'USD' },
    },
    limits: {
      [PlanLimitKeys.PROPERTIES]: 200,
      [PlanLimitKeys.STORAGE_GB]: 100,
      [PlanLimitKeys.ACTIVE_LISTINGS]: 200,
      [PlanLimitKeys.MEMBERS]: 20,
      [PlanLimitKeys.API_REQUESTS_PER_MONTH]: 1_000_000,
      [PlanLimitKeys.FILE_UPLOADS_PER_MONTH]: 5_000,
      [PlanLimitKeys.LEADS_PER_MONTH]: 2_000,
      [PlanLimitKeys.CUSTOM_DOMAINS]: 3,
      [PlanLimitKeys.INTEGRATIONS]: 10,
    },
    features: {
      [PlanFeatureKeys.CRM]: true,
      [PlanFeatureKeys.ANALYTICS]: true,
      [PlanFeatureKeys.AI_DESCRIPTIONS]: true,
      [PlanFeatureKeys.WHATSAPP_INTEGRATION]: true,
      [PlanFeatureKeys.CUSTOM_BRANDING]: true,
      [PlanFeatureKeys.API_ACCESS]: true,
      [PlanFeatureKeys.PRIORITY_SUPPORT]: false,
    },
    trialDays: 14,
    isPublic: true,
    sortOrder: 2,
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Unlimited scale with priority support.',
    prices: {
      monthly: { amount: 19_900, currency: 'USD' },
      yearly: { amount: 199_000, currency: 'USD' },
    },
    limits: {
      [PlanLimitKeys.PROPERTIES]: UNLIMITED,
      [PlanLimitKeys.STORAGE_GB]: 1_000,
      [PlanLimitKeys.ACTIVE_LISTINGS]: UNLIMITED,
      [PlanLimitKeys.MEMBERS]: UNLIMITED,
      [PlanLimitKeys.API_REQUESTS_PER_MONTH]: UNLIMITED,
      [PlanLimitKeys.FILE_UPLOADS_PER_MONTH]: UNLIMITED,
      [PlanLimitKeys.LEADS_PER_MONTH]: UNLIMITED,
      [PlanLimitKeys.CUSTOM_DOMAINS]: 10,
      [PlanLimitKeys.INTEGRATIONS]: UNLIMITED,
    },
    features: {
      [PlanFeatureKeys.CRM]: true,
      [PlanFeatureKeys.ANALYTICS]: true,
      [PlanFeatureKeys.AI_DESCRIPTIONS]: true,
      [PlanFeatureKeys.WHATSAPP_INTEGRATION]: true,
      [PlanFeatureKeys.CUSTOM_BRANDING]: true,
      [PlanFeatureKeys.API_ACCESS]: true,
      [PlanFeatureKeys.PRIORITY_SUPPORT]: true,
    },
    trialDays: 14,
    isPublic: true,
    sortOrder: 3,
  },
];
