export const fail = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

export function createApi(db, { randomHex, hashToken }) {
  const preferences = ["자료조사", "아이디어", "PPT", "발표", "상관없음"];
  const id = () => randomHex(10);
  const hash = hashToken;
  const text = (value, name, max = 200, optional = false) => {
    if (
      typeof value !== "string" ||
      (!optional && !value.trim()) ||
      value.length > max
    )
      fail(`${name}을(를) 확인해 주세요.`);
    return value.trim();
  };
  const date = (value) => {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value || "") ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value + "T00:00:00Z").toISOString().slice(0, 10) !== value
    )
      fail("올바른 날짜를 입력해 주세요.");
    return value;
  };
  const save = (team) =>
    db
      .prepare("INSERT OR REPLACE INTO teams (id, data) VALUES (?, ?)")
      .run(team.id, JSON.stringify(team));
  const read = (teamId) => {
    const row = db.prepare("SELECT data FROM teams WHERE id = ?").get(teamId);
    if (!row) fail("팀방을 찾을 수 없어요.", 404);
    return JSON.parse(row.data);
  };
  const newSession = (teamId, memberId, kind) => {
    const token = randomHex(32);
    db.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?)").run(
      hash(token),
      teamId,
      memberId,
      kind,
    );
    return token;
  };
  function session(req, teamId) {
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");
    const found = db
      .prepare("SELECT * FROM sessions WHERE token = ? AND team_id = ?")
      .get(hash(token), teamId);
    if (!found) fail("초대 코드로 팀방에 다시 입장해 주세요.", 401);
    return found;
  }
  function view(team, auth) {
    const result = structuredClone(team);
    const leader = auth.kind === "leader";
    if (!leader) {
      delete result.memberCode;
      delete result.professorCode;
    }
    result.evaluations = result.evaluations
      .filter(
        (e) =>
          leader || auth.kind === "professor" || e.authorId === auth.member_id,
      )
      .map((e) => {
        if (auth.kind !== "professor") {
          delete e.authorId;
          delete e.authorName;
        }
        return e;
      });
    result.viewer = { memberId: auth.member_id, kind: auth.kind };
    return result;
  }
  function tasksFor(deadline) {
    return [
      ["브랜드 선정", 17, "자료조사"],
      ["시장조사", 14, "자료조사"],
      ["경쟁사 분석", 14, "자료조사"],
      ["타깃 정의", 10, "아이디어"],
      ["전략 아이디어", 7, "아이디어"],
      ["PPT 제작", 3, "PPT"],
      ["발표 준비", 0, "발표"],
    ].map(([title, offset, category]) => {
      const d = new Date(deadline + "T12:00:00Z");
      d.setUTCDate(d.getUTCDate() - offset);
      return {
        id: id(),
        title,
        date: d.toISOString().slice(0, 10),
        category,
        assigneeId: null,
        status: "todo",
      };
    });
  }
  function api(req, pathname, input) {
    if (pathname === "/api/health") return { ok: true };
    if (pathname === "/api/teams" && req.method === "POST") {
      if (input.consent !== true) fail("저장·공유 동의가 필요해요.");
      const memberId = id();
      const deadline = date(input.deadline);
      const size = Number(input.size || 4);
      if (!Number.isInteger(size) || size < 1 || size > 20)
        fail("팀 인원은 1~20명으로 설정해 주세요.");
      const team = {
        id: id(),
        name: text(input.name, "팀 이름", 80),
        topic: text(input.topic, "프로젝트 주제", 500),
        deadline,
        size,
        meeting: "",
        assigned: false,
        example: !!input.example,
        memberCode: "M-" + randomHex(8).toUpperCase(),
        professorCode: "P-" + randomHex(8).toUpperCase(),
        members: [
          {
            id: memberId,
            name: text(input.memberName, "내 이름", 40),
            role: "선호 선택 중",
            deadline,
            preferences: [],
            leader: true,
          },
        ],
        tasks: input.example ? tasksFor(deadline) : [],
        activities: [],
        evaluations: [],
        createdAt: new Date().toISOString(),
      };
      save(team);
      const token = newSession(team.id, memberId, "leader");
      return {
        team: view(team, { kind: "leader", member_id: memberId }),
        token,
      };
    }
    if (pathname === "/api/join" && req.method === "POST") {
      const code = text(input.code, "초대 코드", 50).toUpperCase();
      const row = db
        .prepare(
          "SELECT data FROM teams WHERE json_extract(data, '$.memberCode') = ? OR json_extract(data, '$.professorCode') = ?",
        )
        .get(code, code);
      if (!row)
        fail("초대 코드를 찾을 수 없어요. 코드를 다시 확인해 주세요.", 404);
      const team = JSON.parse(row.data);
      const professor = code === team.professorCode;
      let memberId = null;
      if (!professor) {
        if (input.consent !== true) fail("저장·공유 동의가 필요해요.");
        if (team.members.length >= team.size) fail("팀방의 정원이 찼어요.");
        memberId = id();
        team.members.push({
          id: memberId,
          name: text(input.name, "내 이름", 40),
          role: "선호 선택 중",
          deadline: team.deadline,
          preferences: [],
          leader: false,
        });
        save(team);
      }
      const kind = professor ? "professor" : "member";
      const token = newSession(team.id, memberId, kind);
      return { team: view(team, { kind, member_id: memberId }), token };
    }
    if (pathname === "/api/submissions" && req.method === "POST") {
      const kind = input.kind === "contact" ? "contact" : "preregister";
      const data = {
        name: text(input.name, "이름", 40),
        email: text(input.email, "이메일", 200),
        message: text(input.message || "", "내용", 4000, true),
      };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        fail("이메일 주소를 확인해 주세요.");
      if (!input.consent) fail("개인정보 수집 동의가 필요해요.");
      db.prepare("INSERT INTO submissions VALUES (?, ?, ?, ?)").run(
        id(),
        kind,
        JSON.stringify(data),
        new Date().toISOString(),
      );
      return { ok: true };
    }
    const match = pathname.match(/^\/api\/teams\/([a-f0-9]+)(?:\/([a-z]+))?$/);
    if (!match) fail("요청을 찾을 수 없어요.", 404);
    const team = read(match[1]);
    const auth = session(req, team.id);
    const action = match[2];
    if (req.method === "GET" && !action) return view(team, auth);
    if (req.method !== "POST" || !action)
      fail("지원하지 않는 요청이에요.", 405);
    if (auth.kind === "professor") fail("교수님은 열람만 할 수 있어요.", 403);
    const me = team.members.find((m) => m.id === auth.member_id);
    if (action === "preferences") {
      if (
        !Array.isArray(input.preferences) ||
        input.preferences.length < 1 ||
        input.preferences.length > 2 ||
        new Set(input.preferences).size !== input.preferences.length ||
        input.preferences.some((p) => !preferences.includes(p))
      )
        fail("선호하는 일을 1~2개 선택해 주세요.");
      me.preferences = input.preferences;
      me.role = input.preferences.join(" · ");
    } else if (action === "assign") {
      if (auth.kind !== "leader") fail("팀장만 역할을 추천할 수 있어요.", 403);
      if (!me.preferences.length) fail("먼저 선호하는 일을 선택해 주세요.");
      const loads = Object.fromEntries(team.members.map((m) => [m.id, 0]));
      team.tasks.forEach((task) => {
        const preferred = team.members.filter((m) =>
          m.preferences.includes(task.category),
        );
        const pool = preferred.length ? preferred : team.members;
        const member = [...pool].sort((a, b) => loads[a.id] - loads[b.id])[0];
        task.assigneeId = member.id;
        loads[member.id]++;
      });
      team.assigned = true;
    } else if (action === "task") {
      if (input.id) {
        const task = team.tasks.find((t) => t.id === input.id);
        if (!task) fail("할 일을 찾을 수 없어요.", 404);
        if (auth.kind !== "leader" && task.assigneeId !== me.id)
          fail("내 할 일만 변경할 수 있어요.", 403);
        if (input.status) {
          if (!["todo", "doing", "done"].includes(input.status))
            fail("올바른 상태를 선택해 주세요.");
          task.status = input.status;
        }
        if (input.title !== undefined)
          task.title = text(input.title, "할 일", 150);
        if (input.date !== undefined) task.date = date(input.date);
        if (input.assigneeId !== undefined && auth.kind === "leader") {
          if (!team.members.some((m) => m.id === input.assigneeId))
            fail("담당자를 확인해 주세요.");
          task.assigneeId = input.assigneeId;
        }
      } else {
        if (team.tasks.length >= 200)
          fail("할 일을 200개까지 등록할 수 있어요.");
        const assigneeId = input.assigneeId || me.id;
        if (auth.kind !== "leader" && assigneeId !== me.id)
          fail("내 할 일만 추가할 수 있어요.", 403);
        if (!team.members.some((m) => m.id === assigneeId))
          fail("담당자를 확인해 주세요.");
        team.tasks.push({
          id: id(),
          title: text(input.title, "할 일", 150),
          date: date(input.date),
          category: "직접 추가",
          assigneeId,
          status: "todo",
        });
      }
    } else if (action === "activity") {
      const link = text(input.link || "", "자료 링크", 2000, true);
      if (link) {
        try {
          const url = new URL(link);
          if (!["http:", "https:"].includes(url.protocol))
            fail("http 또는 https 링크를 입력해 주세요.");
        } catch {
          fail("올바른 자료 링크를 입력해 주세요.");
        }
      }
      team.activities.unshift({
        id: id(),
        authorId: me.id,
        authorName: me.name,
        title: text(input.title, "활동 제목", 150),
        content: text(input.content, "활동 내용", 10000),
        link,
        createdAt: new Date().toISOString(),
      });
    } else if (action === "profile") {
      me.name = text(input.name, "이름", 40);
      me.role = text(input.role, "역할", 100);
      me.deadline = date(input.deadline);
    } else if (action === "schedule") {
      if (auth.kind !== "leader")
        fail("팀장만 팀 일정을 변경할 수 있어요.", 403);
      team.deadline = date(input.deadline);
      team.meeting = input.meeting ? date(input.meeting) : "";
    } else if (action === "evaluation") {
      const target = team.members.find(
        (m) => m.id === input.targetId && m.id !== me.id,
      );
      if (!target) fail("평가할 팀원을 선택해 주세요.");
      const scores = input.scores;
      if (
        !Array.isArray(scores) ||
        scores.length !== 3 ||
        scores.some((n) => !Number.isInteger(n) || n < 1 || n > 5)
      )
        fail("각 항목을 1~5점으로 평가해 주세요.");
      const evaluation = {
        id: id(),
        targetId: target.id,
        targetName: target.name,
        authorId: me.id,
        authorName: me.name,
        scores,
        comment: text(input.comment || "", "의견", 2000, true),
        createdAt: new Date().toISOString(),
      };
      team.evaluations = team.evaluations.filter(
        (e) => !(e.targetId === target.id && e.authorId === me.id),
      );
      team.evaluations.push(evaluation);
    } else fail("요청을 찾을 수 없어요.", 404);
    save(team);
    return view(team, auth);
  }

  return api;
}
