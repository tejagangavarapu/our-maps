import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
});

test("OUR branding appears throughout the interface and metadata", async ({
  page,
}) => {
  await expect(page).toHaveTitle("OUR | Intelligent Navigation Assistant");
  await expect(page.locator(".brand-word")).toHaveText("OUR.");
  await expect(
    page.getByRole("button", { name: "OUR home", exact: true }),
  ).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /^OUR,/,
  );
  await expect(page.locator(".insight-label")).toHaveText(
    "A LITTLE HEADS-UP FROM OUR",
  );
  await page.getByRole("button", { name: "Help and information" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "OUR is your Intelligent Navigation Assistant.",
  );
  await expect(page.getByRole("dialog")).not.toContainText("TINA");
});

test("search, travel modes, and alternate routes update the planner", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(
    page.getByRole("heading", { name: "Where are we headed?" }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Destination" })).toHaveValue(
    "Ferry Building",
  );
  await page.getByRole("button", { name: "Walking", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Recommended route, 56 minutes/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Alternative route/ }).click();
  await expect(
    page.getByRole("button", { name: /Alternative route/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("combobox", { name: "Destination" }).fill("SFMOMA");
  await page.getByRole("option", { name: /SFMOMA/ }).click();
  await expect(page.getByRole("combobox", { name: "Destination" })).toHaveValue(
    "SFMOMA",
  );
  await expect(
    page.getByRole("button", { name: "Explore SFMOMA" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Swap starting point and destination" })
    .click();
  await expect(page.getByRole("combobox", { name: "Destination" })).toHaveValue(
    "Pacific Heights",
  );
  await expect(
    page.getByRole("button", { name: "Starting point: SFMOMA" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("saved places and unit preferences persist on reload", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Unsave Ferry Building", exact: true })
    .click();
  await page.getByRole("button", { name: "Saved places", exact: true }).click();
  await expect(page.locator(".saved-place")).toHaveCount(2);
  await page.reload();
  await page.getByRole("button", { name: "Saved places", exact: true }).click();
  await expect(page.locator(".saved-place")).toHaveCount(2);
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.getByRole("button", { name: "Options", exact: true }).click();
  await page.getByRole("switch", { name: "Use kilometers" }).click();
  await page.getByRole("button", { name: "All set" }).click();
  await expect(page.locator(".route-description").first()).toContainText(
    "4.5 km",
  );
  await page.reload();
  await expect(page.locator(".route-description").first()).toContainText(
    "4.5 km",
  );
});

test("complete a navigation preview and revisit the trip", async ({ page }) => {
  await page.getByRole("button", { name: "Let's go", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Enjoy the journey." }),
  ).toBeVisible();
  for (let i = 0; i < 7; i++)
    await page.getByRole("button", { name: "Next turn", exact: true }).click();
  await page
    .getByRole("button", { name: "Finish journey", exact: true })
    .click();
  await page.getByRole("button", { name: "My trips", exact: true }).click();
  await expect(page.locator(".trip-item")).toHaveCount(1);
  await page.locator(".trip-item").click();
  await expect(page.getByRole("combobox", { name: "Destination" })).toHaveValue(
    "Ferry Building",
  );
});

test("nearby discovery, destination details, and share links work", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Coffee", exact: true }).click();
  await page.locator(".nearby-result").click();
  await expect(page.getByRole("combobox", { name: "Destination" })).toHaveValue(
    "Blue Bottle Coffee",
  );
  await page
    .getByRole("button", { name: "Explore Blue Bottle Coffee" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Thoughtfully brewed");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Share route", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "YOUR ROUTE LINK" }),
  ).toHaveValue(/destination=bluebottle&mode=drive/);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("combobox", { name: "Destination" })
    .fill("not-a-real-place");
  await expect(page.getByText("No places found just yet.")).toBeVisible();
});

test("mobile layout switches between map and planner without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("combobox", { name: "Destination" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View map", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Zoom in", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page
    .getByRole("button", { name: "Recenter on your route", exact: true })
    .click();
  await page.screenshot({ path: "artifacts/mobile-map.png" });
  await page.getByRole("button", { name: "Your route", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Destination" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("shared links preserve the destination, mode, route, and direction", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Walking", exact: true }).click();
  await page.getByRole("button", { name: /Alternative route/ }).click();
  await page
    .getByRole("button", { name: "Swap starting point and destination" })
    .click();
  await page.getByRole("button", { name: "Share route", exact: true }).click();
  const url = await page
    .getByRole("textbox", { name: "YOUR ROUTE LINK" })
    .inputValue();
  await expect(page.getByRole("dialog")).toContainText(
    "FROM FERRY BUILDING TO",
  );
  await page.goto(url);
  await expect(page.getByRole("combobox", { name: "Destination" })).toHaveValue(
    "Pacific Heights",
  );
  await expect(
    page.getByRole("button", { name: "Walking", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /Alternative route/ }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("map tiles and route bounds survive layer changes and viewport resizing", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Switch to satellite map" }).click();
  await expect(page.locator(".map-canvas")).toHaveClass(/leaflet-container/);
  await page.getByRole("button", { name: "Switch to street map" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "View map", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator("img.leaflet-tile")
        .first()
        .evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBeGreaterThan(100);
  await expect
    .poll(() =>
      page
        .locator(".origin-marker")
        .evaluate((el) => el.getBoundingClientRect().x),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      page
        .locator(".destination-marker")
        .evaluate((el) => el.getBoundingClientRect().right),
    )
    .toBeLessThan(390);
});
