import { test, expect } from "@playwright/test";

test("무료 정적 사이트: 경로·원본 로고·팀방 생성·할 일·기록·새로고침·초대 링크", async ({
  page,
  context,
}) => {
  const apiRequests = [];
  const errors = [];
  const failedAssets = [];
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/"))
      apiRequests.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failedAssets.push(r.url());
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "다 같이 해서 더 가치 있는 팀플" }),
  ).toBeVisible();
  await expect(page.getByRole("note")).toContainText(
    "다른 기기와 공유되지 않습니다",
  );
  await expect(page.locator('img[alt="다가치"]').first()).toHaveAttribute(
    "src",
    "/my-website/dagachi-logo.jpg",
  );
  expect(
    await page
      .locator('img[alt="다가치"]')
      .first()
      .evaluate((i) => i.complete && i.naturalWidth === 1254),
  ).toBe(true);
  await page.getByRole("link", { name: "다가치 소개" }).click();
  await expect(
    page.getByRole("heading", {
      name: "좋은 팀플의 시작은 기록과 확인, 그리고 근거.",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "팀 생성하기" }).first().click();
  await expect(page).toHaveURL(/my-website\/#\/lab$/);
  await page.getByRole("link", { name: "예시 과제로 체험하기" }).click();
  await page.getByRole("button", { name: "팀원 초대하고 시작하기" }).click();
  await page.getByLabel("팀원에게 보일 내 이름").fill("김나나");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "이 플랜으로 초대하기" }).click();
  await expect(
    page.getByRole("heading", {
      name: "팀방이 준비됐어요. 팀원을 초대해 주세요.",
    }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "자료조사" }).check();
  await page.getByRole("button", { name: "이걸로 할게요" }).click();
  await page.getByRole("button", { name: "현재 1명으로 역할 추천" }).click();
  await expect(
    page.getByRole("heading", { name: "내가 할 일 7" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "완료하기", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "우리 팀은 지금 14%" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "활동 기록", exact: true }).click();
  await page.getByLabel("활동 제목").fill("브라우저 체험 기록");
  await page
    .getByLabel("어떤 일을 했나요?")
    .fill("새로고침해도 이 브라우저에 기록이 남아요.");
  await page.getByRole("button", { name: "활동 기록하기" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "브라우저 체험 기록" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "초대", exact: true }).click();
  const memberCode = await page.locator(".invite-code").first().textContent();
  await page.getByRole("button", { name: "초대 링크 복사" }).first().click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain(`/my-website/#/lab/join?code=${memberCode}`);
  await page.goto(link);
  await page.getByLabel("내 이름", { exact: true }).fill("이하늘");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "팀방 입장하기" }).click();
  await page.getByRole("button", { name: "팀원과 역할", exact: true }).click();
  await expect(page.locator(".member-card")).toHaveCount(2);
  const separate = await context.browser().newContext();
  const other = await separate.newPage();
  await other.goto(link);
  await other.getByLabel("내 이름", { exact: true }).fill("다른 브라우저");
  await other.getByRole("checkbox").check();
  await other.getByRole("button", { name: "팀방 입장하기" }).click();
  await expect(other.getByRole("alert")).toContainText(
    "초대 코드를 찾을 수 없어요",
  );
  await separate.close();
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
  expect(failedAssets).toEqual([]);
});

test("무료 공개판은 문의·사전 신청을 접수한 것처럼 표시하지 않음", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "사전 신청", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "접수를 아직 지원하지 않습니다",
  );
  await expect(page.getByRole("dialog").getByRole("textbox")).toHaveCount(0);
});
