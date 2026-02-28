import { callDispose } from "@drsmile1001/utils/Disposable";
import { type MaybePromise } from "@drsmile1001/utils/TypeHelper";

export function withContext<TContext>(
  contextBuilder: () => MaybePromise<TContext>,
  run: (context: TContext) => MaybePromise<void>
): () => Promise<void> {
  return async () => {
    const context = await contextBuilder();
    try {
      await run(context);
    } finally {
      try {
        await callDispose(context);
      } catch (error) {
        console.error("釋放資源發生例外", error);
        throw error;
      }
    }
  };
}
