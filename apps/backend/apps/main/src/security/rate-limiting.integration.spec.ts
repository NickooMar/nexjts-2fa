import * as request from 'supertest';
import RedisMock from 'ioredis-mock';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SecurityModule } from './security.module';
import { SECURITY_REDIS } from './redis.module';
import { AppController } from '../app.controller';

@Controller()
class PingController {
  @Get('ping')
  ping() {
    return { pong: true };
  }

  @Get('pong')
  pong() {
    return { ping: true };
  }
}

const JWT_SECRET = 'integration-test-secret';

describe('Rate limiting (HTTP integration)', () => {
  let app: INestApplication;
  let redis: InstanceType<typeof RedisMock>;
  const env = process.env;

  beforeAll(async () => {
    process.env = {
      ...env,
      JWT_SECRET,
      RATE_LIMIT_ENABLED: 'true',
      // Generous defaults; individual tests tighten via env (resolved per request).
      RATE_LIMIT_IP_LIMIT: '1000',
      RATE_LIMIT_IDENTITY_LIMIT: '1000',
    };

    redis = new RedisMock();
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        SecurityModule,
      ],
      controllers: [PingController, AppController],
    })
      .overrideProvider(SECURITY_REDIS)
      .useValue(redis)
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    (app as NestExpressApplication).set('trust proxy', 1);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env = env;
  });

  beforeEach(async () => {
    await redis.flushall();
    process.env.RATE_LIMIT_IP_LIMIT = '1000';
    process.env.RATE_LIMIT_IDENTITY_LIMIT = '1000';
  });

  const fromIp = (ip: string) =>
    request(app.getHttpServer()).get('/ping').set('X-Forwarded-For', ip);

  it('serves traffic under the limit with rate-limit headers', async () => {
    const res = await fromIp('203.0.113.1').expect(200);
    expect(res.headers['x-ratelimit-limit-ip']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining-ip']).toBeDefined();
  });

  it('returns a standardized 429 once the per-IP ceiling is hit', async () => {
    process.env.RATE_LIMIT_IP_LIMIT = '3';

    for (let i = 0; i < 3; i++) await fromIp('203.0.113.2').expect(200);
    const res = await fromIp('203.0.113.2').expect(429);

    expect(res.body).toMatchObject({
      statusCode: 429,
      error: 'Too Many Requests',
      code: 'rate_limit_exceeded',
    });
    expect(res.body.retryAfterSeconds).toBeGreaterThan(0);
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('shares the IP ceiling across routes (global bucket)', async () => {
    process.env.RATE_LIMIT_IP_LIMIT = '3';

    await fromIp('203.0.113.3').expect(200);
    await request(app.getHttpServer())
      .get('/pong')
      .set('X-Forwarded-For', '203.0.113.3')
      .expect(200);
    await fromIp('203.0.113.3').expect(200);
    await request(app.getHttpServer())
      .get('/pong')
      .set('X-Forwarded-For', '203.0.113.3')
      .expect(429);
  });

  it('keys anonymous clients by their real (X-Forwarded-For) IP', async () => {
    process.env.RATE_LIMIT_IP_LIMIT = '2';

    await fromIp('203.0.113.4').expect(200);
    await fromIp('203.0.113.4').expect(200);
    await fromIp('203.0.113.4').expect(429);
    // A different client is unaffected.
    await fromIp('203.0.113.5').expect(200);
  });

  it('keys authenticated traffic per user, not per IP', async () => {
    process.env.RATE_LIMIT_IDENTITY_LIMIT = '2';
    const jwt = new JwtService({ secret: JWT_SECRET });
    const alice = jwt.sign({ sub: 'alice' });
    const bob = jwt.sign({ sub: 'bob' });

    // Same IP: alice exhausts her budget, bob still gets through.
    await fromIp('203.0.113.6')
      .set('Authorization', `Bearer ${alice}`)
      .expect(200);
    await fromIp('203.0.113.6')
      .set('Authorization', `Bearer ${alice}`)
      .expect(200);
    await fromIp('203.0.113.6')
      .set('Authorization', `Bearer ${alice}`)
      .expect(429);
    await fromIp('203.0.113.6')
      .set('Authorization', `Bearer ${bob}`)
      .expect(200);
  });

  it('ignores forged/unverifiable JWTs for limit keying', async () => {
    process.env.RATE_LIMIT_IDENTITY_LIMIT = '2';
    const forged = new JwtService({ secret: 'wrong-secret' }).sign({
      sub: 'x',
    });

    await fromIp('203.0.113.7')
      .set('Authorization', `Bearer ${forged}`)
      .expect(200);
    await fromIp('203.0.113.7')
      .set('Authorization', `Bearer ${forged}`)
      .expect(200);
    // Falls back to IP keying, so the same IP is throttled regardless of sub.
    const evade = new JwtService({ secret: 'wrong-secret' }).sign({ sub: 'y' });
    await fromIp('203.0.113.7')
      .set('Authorization', `Bearer ${evade}`)
      .expect(429);
  });

  it('never throttles the load balancer health check', async () => {
    process.env.RATE_LIMIT_IP_LIMIT = '1';
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .get('/api/health')
        .set('X-Forwarded-For', '203.0.113.8')
        .expect(200);
    }
  });

  it('can be disabled globally via RATE_LIMIT_ENABLED', async () => {
    process.env.RATE_LIMIT_IP_LIMIT = '1';
    process.env.RATE_LIMIT_ENABLED = 'false';
    for (let i = 0; i < 5; i++) await fromIp('203.0.113.9').expect(200);
    process.env.RATE_LIMIT_ENABLED = 'true';
  });
});
