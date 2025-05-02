import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

import { of, throwError } from 'rxjs';
import { faker } from '@faker-js/faker';
import { AuthController } from './auth.controller';
import { RpcException } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { SignupRequestDto } from 'libs/shared/dto/auth/signup.dto';
import { AuthProxy } from 'apps/auth/src/infrastructure/external/auth.proxy';

describe('Main AuthController', () => {
  let controller: AuthController;
  let authProxy: AuthProxy;

  const mockAuthProxy = {
    signup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthProxy,
          useValue: mockAuthProxy,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authProxy = module.get<AuthProxy>(AuthProxy);
  });

  describe('signup', () => {
    const signupInput: SignupRequestDto = {
      email: faker.internet.email(),
      lastName: faker.person.lastName(),
      phoneNumber: faker.phone.number(),
      password: faker.internet.password(),
      firstName: faker.person.firstName(),
      confirmPassword: faker.internet.password(),
    };

    it('should successfully create a new user', (done) => {
      const expectedResponse = { id: 1, email: signupInput.email };
      mockAuthProxy.signup.mockReturnValue(of(expectedResponse));

      controller.signup(signupInput).subscribe({
        next: (response) => {
          expect(response).toEqual(expectedResponse);
          expect(authProxy.signup).toHaveBeenCalledWith(signupInput);
          done();
        },
        error: done,
      });
    });

    it('should throw ConflictException when email already exists', (done) => {
      mockAuthProxy.signup.mockReturnValue(
        throwError(() => ({
          error: new RpcException('email_already_exists'),
          status: 'error',
        })),
      );

      controller.signup(signupInput).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(ConflictException);
          expect(error.message).toBe('Email already exists');
          expect(authProxy.signup).toHaveBeenCalledWith(signupInput);
          done();
        },
      });
    });

    it('should throw InternalServerErrorException for unknown RPC errors', (done) => {
      mockAuthProxy.signup.mockReturnValue(
        throwError(() => ({
          error: new RpcException('unknown_error'),
          status: 'error',
        })),
      );

      controller.signup(signupInput).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.message).toBe('unknown_error');
          expect(authProxy.signup).toHaveBeenCalledWith(signupInput);
          done();
        },
      });
    });

    it('should throw InternalServerErrorException for non-RPC errors', (done) => {
      mockAuthProxy.signup.mockReturnValue(
        throwError(() => new Error('Random error')),
      );

      controller.signup(signupInput).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect(error.message).toBe('Something went wrong');
          expect(authProxy.signup).toHaveBeenCalledWith(signupInput);
          done();
        },
      });
    });
  });
});
