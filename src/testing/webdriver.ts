import { beforeAll, afterAll } from "vitest";

import {
  Browser,
  Builder,
  By,
  WebDriver,
  WebElementPromise,
} from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";
import { loginBypass } from "../server/util/environment";
import { log } from "../utils/functions";
import { assert } from "../utils/validate";

export function setUpWebDriver(
  uiOrigin = "http://localhost:3001",
  apiOrigin = uiOrigin,
): Driver {
  const driver = new Driver(uiOrigin, apiOrigin);

  beforeAll(async function setUpWebDriver() {
    log("start web driver set up");
    await driver.setUp();
    log("end web driver set up");
  });

  afterAll(async function turnDownWebDriver() {
    log("start web driver turn down");
    await driver.close();
    log("end web driver turn down");
  });

  return driver;
}

export class Driver {
  public driver!: WebDriver;

  constructor(
    private readonly uiOrigin: string,
    private readonly apiOrigin: string,
  ) {}

  async setUp(): Promise<void> {
    const chromeOptions = new Options();
    if (process.env.HEADLESS !== "false") {
      chromeOptions.addArguments("--headless=new");
    }
    this.driver = await new Builder()
      .setChromeOptions(chromeOptions)
      .forBrowser(Browser.CHROME)
      .build();
  }

  async close(): Promise<void> {
    await this.driver?.close();
  }

  async goHome(userId?: number) {
    return this.goTo("/", userId);
  }

  async goTo(path: string, userId?: number): Promise<void> {
    if (userId == null) {
      await this.driver.get(`${this.uiOrigin}${path}`);
    } else {
      const redirect = this.uiOrigin + path;
      await this.driver.get(
        `${this.apiOrigin}/login-as/${userId}?loginKey=${encodeURIComponent(loginBypass().loginKey ?? "")}&redirect=${encodeURIComponent(redirect)}`,
      );
    }

    await waitFor(async () => {
      const currentPath = await this.getPath();
      if (currentPath !== path) {
        throw new Error(
          "never successfully navigated to " +
            path +
            " current path=" +
            currentPath,
        );
      }
      return true;
    });
  }

  async getPath(): Promise<string> {
    const urlStr = await this.driver.getCurrentUrl();
    const url = new URL(urlStr);

    return url.pathname;
  }

  waitForElement(by: By, options?: RunAsyncOptions): WebElementPromise {
    return new WebElementPromise(
      this.driver,
      waitFor(() => this.driver.findElement(by), options),
    );
  }
}

interface RunAsyncOptions {
  timeout?: number;
  interval?: number;
}

const DEFAULT_OPTIONS = {
  timeout: 5000,
  interval: 100,
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
async function waitFor<T extends {}>(
  fn: () => Promise<T | undefined | null>,
  optionsInput?: RunAsyncOptions,
): Promise<T> {
  const { timeout, interval } = { ...optionsInput, ...DEFAULT_OPTIONS };

  const start = Date.now();
  do {
    try {
      const result = await fn();
      if (result != null) {
        return result;
      }
    } catch (_: unknown) {
      // Ignore error
    }
    await new Promise((r) => setTimeout(r, interval));
  } while (Date.now() < start + timeout);
  const result = await fn();
  assert(result != null);
  return result;
}
