// Native status updates and end calls must retain their order across async APIs.
export function createNativeQueue() {
  let operations: Promise<unknown> = Promise.resolve();
  return (task: () => Promise<void>) => {
    const next = operations.catch(() => {}).then(task);
    operations = next;
    return next;
  };
}
