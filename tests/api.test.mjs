import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const dataDir = await mkdtemp(path.join(os.tmpdir(), "dagachi-api-"));
const port = 3109;
let server;
async function start() {
  server = spawn(process.execPath, ["server/index.mjs"], {
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDir },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let log = "";
  server.stderr.on("data", (chunk) => {
    log += chunk;
  });
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (res.ok) return;
    } catch {}
    if (server.exitCode !== null) throw new Error(log);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("테스트 서버가 시작되지 않았습니다. " + log);
}
async function stop() {
  if (server.exitCode !== null) return;
  await new Promise((resolve) => {
    server.once("exit", resolve);
    server.kill("SIGTERM");
  });
}
async function api(route, data, token) {
  const response = await fetch(`http://127.0.0.1:${port}/api${route}`, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
  return { status: response.status, data: await response.json() };
}
test("팀방 협업·권한·서버 재시작 검증", async (t) => {
  await start();
  t.after(async () => {
    await stop();
    await rm(dataDir, { recursive: true, force: true });
  });
  let leader, member, professor, outsider;
  let room;
  await t.test(
    "예시 팀방 생성, 동의·날짜 검증, 인증 없는 열람 차단",
    async () => {
      const values = {
        name: "마케팅관리 팀플",
        topic: "시장과 타깃 분석",
        deadline: "2026-11-06",
        size: 4,
        memberName: "김나나",
        example: true,
        consent: true,
      };
      assert.equal(
        (await api("/teams", { ...values, consent: false })).status,
        400,
      );
      assert.equal(
        (await api("/teams", { ...values, deadline: "2026-02-31" })).status,
        400,
      );
      const result = await api("/teams", values);
      assert.equal(result.status, 200);
      leader = result.data;
      room = leader.team.id;
      assert.equal(leader.team.tasks.length, 7);
      assert.equal(leader.team.tasks[0].date, "2026-10-20");
      assert.equal((await api(`/teams/${room}`)).status, 401);
    },
  );
  await t.test("팀원과 교수님의 별도 초대 및 교수님 쓰기 차단", async () => {
    member = (
      await api("/join", {
        code: leader.team.memberCode,
        name: "이하늘",
        consent: true,
      })
    ).data;
    professor = (await api("/join", { code: leader.team.professorCode })).data;
    assert.equal(member.team.viewer.kind, "member");
    assert.equal(professor.team.viewer.kind, "professor");
    assert.equal(member.team.memberCode, undefined);
    assert.equal(member.team.professorCode, undefined);
    assert.equal(
      (
        await api(
          `/teams/${room}/activity`,
          { title: "위조", content: "차단" },
          professor.token,
        )
      ).status,
      403,
    );
    outsider = (
      await api("/teams", {
        name: "다른 팀",
        topic: "검증",
        deadline: "2026-11-06",
        memberName: "외부인",
        consent: true,
      })
    ).data;
    assert.equal(
      (await api(`/teams/${room}`, undefined, outsider.token)).status,
      401,
    );
  });
  await t.test("선호 저장·역할 배정·다른 팀원 할 일 수정 차단", async () => {
    assert.equal(
      (
        await api(
          `/teams/${room}/preferences`,
          { preferences: ["자료조사"] },
          leader.token,
        )
      ).status,
      200,
    );
    await api(
      `/teams/${room}/preferences`,
      { preferences: ["PPT", "발표"] },
      member.token,
    );
    assert.equal(
      (await api(`/teams/${room}/assign`, {}, member.token)).status,
      403,
    );
    const result = await api(`/teams/${room}/assign`, {}, leader.token);
    assert.equal(result.data.assigned, true);
    const memberTask = result.data.tasks.find(
      (task) => task.title === "PPT 제작",
    );
    assert.equal(memberTask.assigneeId, member.team.viewer.memberId);
    const leaderTask = result.data.tasks.find(
      (task) => task.title === "시장조사",
    );
    assert.equal(
      (
        await api(
          `/teams/${room}/task`,
          { id: leaderTask.id, status: "done" },
          member.token,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await api(
          `/teams/${room}/task`,
          { id: memberTask.id, status: "done" },
          member.token,
        )
      ).status,
      200,
    );
  });
  await t.test(
    "활동 기록 공유, 링크 검증 및 상호 평가의 공개 범위",
    async () => {
      assert.equal(
        (
          await api(
            `/teams/${room}/activity`,
            { title: "조사", content: "내용", link: "javascript:alert(1)" },
            member.token,
          )
        ).status,
        400,
      );
      await api(
        `/teams/${room}/activity`,
        {
          title: "경쟁 서비스 비교",
          content: "자료를 비교하고 인사이트를 정리했어요.",
          link: "https://example.com/research",
        },
        member.token,
      );
      const read = await api(`/teams/${room}`, undefined, professor.token);
      assert.equal(read.data.activities.length, 1);
      await api(
        `/teams/${room}/evaluation`,
        {
          targetId: leader.team.viewer.memberId,
          scores: [5, 4, 5],
          comment: "성실하게 참여했어요.",
        },
        member.token,
      );
      const leaderView = (await api(`/teams/${room}`, undefined, leader.token))
        .data;
      const professorView = (
        await api(`/teams/${room}`, undefined, professor.token)
      ).data;
      assert.equal(leaderView.evaluations[0].authorName, undefined);
      assert.equal(leaderView.evaluations[0].authorId, undefined);
      assert.equal(professorView.evaluations[0].authorName, "이하늘");
      const third = (
        await api("/join", {
          code: leader.team.memberCode,
          name: "박초록",
          consent: true,
        })
      ).data;
      assert.equal(third.team.evaluations.length, 0);
    },
  );
  await t.test("프로필과 일정 저장, 팀원 일정 변경 차단", async () => {
    assert.equal(
      (
        await api(
          `/teams/${room}/schedule`,
          { deadline: "2026-11-07", meeting: "2026-10-25" },
          member.token,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await api(
          `/teams/${room}/schedule`,
          { deadline: "2026-11-07", meeting: "2026-10-25" },
          leader.token,
        )
      ).status,
      200,
    );
    const result = await api(
      `/teams/${room}/profile`,
      { name: "이하늘 수정", role: "자료 담당", deadline: "2026-11-01" },
      member.token,
    );
    assert.equal(
      result.data.members.find((m) => m.id === member.team.viewer.memberId)
        .name,
      "이하늘 수정",
    );
  });
  await t.test("서버 재시작 후 팀·활동·일정·로그인 보존", async () => {
    await stop();
    await start();
    const result = await api(`/teams/${room}`, undefined, leader.token);
    assert.equal(result.status, 200);
    assert.equal(result.data.activities.length, 1);
    assert.equal(result.data.meeting, "2026-10-25");
    assert.equal(
      result.data.tasks.find((task) => task.title === "PPT 제작").status,
      "done",
    );
  });
});
