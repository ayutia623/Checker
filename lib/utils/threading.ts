export class ThreadManager {
  private maxThreads: number;
  private activeThreads = 0;
  private queue: Array<() => Promise<any>> = [];
  private results: any[] = [];

  constructor(maxThreads: number) {
    this.maxThreads = Math.max(1, Math.min(maxThreads, 200));
  }

  async execute<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    this.queue = [...tasks];
    this.results = [];
    this.activeThreads = 0;

    return new Promise((resolve) => {
      const checkComplete = () => {
        if (this.queue.length === 0 && this.activeThreads === 0) {
          resolve(this.results);
        }
      };

      const runNext = async () => {
        if (this.queue.length === 0) {
          this.activeThreads--;
          checkComplete();
          return;
        }

        const task = this.queue.shift();
        if (!task) {
          this.activeThreads--;
          checkComplete();
          return;
        }

        try {
          const result = await task();
          this.results.push(result);
        } catch (error) {
          this.results.push({ error });
        }

        runNext();
      };

      // Start initial threads
      const initialThreads = Math.min(this.maxThreads, tasks.length);
      for (let i = 0; i < initialThreads; i++) {
        this.activeThreads++;
        runNext();
      }
    });
  }

  setMaxThreads(threads: number) {
    this.maxThreads = Math.max(1, Math.min(threads, 200));
  }
}
