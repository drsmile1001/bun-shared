import type { EntityStore } from "./EntityStore";

export class EntityStoreInMemory<
  T extends { id: string },
> implements EntityStore<T> {
  private readonly cache = new Map<string, T>();

  constructor(options: { initialItems?: T[] } = {}) {
    const { initialItems = [] } = options;
    for (const item of initialItems) {
      this.cache.set(item.id, item);
    }
  }

  async init(): Promise<void> {
    return;
  }

  list(): T[] {
    return Array.from(this.cache.values());
  }

  get(id: string): T | undefined {
    return this.cache.get(id);
  }

  async set(item: T): Promise<void> {
    this.cache.set(item.id, item);
  }

  async replaceAll(items: T[]): Promise<void> {
    this.cache.clear();
    for (const item of items) {
      this.cache.set(item.id, item);
    }
  }

  async remove(id: string): Promise<void> {
    this.cache.delete(id);
  }
}
