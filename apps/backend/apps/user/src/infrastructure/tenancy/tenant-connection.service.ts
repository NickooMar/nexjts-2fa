import { Connection, Model, Schema } from 'mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';

/**
 * Resolves per-tenant database connections from the single pooled control-plane
 * connection using Mongoose's `connection.useDb()`.
 *
 * One MongoClient / connection pool is shared across every tenant; `useDb` only
 * switches the logical database, so business-data reads/writes land in the
 * tenant's own database (`tenant_<slug>`) while staying cheap to create.
 */
@Injectable()
export class TenantConnectionService {
  private readonly logger = new Logger(TenantConnectionService.name);

  constructor(
    @InjectConnection() private readonly rootConnection: Connection,
  ) {}

  /**
   * Return a connection scoped to the given tenant database. Cached internally
   * by Mongoose so repeated calls reuse the same underlying connection.
   */
  getTenantConnection(dbName: string): Connection {
    if (!dbName) {
      throw new Error('A tenant dbName is required to resolve its connection');
    }
    return this.rootConnection.useDb(dbName, { useCache: true });
  }

  /**
   * Resolve (and cache) a model bound to the tenant database. Mongoose caches
   * models per-connection, so asking for the same model twice returns the same
   * compiled model instead of throwing `OverwriteModelError`.
   */
  getModel<T>(dbName: string, name: string, schema: Schema): Model<T> {
    const connection = this.getTenantConnection(dbName);
    const existing = connection.models[name] as Model<T> | undefined;
    if (existing) return existing;
    this.logger.debug(`Compiling model "${name}" on database "${dbName}"`);
    return connection.model<T>(name, schema);
  }
}
