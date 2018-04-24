"use strict";
describe("Core — Can I Use", function() {
  afterAll(flushIframes);
  const apiURL = `${window.location.origin}/tests/data/caniuse/{FEATURE}.json`;

  it("uses meaningful defaults", async () => {
    const ops = makeStandardOps({ caniuse: { feature: "FEATURE", apiURL } });
    const doc = await makeRSDoc(ops);
    await doc.respecIsReady;
    const { caniuse } = doc.defaultView.respecConfig;

    expect(caniuse.feature).toBe("FEATURE");
    expect(caniuse.maxAge).toBe(60 * 60 * 24 * 1000);
    expect(caniuse.versions).toBe(4);
    expect(caniuse.browsers).toEqual(["chrome", "firefox", "safari", "edge"]);
  });

  it("allows overriding defaults", async () => {
    const ops = makeStandardOps({
      caniuse: {
        feature: "FEATURE",
        versions: 10,
        browsers: ["firefox", "chrome"],
        maxAge: 0,
        apiURL,
      },
    });
    const doc = await makeRSDoc(ops);
    await doc.respecIsReady;
    const { caniuse } = doc.defaultView.respecConfig;

    expect(caniuse.feature).toBe("FEATURE");
    expect(caniuse.maxAge).toBe(0);
    expect(caniuse.browsers).toEqual(["firefox", "chrome"]);
    expect(caniuse.versions).toBe(10);
  });

  it("does nothing if caniuse is not enabled", async () => {
    const ops = makeStandardOps();
    const doc = await makeRSDoc(ops);
    await doc.respecIsReady;
    const { caniuse } = doc.defaultView.respecConfig;

    expect(caniuse).toBeFalsy();
    expect(doc.querySelector(".caniuse-title")).toBeFalsy();
    expect(doc.querySelector(".caniuse-stats")).toBeFalsy();
  });

  it("removes unsupported browsers", async () => {
    const ops = makeStandardOps({
      caniuse: {
        feature: "FEATURE",
        browsers: ["FireFox", "GoogleChrome", "SafarIE", "Opera"],
        apiURL,
      },
    });
    const doc = await makeRSDoc(ops);
    await doc.respecIsReady;
    const { caniuse } = doc.defaultView.respecConfig;

    expect(caniuse.browsers.length).toBe(2);
    expect(caniuse.browsers).toEqual(["firefox", "opera"]);
    // TODO: check for `pub` warnings
  });

  it("shows caniuse.com link on error", async () => {
    const ops = makeStandardOps({
      caniuse: {
        feature: "FEATURE",
        apiURL: "DOES-NOT-EXIST",
      },
    });
    const doc = await makeRSDoc(ops);
    await doc.respecIsReady;

    const link = doc.querySelector(".caniuse-stats a");
    expect(link.textContent).toBe("caniuse.com");
    expect(link.href).toBe("https://caniuse.com/#feat=FEATURE");
  });

  it("shows caniuse browser support table", async () => {
    const ops = makeStandardOps({
      caniuse: {
        feature: "FEATURE",
        apiURL: `${window.location.origin}/tests/data/caniuse/{FEATURE}.json`,
        browsers: ["firefox", "chrome", "opera"],
        versions: 5,
      },
    });
    const doc = await makeRSDoc(ops);
    await doc.respecIsReady;

    const stats = doc.querySelector(".caniuse-stats");

    const moreInfoLink = stats.querySelector("a");
    expect(moreInfoLink.href).toBe("https://caniuse.com/#feat=FEATURE");
    expect(moreInfoLink.textContent.trim()).toBe("More info");

    const browsers = stats.querySelectorAll("div");
    expect(browsers.length).toBe(2); // not 3, as there is no data for "opera"
    const [firefox, chrome] = browsers;

    const chromeVersions = chrome.querySelectorAll("li.caniuse-cell");
    expect(chromeVersions.length).toBe(2);

    const firefoxVersions = firefox.querySelectorAll("li.caniuse-cell");
    expect(firefoxVersions.length).toBe(4);

    // TODO: somehow innerText is behaving like textContent (test fails)
    // expect(firefox.innerText).toBe("Firefox 61");
    expect(firefox.classList.value).toBe("caniuse-cell y");

    expect(firefoxVersions[0].textContent.trim()).toBe("60");
    expect(firefoxVersions[0].classList.value).toBe("caniuse-cell n d");

    // test dropdown
    let style = getComputedStyle(firefox.querySelector("ul"));
    expect(style.getPropertyValue("display")).toBe("none");

    // TODO:
    // firefox.focus();
    // style = getComputedStyle(firefox.querySelector("ul"));
    // expect(style.getPropertyValue("display")).toBe("block");
  });
});
