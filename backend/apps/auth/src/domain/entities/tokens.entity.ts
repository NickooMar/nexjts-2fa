export class TokensEntity {
  accessToken: string;
  refreshToken: string;

  constructor(partial: Partial<TokensEntity>) {
    Object.assign(this, partial);
  }
}
