export interface EntityStoreTransformer<TEntity, TPersist = any> {
  fromPersist(data: TPersist): TEntity;
  toPersist(data: TEntity): TPersist;
}
