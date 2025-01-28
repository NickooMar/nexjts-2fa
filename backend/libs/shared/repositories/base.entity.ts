export class BaseEntity {
  constructor(partial?: Partial<BaseEntity>) {
    Object.assign(this, JSON.parse(JSON.stringify(partial)));
  }
}
