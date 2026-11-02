import { expect, test } from "@playwright/test";

test("opens the application", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("HEX DUEL")).toBeVisible();
});

test("play screen offers both modes", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByText("QUICK MATCH")).toBeVisible();
  await expect(page.getByText("PRIVATE ROOM")).toBeVisible();
});

test("creates a private room and shows the invitation code", async ({ page }) => {
  await page.goto("/room");
  await page.getByRole("button", { name: /CREATE ROOM/i }).click();
  await page.waitForURL(/\/game\//);
  await expect(page).toHaveURL(/\/game\//);
});

test("two browser contexts join the same private room and play a turn", async ({ browser }) => {
  const creatorContext = await browser.newContext();
  const joinerContext = await browser.newContext();
  const creator = await creatorContext.newPage();
  const joiner = await joinerContext.newPage();

  // Create the room from the API to get a deterministic room id.
  const createResponse = await creator.request.post("http://localhost:2568/api/private-room");
  expect(createResponse.ok()).toBeTruthy();
  const { roomId } = (await createResponse.json()) as { roomId: string };

  // Both players join via the game page (room id URL).
  await creator.goto(`/game/${roomId}`);
  await joiner.goto(`/game/${roomId}`);

  // Both should reach the game page with the HUD visible.
  await expect(creator.getByText(/TURN 1 \/ 30/i)).toBeVisible({ timeout: 15_000 });
  await expect(joiner.getByText(/TURN 1 \/ 30/i)).toBeVisible({ timeout: 15_000 });

  // Each player selects an attack and confirms (secret, simultaneous).
  for (const player of [creator, joiner]) {
    await player.getByRole("button", { name: /^STRIKE$/i }).click();
    await player.getByRole("button", { name: /CONFIRM|VALIDER/i }).click();
    await expect(player.getByText(/ACTION LOCKED|ACTION VERROUILLÉE/i)).toBeVisible();
  }

  // Both validated: the turn resolves and turn 2 starts.
  await expect(creator.getByText(/TURN 2 \/ 30/i)).toBeVisible({ timeout: 20_000 });
  await expect(joiner.getByText(/TURN 2 \/ 30/i)).toBeVisible({ timeout: 20_000 });

  await creatorContext.close();
  await joinerContext.close();
});

test("opponent indicator stays neutral before reveal", async ({ browser }) => {
  const creatorContext = await browser.newContext();
  const joinerContext = await browser.newContext();
  const creator = await creatorContext.newPage();
  const joiner = await joinerContext.newPage();

  const createResponse = await creator.request.post("http://localhost:2568/api/private-room");
  const { roomId } = (await createResponse.json()) as { roomId: string };
  await creator.goto(`/game/${roomId}`);
  await joiner.goto(`/game/${roomId}`);
  await expect(creator.getByText(/TURN 1 \/ 30/i)).toBeVisible({ timeout: 15_000 });

  // Opponent status shows only neutral wording, never the action content.
  await expect(creator.getByText(/OPPONENT CHOOSING|ADVERSAIRE EN COURS/i)).toBeVisible();
  const hudText = await creator.locator(".hud").innerText();
  expect(hudText).not.toMatch(/STRIKE|SNIPER.*direction/i);

  await creatorContext.close();
  await joinerContext.close();
});
