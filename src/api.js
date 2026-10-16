import { IS_BROWSER_DEMO } from "./config";
export async function request(url, data, token) {
  if (IS_BROWSER_DEMO) {
    const { demoRequest } = await import("./browser-demo");
    return demoRequest(url, data, token);
  }
  const response = await fetch(url, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error || "요청을 완료하지 못했어요. 다시 시도해 주세요.",
    );
  return result;
}
const key = IS_BROWSER_DEMO ? "dagachi.demo.rooms.v1" : "dagachi.rooms.v1";
export function savedRooms() {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
export function remember({ team, token }) {
  const rooms = savedRooms().filter((r) => r.id !== team.id);
  localStorage.setItem(
    key,
    JSON.stringify([
      { id: team.id, name: team.name, token, kind: team.viewer.kind },
      ...rooms,
    ]),
  );
}
export function tokenFor(teamId) {
  return savedRooms().find((r) => r.id === teamId)?.token;
}
export const localDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function daysUntil(date) {
  return Math.round(
    (Date.parse(date + "T12:00:00Z") - Date.parse(localDate() + "T12:00:00Z")) /
      86400000,
  );
}
export const sampleTasks = [
  { title: "브랜드 선정", date: "2026-10-20", week: 1 },
  { title: "시장조사", date: "2026-10-23", week: 1 },
  { title: "경쟁사 분석", date: "2026-10-23", week: 1 },
  { title: "타깃 정의", date: "2026-10-27", week: 2 },
  { title: "전략 아이디어", date: "2026-10-30", week: 2 },
  { title: "PPT 제작", date: "2026-11-03", week: 3 },
  { title: "발표 준비", date: "2026-11-06", week: 3 },
];
