export interface EntityStore<T> {
  init(): Promise<void>;
  list(): T[];
  get(id: string): T | undefined;
  set(item: T): Promise<void>;
  replaceAll(items: T[]): Promise<void>;
  remove(id: string): Promise<void>;
}
