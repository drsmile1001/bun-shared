export type Migration = {
  description: string;
  migrate: (data: unknown[]) => unknown[];
};

export class MigrationBuilder<T> {
  private migrations: Migration[] = [];

  private constructor() {}

  static create<T>(): MigrationBuilder<T> {
    return new MigrationBuilder<T>();
  }

  addMigration<TNext>(
    description: string,
    migrateFn: (data: T[]) => TNext[]
  ): MigrationBuilder<TNext> {
    this.migrations.push({
      description: description,
      migrate: (data: unknown[]) => migrateFn(data as T[]),
    });
    return this as unknown as MigrationBuilder<TNext>;
  }

  build(): Migration[] {
    return this.migrations;
  }
}
