import { Browser, Page } from 'playwright';
import { ExecutionContext } from 'ava';
export declare type BrowserName = 'chromium' | 'chrome' | 'chrome-canary' | 'firefox' | 'webkit';
interface StartBrowserOptions {
    headless: boolean;
    showMousePointer: boolean;
}
declare class actions {
    protected browser?: Browser;
    protected page?: Page;
    protected actions: (() => Promise<void>)[];
    startBrowser(name: BrowserName, options?: StartBrowserOptions): this;
    close(): this;
    navigateTo(url: string): this;
    wait(durationInMilliseconds: number): this;
    waitForSelector(selector: string): this;
    click(selector: string): this;
    type(selector: string, text: string): this;
    sharepointLogin(tenantUrl: string, username: string, password: string): this;
}
export declare class AvaPlaywrightFluent extends actions implements PromiseLike<void> {
    then<TResult1 = void, TResult2 = never>(onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined): Promise<TResult1 | TResult2>;
    private _lastError?;
    lastError(): Error | undefined;
    private executionContext;
    constructor(executionContext: ExecutionContext);
    private executeActions;
    assertIsVisible(selector: string): this;
}
export {};
