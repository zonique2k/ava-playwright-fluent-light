"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvaPlaywrightFluent = void 0;
const playwright_1 = require("playwright");
const spauth = __importStar(require("node-sp-auth"));
const show_mouse_position_1 = require("playwright-fluent/lib/actions/dom-actions/show-mouse-position");
function getArgs(func) {
    var args = func.toString().match(/\([^\)]*\)/)[0];
    args = args.substr(1, args.length - 2);
    return args.split(",").map((a) => a.trim());
}
function log(state, fn, functionArgs) {
    var msg = state + " " + fn.name;
    if (functionArgs.length > 0) {
        var args = getArgs(fn);
        var argsWithValue = [];
        for (var i = 0; i < functionArgs.length; i++) {
            argsWithValue.push(args[i] + "=" + functionArgs[i]);
        }
        msg += " " + argsWithValue.join(", ");
    }
    console.log(msg);
}
class actions {
    constructor() {
        this.retries = 0;
        this.actions = [];
        this.currentActionIndex = 0;
    }
    // browser
    startBrowser(name, options) {
        log("SETUP", this.startBrowser, arguments);
        this.actions.push(async () => {
            log("EXEC", this.startBrowser, arguments);
            switch (name) {
                case "chrome":
                    this.browser = await playwright_1.chromium.launch({ headless: false, ...options });
                    this.page = await this.browser.newPage();
                    if (options === null || options === void 0 ? void 0 : options.showMousePointer)
                        await show_mouse_position_1.showMousePosition(this.page);
                    break;
                default:
                    throw Error("unknown browser: " + name);
                    break;
            }
        });
        return this;
    }
    withRetry(numberOfRetries) {
        log("SETUP", this.withRetry, arguments);
        this.retries = numberOfRetries;
        return this;
    }
    close() {
        log("SETUP", this.close, arguments);
        this.actions.push(async () => {
            var _a;
            log("EXEC", this.close, arguments);
            await ((_a = this.browser) === null || _a === void 0 ? void 0 : _a.close());
        });
        return this;
    }
    navigateTo(url) {
        log("SETUP", this.navigateTo, arguments);
        this.actions.push(async () => {
            var _a;
            log("EXEC", this.navigateTo, arguments);
            await ((_a = this.page) === null || _a === void 0 ? void 0 : _a.goto(url));
        });
        return this;
    }
    // misc
    wait(durationInMilliseconds) {
        log("SETUP", this.wait, arguments);
        this.actions.push(async () => {
            log("EXEC", this.wait, arguments);
            await new Promise((resolve) => setTimeout(resolve, durationInMilliseconds));
        });
        return this;
    }
    // dom
    waitForSelector(selector) {
        log("SETUP", this.waitForSelector, arguments);
        this.actions.push(async () => {
            var _a;
            log("EXEC", this.waitForSelector, arguments);
            await ((_a = this.page) === null || _a === void 0 ? void 0 : _a.waitForSelector(selector));
        });
        return this;
    }
    click(selector) {
        this.waitForSelector(selector);
        log("SETUP", this.click, arguments);
        this.actions.push(async () => {
            var _a;
            log("EXEC", this.click, arguments);
            await ((_a = this.page) === null || _a === void 0 ? void 0 : _a.click(selector));
        });
        return this;
    }
    type(selector, text) {
        this.waitForSelector(selector);
        log("SETUP", this.type, arguments);
        this.actions.push(async () => {
            var _a;
            log("EXEC", this.type, arguments);
            await ((_a = this.page) === null || _a === void 0 ? void 0 : _a.type(selector, text));
        });
        return this;
    }
    // assert
    // sharepoint
    sharepointLogin(tenantUrl, username, password) {
        log("SETUP", this.sharepointLogin, arguments);
        this.actions.push(async () => {
            var _a;
            log("EXEC", this.sharepointLogin, arguments);
            const data = await spauth.getAuth(tenantUrl, {
                username: username,
                password: password
            });
            await ((_a = this.page) === null || _a === void 0 ? void 0 : _a.setExtraHTTPHeaders(data.headers));
        });
        return this;
    }
}
class AvaPlaywrightFluent extends actions {
    constructor(executionContext) {
        super();
        this.executionContext = executionContext;
    }
    async then(onfulfilled, onrejected) {
        // prettier-ignore
        return await this.executeActions()
            .then(onfulfilled)
            .catch(onrejected);
    }
    lastError() {
        return this._lastError;
    }
    async executeActions() {
        try {
            this._lastError = undefined;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                if (this.actions.length < this.currentActionIndex) {
                    break;
                }
                //const action = this.actions.shift();
                const action = this.actions[this.currentActionIndex++];
                action && (await action());
            }
        }
        catch (error) {
            if (this.retries > 0) {
                console.log("ERROR: error was thrown. " + this.retries + " retries left");
                this.retries--;
                // debugger;
                this.currentActionIndex = 0;
                if (this.browser) {
                    await this.browser.close();
                    this.browser = undefined;
                }
                await this.executeActions();
            }
            else {
                this._lastError = error;
                this.actions = [];
                throw error;
            }
        }
        this.actions = [];
    }
    assertIsVisible(selector) {
        this.waitForSelector(selector);
        log("SETUP", this.assertIsVisible, arguments);
        this.actions.push(async () => {
            var _a;
            log("EXEC", this.assertIsVisible, arguments);
            const result = await ((_a = this.page) === null || _a === void 0 ? void 0 : _a.isVisible(selector));
            this.executionContext.true(result, `${selector} does not exists`);
            if (!result)
                throw new Error(`${selector} does not exists`);
        });
        return this;
    }
}
exports.AvaPlaywrightFluent = AvaPlaywrightFluent;
