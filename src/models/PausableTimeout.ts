export class PausableTimeout {
    private timeoutId: NodeJS.Timeout | null = null;
    private startTime: number = 0;
    private remainingTime: number;
    private callback: () => void;

    constructor(callback: () => void, delay: number) {
        this.callback = callback;
        this.remainingTime = delay;
        this.start();
    }

    start() {
        this.startTime = Date.now();
        this.timeoutId = setTimeout(() => {
            this.timeoutId = null;
            this.callback();
        }, this.remainingTime);
    }

    pause() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.remainingTime -= Date.now() - this.startTime; // Calculate remaining time
            this.timeoutId = null;
        }
    }

    resume() {
        if (!this.timeoutId) {
            this.start();
        }
    }

    getRemainingTime(): number {
        return this.timeoutId ? this.remainingTime - (Date.now() - this.startTime) : this.remainingTime;
    }

    clear() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}
