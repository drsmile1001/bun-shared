import { type LogRecord, type LogTransport } from "./Logger";

export class MemoryTransport implements LogTransport {
  readonly records: LogRecord[] = [];
  closed = false;

  write(rec: LogRecord): void {
    this.records.push(rec);
  }

  clear(): void {
    this.records.length = 0;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    this.closed = true;
  }
}
