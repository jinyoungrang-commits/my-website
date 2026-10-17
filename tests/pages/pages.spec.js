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

test("사전 신청: 필수 입력·동의 후 외부 접수로 POST하고 반환 페이지 표시", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const submissions = [];
  await page.route("https://formsubmit.co/**", async (route) => {
    const request = route.request();
    submissions.push({
      method: request.method(),
      url: request.url(),
      data: new URLSearchParams(request.postData()),
    });
    await route.fulfill({
      status: 302,
      headers: {
        location: submissions.at(-1).data.get("_next"),
      },
      body: "",
    });
  });
  await page.goto("./");
  await page.getByRole("button", { name: "사전 신청하기", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const submit = dialog.getByRole("button", { name: "사전 신청하기" });
  await submit.click();
  await expect(dialog.getByLabel("이름", { exact: true })).toBeFocused();
  await dialog.getByLabel("이름", { exact: true }).fill("테스트 신청자");
  await dialog.getByLabel("이메일", { exact: true }).fill("invalid-email");
  await submit.click();
  await expect(dialog.getByLabel("이메일", { exact: true })).toBeFocused();
  await dialog.getByLabel("이메일", { exact: true }).fill("applicant@example.com");
  await submit.click();
  await expect(dialog.getByRole("checkbox")).toBeFocused();
  expect(submissions).toHaveLength(0);
  await dialog.getByText("개인정보 수집·이용 안내", { exact: true }).click();
  await expect(dialog).toContainText("FormSubmit을 통해");
  await dialog.getByRole("checkbox").check();
  await submit.click();
  await expect(page).toHaveURL(/my-website\/#\/preregister\/thanks$/);
  await expect(
    page.getByRole("heading", { name: "다가치를 기다려 주셔서 고마워요." }),
  ).toBeVisible();
  expect(submissions).toHaveLength(1);
  const sent = submissions[0];
  expect(sent.method).toBe("POST");
  expect(sent.url).toBe("https://formsubmit.co/jinyoungrang0502@gmail.com");
  expect(sent.data.get("name")).toBe("테스트 신청자");
  expect(sent.data.get("email")).toBe("applicant@example.com");
  expect(sent.data.get("consent")).toContain("동의함");
  expect(sent.data.get("_honey")).toBe("");
  expect(sent.data.get("_captcha")).toBeNull();
  expect(sent.data.get("_next")).toBe(
    "http://127.0.0.1:3113/my-website/#/preregister/thanks",
  );
  await page.reload();
  await page.getByRole("link", { name: "다가치 홈으로" }).click();
  await expect(page.getByRole("heading", { name: "다 같이 해서 더 가치 있는 팀플" })).toBeVisible();
  expect(await page.evaluate(() => Object.values(localStorage).some(value => value.includes("applicant@example.com")))).toBe(false);
});

test("문의는 준비 중 안내를 유지하고 사전 신청 개인정보 안내는 분리", async ({ page }) => {
  await page.goto("./#/lab");
  await page.getByRole("button", { name: "문의하기" }).click();
  await expect(page.getByRole("dialog")).toContainText("문의 접수를 아직 지원하지 않습니다");
  await expect(page.getByRole("dialog").getByRole("textbox")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.goto("./");
  await page.getByRole("button", { name: "개인정보 안내", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("FormSubmit");
  await expect(page.getByRole("dialog")).toContainText("브라우저에만 저장됩니다");
});
