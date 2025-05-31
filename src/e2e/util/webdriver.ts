import {
  Browser,
  Builder,
  By,
  WebDriver,
  WebElement,
  WebElementPromise,
} from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";
import { Direction, TileType } from "../../engine/state/tile";
import { environment } from "../../server/util/environment";
import { Coordinates } from "../../utils/coordinates";
import { log } from "../../utils/functions";
import { assert } from "../../utils/validate";

export function setUpWebDriver(origin = "http://localhost:3001"): Driver {
  const driver = new Driver(origin);

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

  constructor(private readonly origin: string) {}

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

  async goToGame(gameId: number, userId?: number): Promise<void> {
    return this.goTo(`/app/games/${gameId}`, userId);
  }

  async goTo(path: string, userId?: number): Promise<void> {
    if (userId == null) {
      await this.driver.get(`${this.origin}${path}`);
    } else {
      await this.driver.get(
        `${this.origin}/login-as/${userId}?loginKey=${encodeURIComponent(environment.loginKey ?? "")}&redirect=${encodeURIComponent(path)}`,
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

  async buildTrack(
    coordinates: Coordinates,
    tileType: TileType,
    orientation: Direction,
  ) {
    await this.findElementByDataAttributes({
      parent: By.xpath("//*[name()='svg'][@data-hex-grid='main-map']"),
      name: "polygon",
      dataAttributes: {
        coordinates: coordinates.serialize(),
      },
    }).click();

    await this.findElementByDataAttributes({
      parent: By.xpath("//*[@data-building-options]"),
      name: "div",
      dataAttributes: {
        "tile-type": tileType,
        orientation: orientation,
      },
    })
      .findElement(By.css("polygon"))
      .click();

    await this.waitForSuccess();
  }

  async waitForSuccess(): Promise<void> {
    await this.waitForElement(By.className("success-toast"));
  }

  async getGameId(): Promise<number> {
    const path = await this.getPath();
    const matches = path.match(/\/app\/games\/(\d*)$/);
    if (matches == null) {
      throw new Error(`URL path "${path}" is not a game page`);
    }
    return Number(matches[1]);
  }

  waitForElement(by: By, options?: RunAsyncOptions): WebElementPromise {
    return new WebElementPromise(
      this.driver,
      waitFor(() => this.driver.findElement(by), options),
    );
  }

  findElementByDataAttributes(options: FindElementOptions): WebElementPromise {
    return new WebElementPromise(
      this.driver,
      this.findElementByDataAttributesP(options),
    );
  }

  private async findElementByDataAttributesP(
    options: FindElementOptions,
  ): Promise<WebElement> {
    const parent = this.waitForElement(options.parent);

    const xpathBase = `//*[name()='${options.name}']`;

    const xpath =
      xpathBase +
      Object.keys(options.dataAttributes)
        .map((key) => `[@data-${key}='${options.dataAttributes[key]}']`)
        .join("");

    try {
      return await parent.findElement(By.xpath(xpath));
    } catch (e: unknown) {
      if (!(e instanceof Error)) throw e;
      if (!e.message.includes("no such element: Unable to locate element")) {
        throw e;
      }
      const elements = await parent.findElements(By.xpath(xpathBase));
      const elementsStr = await Promise.all(
        elements.map(async (e) => {
          const attrs = await Promise.all(
            Object.keys(options.dataAttributes).map((attr) => {
              return e.getAttribute(`data-${attr}`);
            }),
          );
          return attrs.join(":");
        }),
      );
      if (elementsStr.length === 0) {
        throw new Error(`found no elements with the name ${options.name}`);
      }
      throw new Error(
        `no such element for xpath "${xpath}". Found elements: ${elementsStr.sort().join("\n")}`,
      );
    }
  }
}

interface RunAsyncOptions {
  timeout?: number;
  interval?: number;
}

interface FindElementOptions extends RunAsyncOptions {
  parent: By;
  name: string;
  dataAttributes: { [key: string]: unknown };
}

const DEFAULT_OPTIONS = {
  timeout: 1000,
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
