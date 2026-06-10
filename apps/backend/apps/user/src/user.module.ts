import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { validationSchema } from 'apps/env.validation';
import { UserService } from './domain/services/user.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserSchema } from './infrastructure/schemas/user.schema';
import { TenantSchema } from './infrastructure/schemas/tenant.schema';
import { UserController } from './app/controller/user.controller';
import { TenantService } from './domain/services/tenant.service';
import { PropertyService } from './domain/services/property.service';
import { MembershipSchema } from './infrastructure/schemas/membership.schema';
import { InvitationSchema } from './infrastructure/schemas/invitation.schema';
import { UserRepository } from './infrastructure/repository/user.repository';
import { TenantController } from './app/controller/tenant.controller';
import { MembershipService } from './domain/services/membership.service';
import { InvitationService } from './domain/services/invitation.service';
import { PropertyController } from './app/controller/property.controller';
import { TenantRepository } from './infrastructure/repository/tenant.repository';
import { MembershipController } from './app/controller/membership.controller';
import { InvitationController } from './app/controller/invitation.controller';
import { PropertyRepository } from './infrastructure/repository/property.repository';
import { MembershipRepository } from './infrastructure/repository/membership.repository';
import { InvitationRepository } from './infrastructure/repository/invitation.repository';
import { TenantConnectionService } from './infrastructure/tenancy/tenant-connection.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGO_URI',
          'mongodb://localhost:27017/property-manager',
        ),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Tenant', schema: TenantSchema },
      { name: 'Membership', schema: MembershipSchema },
      { name: 'Invitation', schema: InvitationSchema },
    ]),
  ],
  controllers: [
    UserController,
    TenantController,
    PropertyController,
    MembershipController,
    InvitationController,
  ],
  providers: [
    UserService,
    UserRepository,
    TenantService,
    TenantRepository,
    PropertyService,
    PropertyRepository,
    MembershipService,
    MembershipRepository,
    InvitationService,
    InvitationRepository,
    TenantConnectionService,
  ],
})
export class UserModule {}
