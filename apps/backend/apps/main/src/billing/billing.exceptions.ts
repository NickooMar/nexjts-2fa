import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 402 Payment Required: the operation is valid but the organization's plan
 * does not allow it. Carries enough context for the client to render an
 * upgrade prompt without another round-trip.
 */
export class PlanLimitExceededException extends HttpException {
  constructor(details: {
    limitKey: string;
    limit?: number;
    current?: number;
    code?: string;
    currentPlan?: string;
    currentPlanName?: string;
    upgradeAvailable?: boolean;
  }) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message: 'plan_limit_reached',
        code: details.code ?? 'PLAN_LIMIT_REACHED',
        ...details,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

/** 402: subscription suspended/expired — every gated write is blocked. */
export class SubscriptionInactiveException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message: 'subscription_inactive',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
