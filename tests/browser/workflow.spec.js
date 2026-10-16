import { test, expect } from "@playwright/test";

test("캡처의 화면 흐름: 소개 → 예시 플랜 → 팀방 → 기록·역할·일정·초대", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1920, height: 910 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "다 같이 해서 더 가치 있는 팀플" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "팀 생성하기" }).first().click();
  await expect(
    page.getByRole("heading", { name: "새 팀플을 시작해요." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "예시 과제로 체험하기" }).click();
  await expect(
    page.getByRole("heading", { name: "4명이면 이렇게 진행하는 걸 추천해요." }),
  ).toBeVisible();
  await expect(page.locator(".plan-task")).toHaveCount(7);
  await page.getByRole("button", { name: "팀원 초대하고 시작하기" }).click();
  await page.getByLabel("팀원에게 보일 내 이름").fill("김나나");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "이 플랜으로 초대하기" }).click();
  await expect(
    page.getByRole("heading", {
      name: "팀방이 준비됐어요. 팀원을 초대해 주세요.",
    }),
  ).toBeVisible();
  const roomUrl = page.url();
  await page.getByRole("checkbox", { name: "자료조사" }).check();
  await page.getByRole("button", { name: "이걸로 할게요" }).click();
  await page.getByRole("button", { name: "현재 1명으로 역할 추천" }).click();
  await expect(
    page.getByRole("heading", { name: "내가 할 일 7" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/team-today-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "완료하기", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "우리 팀은 지금 14%" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "할 일 추가", exact: true }).click();
  await page.getByLabel("할 일", { exact: true }).fill("최종 자료 확인");
  await page.getByRole("button", { name: "할 일 저장" }).click();
  await expect(
    page.getByRole("heading", { name: "최종 자료 확인" }),
  ).toBeVisible();
  await page.getByText("팀 마감 · 회의 날짜 설정", { exact: true }).click();
  await page.getByLabel("프로젝트 마감", { exact: true }).fill("2026-11-10");
  await page.getByLabel("다음 회의", { exact: true }).fill("2026-10-25");
  await page.getByRole("button", { name: "일정 저장", exact: true }).click();
  await expect(
    page.getByText("다음 회의 · 2026-10-25", { exact: true }),
  ).toBeVisible();
  await page.getByText("캘린더 · 팀 일정", { exact: true }).click();
  await page
    .getByRole("button", { name: "2026-10-25 일정 있음", exact: true })
    .click();
  await expect(page.locator(".calendar-events")).toContainText("팀 회의");
  await page.getByRole("button", { name: "활동 기록", exact: true }).click();
  await page.getByLabel("활동 제목").fill("경쟁 서비스 5곳 비교");
  await page
    .getByLabel("어떤 일을 했나요?")
    .fill("서비스의 장단점을 표로 정리했습니다. 다음에는 타깃을 구체화해요.");
  await page.getByLabel("근거 자료 링크").fill("https://example.com/research");
  await page.getByRole("button", { name: "활동 기록하기" }).click();
  await expect(
    page.getByRole("heading", { name: "경쟁 서비스 5곳 비교" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "경쟁 서비스 5곳 비교" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/team-activity-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "팀원과 역할", exact: true }).click();
  await page.getByLabel("이름", { exact: true }).fill("김나나 수정");
  await page.getByLabel("역할", { exact: true }).fill("시장조사");
  await page.getByRole("button", { name: "변경 저장" }).click();
  await expect(page.locator(".member-card")).toContainText("김나나 수정");
  await page.getByRole("button", { name: "상호 평가", exact: true }).click();
  await expect(page.getByText("아직 작성된 평가가 없어요.")).toBeVisible();
  await page.getByRole("button", { name: "초대", exact: true }).click();
  await expect(page.locator(".invite-code")).toHaveCount(2);
  const memberCode = await page.locator(".invite-code").first().textContent();
  const professorCode = await page.locator(".invite-code").nth(1).textContent();
  await page.screenshot({
    path: "test-results/team-invite-desktop.png",
    fullPage: true,
  });
  await page.goto("/lab");
  await expect(
    page.getByRole("link", { name: "마케팅관리 팀플 팀장" }),
  ).toBeVisible();
  await page.goto(roomUrl);
  await expect(
    page.getByRole("heading", { name: "마케팅관리 팀플" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  const browser = page.context().browser();
  const memberContext = await browser.newContext();
  const memberPage = await memberContext.newPage();
  await memberPage.goto(`http://127.0.0.1:3110/lab/join?code=${memberCode}`);
  await memberPage.getByLabel("내 이름", { exact: true }).fill("이하늘");
  await memberPage.getByRole("checkbox").check();
  await memberPage.getByRole("button", { name: "팀방 입장하기" }).click();
  await expect(
    memberPage.getByRole("heading", { name: "마케팅관리 팀플" }),
  ).toBeVisible();
  await memberPage
    .getByRole("button", { name: "상호 평가", exact: true })
    .click();
  for (const label of ["참여도", "책임감", "소통"])
    await memberPage.getByLabel(label, { exact: true }).selectOption("5");
  await memberPage
    .getByLabel("함께한 과정에 대한 의견 (선택)")
    .fill("자료를 성실하게 정리했어요.");
  await memberPage.getByRole("button", { name: "평가 저장" }).click();
  await expect(memberPage.locator(".evaluation")).toContainText(
    "자료를 성실하게 정리했어요.",
  );
  const professorContext = await browser.newContext();
  const professorPage = await professorContext.newPage();
  await professorPage.goto(
    `http://127.0.0.1:3110/lab/join?code=${professorCode}`,
  );
  await professorPage.getByRole("button", { name: "팀방 열람하기" }).click();
  await expect(professorPage.locator(".readonly-banner")).toBeVisible();
  await expect(
    professorPage.getByRole("button", { name: "완료하기", exact: true }),
  ).toHaveCount(0);
  await professorPage
    .getByRole("button", { name: "상호 평가", exact: true })
    .click();
  await expect(professorPage.locator(".evaluation")).toContainText(
    "작성자 · 이하늘",
  );
  await professorPage
    .getByRole("button", { name: "활동 기록", exact: true })
    .click();
  await expect(
    professorPage.getByRole("heading", { name: "경쟁 서비스 5곳 비교" }),
  ).toBeVisible();
  await expect(
    professorPage.getByRole("button", { name: "활동 기록하기" }),
  ).toHaveCount(0);
  await memberContext.close();
  await professorContext.close();
});

test("모바일 화면·새 팀 생성·새로고침 후 복원", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "팀 생성하기" }).first().click();
  await page.getByRole("link", { name: "새 팀 만들기", exact: true }).click();
  await page.getByLabel("팀 이름").fill("함께하는 3조");
  await page.getByLabel("프로젝트 주제").fill("지역의 문제를 함께 해결해요");
  await page.getByLabel("팀원에게 보일 내 이름").fill("김나나");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "새 팀 만들기", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "함께하는 3조" }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "아이디어" }).check();
  await page.getByRole("button", { name: "이걸로 할게요" }).click();
  await page.getByRole("button", { name: "현재 1명으로 역할 추천" }).click();
  await page.getByRole("button", { name: "할 일 추가", exact: true }).click();
  await page.getByLabel("할 일", { exact: true }).fill("인터뷰 진행");
  await page.getByRole("button", { name: "할 일 저장" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "인터뷰 진행" }),
  ).toBeVisible();
  for (const tab of [
    "오늘 우리 팀",
    "활동 기록",
    "팀원과 역할",
    "상호 평가",
    "초대",
  ]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: "test-results/team-invite-mobile.png",
    fullPage: true,
  });
});

test("문의와 사전 신청, 개인정보 모달과 잘못된 초대 코드", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "사전 신청", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("이름", { exact: true }).fill("테스트");
  await dialog.getByLabel("이메일", { exact: true }).fill("test@example.com");
  await dialog.getByRole("checkbox").check();
  await dialog
    .getByRole("button", { name: "사전 신청하기", exact: true })
    .click();
  await expect(
    dialog.getByRole("heading", { name: "사전 신청이 저장되었어요." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("button", { name: "개인정보 안내", exact: true })
    .click();
  await expect(dialog).toContainText("이전 사이트의 데이터는");
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.goto("/lab/join");
  await page.getByLabel("팀원용 초대 코드 (M-)").fill("M-INVALID");
  await page.getByLabel("내 이름", { exact: true }).fill("테스트");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "팀방 입장하기" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "초대 코드를 찾을 수 없어요.",
  );
});
