import { createApi } from "../shared/team-api.mjs";

const storageKey = "dagachi.browser-demo.data.v1";
function openDatabase() {
  let data;
  try {
    data = JSON.parse(
      localStorage.getItem(storageKey) ||
        '{"teams":[],"sessions":[],"submissions":[]}',
    );
    if (![data.teams, data.sessions, data.submissions].every(Array.isArray))
      throw new Error();
  } catch {
    throw new Error(
      "이 브라우저의 체험 데이터를 읽을 수 없어요. 다른 브라우저에서 새로 체험해 주세요.",
    );
  }
  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      throw new Error(
        "브라우저 저장 공간을 사용할 수 없어요. 저장 설정과 남은 용량을 확인해 주세요.",
      );
    }
  }
  return {
    prepare(query) {
      const sql = query.replace(/\s+/g, " ").trim().toLowerCase();
      return {
        get(...args) {
          if (sql.includes("json_extract"))
            return data.teams.find((t) => {
              const team = JSON.parse(t.data);
              return (
                team.memberCode === args[0] || team.professorCode === args[1]
              );
            });
          if (sql.startsWith("select data from teams where id"))
            return data.teams.find((t) => t.id === args[0]);
          if (sql.startsWith("select * from sessions where token"))
            return data.sessions.find(
              (s) => s.token === args[0] && s.team_id === args[1],
            );
          throw new Error("지원하지 않는 체험 데이터 조회입니다.");
        },
        run(...args) {
          if (sql.startsWith("insert or replace into teams")) {
            data.teams = data.teams.filter((t) => t.id !== args[0]);
            data.teams.push({ id: args[0], data: args[1] });
          } else if (sql.startsWith("insert into sessions")) {
            data.sessions.push({
              token: args[0],
              team_id: args[1],
              member_id: args[2],
              kind: args[3],
            });
          } else throw new Error("지원하지 않는 체험 데이터 저장입니다.");
          save();
        },
      };
    },
  };
}
export function demoRequest(url, input, token) {
  if (url === "/api/submissions")
    throw new Error(
      "무료 체험 사이트에서는 문의나 사전 신청을 접수하지 않습니다.",
    );
  const api = createApi(openDatabase(), {
    randomHex(size) {
      return Array.from(crypto.getRandomValues(new Uint8Array(size)), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
    },
    // This is local UI state, not server authentication. No token is sent anywhere.
    hashToken: (value) => `browser-demo:${value}`,
  });
  return structuredClone(
    api(
      {
        method: input === undefined ? "GET" : "POST",
        headers: { authorization: token ? `Bearer ${token}` : "" },
      },
      url,
      input || {},
    ),
  );
}
