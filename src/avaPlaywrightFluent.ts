import { Browser, chromium, Page } from 'playwright';
import * as spauth from 'node-sp-auth';
import { ExecutionContext } from 'ava';
import { showMousePosition } from "playwright-fluent/lib/actions/dom-actions/show-mouse-position";

export type BrowserName = 'chromium' | 'chrome' | 'chrome-canary' | 'firefox' | 'webkit';

function getArgs(func: any) {
    var args = func.toString().match(/\([^\)]*\)/)[0];
    args = args.substr(1, args.length - 2);
    return args.split(",").map((a: string)=>a.trim());
}

function log(state: string, fn: any, functionArgs: IArguments) {
    var msg = state + " " + fn.name;
    if (functionArgs.length > 0) {
        var args = getArgs(fn);
        var argsWithValue = [];
        for(var i=0;i<functionArgs.length;i++){
            argsWithValue.push(args[i] + "=" + functionArgs[i]);
        }

        msg += " " + argsWithValue.join(", ");
    }
    // console.log(msg);
}
interface StartBrowserOptions{
    headless: boolean;
    showMousePointer: boolean;
}
class actions {
    protected browser?: Browser;
    protected page?: Page;

    protected actions: (() => Promise<void>)[] = [];

    // browser
    public startBrowser(name: BrowserName, options?: StartBrowserOptions) {
        log("SETUP", this.startBrowser, arguments);

        this.actions.push(async () => {
            log("EXEC", this.startBrowser, arguments);
            switch (name) {
                case "chrome":
                    this.browser = await chromium.launch({headless: false, ...options  });
                    this.page = await this.browser.newPage();
                    if(options?.showMousePointer)
                        await showMousePosition(this.page);
                    break;
                default:
                    throw Error("unknown browser: " + name);
                    break;
            }
        });
        return this;
    }
    public close() {
        log("SETUP", this.close, arguments);
        this.actions.push(async () => {
            log("EXEC", this.close, arguments);
            await this.browser?.close();
        });
        return this;
    }
    public navigateTo(url: string) {
        log("SETUP", this.navigateTo, arguments);
        this.actions.push(async () => {
            log("EXEC", this.navigateTo, arguments);
            await this.page?.goto(url);
        });
        return this;
    }

    // misc
    public wait(durationInMilliseconds: number) {
        log("SETUP", this.wait, arguments);
        this.actions.push(async () => {
            log("EXEC", this.wait, arguments);
            await new Promise((resolve) => setTimeout(resolve, durationInMilliseconds));
        });
        return this;
    }

    // dom
    public waitForSelector(selector: string){
        log("SETUP", this.waitForSelector, arguments);
        this.actions.push(async () => {
            log("EXEC", this.waitForSelector, arguments);
            await this.page?.waitForSelector(selector);
        });
        return this;
    }
    public click(selector: string){
        this.waitForSelector(selector);
        log("SETUP", this.click, arguments);
        this.actions.push(async () => {
            log("EXEC", this.click, arguments);
            await this.page?.click(selector);
        });
        return this;
    }
    public type(selector: string, text: string){
        this.waitForSelector(selector);
        log("SETUP", this.type, arguments);
        this.actions.push(async () => {
            log("EXEC", this.type, arguments);
            await this.page?.type(selector, text);
        });
        return this;
    }

    // assert

    // sharepoint
    public sharepointLogin(tenantUrl: string, username: string, password: string){
        log("SETUP", this.sharepointLogin, arguments);
        this.actions.push(async () => {
            log("EXEC", this.sharepointLogin, arguments);
            const data = await spauth.getAuth(tenantUrl, {
                username: username,
                password: password
            });
            await this.page?.setExtraHTTPHeaders(data.headers);
        });
        return this;
    }
}


export class AvaPlaywrightFluent extends actions implements PromiseLike<void> {
    public async then<TResult1 = void, TResult2 = never>(
        onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null | undefined,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
    ): Promise<TResult1 | TResult2> {
        // prettier-ignore
        return await this.executeActions()
            .then(onfulfilled)
            .catch(onrejected);
    }
    private _lastError?: Error;
    public lastError(): Error | undefined {
        return this._lastError;
    }
    private executionContext: ExecutionContext;
    constructor(executionContext: ExecutionContext) {
        super();        
        this.executionContext = executionContext;
    }
    private async executeActions(): Promise<void> {
        try {
            this._lastError = undefined;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                if (this.actions.length === 0) {
                    break;
                }
                const action = this.actions.shift();
                action && (await action());
            }
        } catch (error) {
            this._lastError = error;
            this.actions = [];
            throw error;
        } finally {
            this.actions = [];
        }
    }

    public assertIsVisible(selector: string){
        this.waitForSelector(selector);
        log("SETUP", this.assertIsVisible, arguments);
        this.actions.push(async () => {
            log("EXEC", this.assertIsVisible, arguments);
            const result = await this.page?.isVisible(selector);
            this.executionContext.true(result, `${selector} does not exists`);
            if(!result)
                throw new Error(`${selector} does not exists`);
        });
        return this;
    }
}

