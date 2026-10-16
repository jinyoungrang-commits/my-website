import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Check,
  Plus,
  CalendarDays,
  Compass,
  NotebookPen,
  Users,
  Copy,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";
import { Header, Footer, Arrow, Field, Empty, ErrorText, useUI } from "../main";
import { request, tokenFor, daysUntil, localDate } from "../api";
import { IS_BROWSER_DEMO, inviteUrl } from "../config";

const tabs = [
  ["today", "오늘 우리 팀"],
  ["activity", "활동 기록"],
  ["members", "팀원과 역할"],
  ["reviews", "상호 평가"],
  ["invite", "초대"],
];
export function Team() {
  const { teamId } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = tabs.some((t) => t[0] === params.get("tab"))
    ? params.get("tab")
    : "today";
  const [team, setTeam] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inMutation = useRef(false);
  const { notify } = useUI();
  const token = tokenFor(teamId);
  async function load() {
    if (!token) {
      setError(
        "이 브라우저에서는 아직 참여하지 않은 팀방이에요. 초대 코드로 입장해 주세요.",
      );
      return;
    }
    try {
      const next = await request(`/api/teams/${teamId}`, undefined, token);
      if (!inMutation.current) {
        setTeam(next);
        setError("");
      }
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => {
    setTeam(null);
    load();
    const interval = setInterval(() => {
      if (!document.hidden && !inMutation.current) load();
    }, 8000);
    return () => clearInterval(interval);
  }, [teamId, token]);
  async function mutate(action, data, message) {
    inMutation.current = true;
    setBusy(true);
    try {
      const result = await request(
        `/api/teams/${teamId}/${action}`,
        data,
        token,
      );
      setTeam(result);
      setError("");
      if (message) notify(message);
      return result;
    } catch (err) {
      notify(err.message);
      return null;
    } finally {
      inMutation.current = false;
      setBusy(false);
    }
  }
  const me = team?.members.find((m) => m.id === team.viewer.memberId);
  const readonly = team?.viewer.kind === "professor";
  const leader = team?.viewer.kind === "leader";
  const shared = {
    team,
    me,
    readonly,
    leader,
    mutate,
    busy,
    changeTab: (value) => setParams({ tab: value }),
  };
  return (
    <>
      <Header />
      <main className="team-page content-width">
        <div className="team-toolbar">
          <Link className="back-link" to="/lab">
            <ArrowLeft size={18} /> 실험실 홈
          </Link>
          <button
            className="button small outline"
            disabled={busy}
            onClick={async () => {
              await load();
            }}
          >
            <RefreshCw size={18} /> 새로고침
          </button>
        </div>
        <nav className="team-tabs" aria-label="팀방 메뉴">
          {tabs
            .filter((t) => !readonly || t[0] !== "invite")
            .map(([value, label]) => (
              <button
                key={value}
                className={tab === value ? "active" : ""}
                aria-current={tab === value ? "page" : undefined}
                onClick={() => setParams({ tab: value })}
              >
                {label}
              </button>
            ))}
        </nav>
        {readonly && (
          <p className="readonly-banner">
            교수님으로 열람 중이에요. 활동과 상호 평가 결과를 확인할 수
            있습니다.
          </p>
        )}
        {error && (
          <div className="card room-error">
            <ErrorText>{error}</ErrorText>
            <Link to="/lab/join" className="button lime">
              초대 코드로 참여
            </Link>
          </div>
        )}
        {!team && !error && (
          <div className="loading" role="status">
            <LoaderCircle className="spin" /> 팀방을 불러오고 있어요.
          </div>
        )}
        {team && (
          <div className="tab-content" key={`${teamId}-${tab}`}>
            {tab === "today" && <Today {...shared} />}
            {tab === "activity" && <Activity {...shared} />}
            {tab === "members" && <Members {...shared} />}
            {tab === "reviews" && <Reviews {...shared} />}
            {tab === "invite" &&
              (leader ? (
                <Invites {...shared} />
              ) : (
                <div className="card">
                  <h2>팀원 초대</h2>
                  <p className="muted">
                    팀장에게 초대 코드 또는 초대 링크를 요청해 주세요.
                  </p>
                </div>
              ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function Guide() {
  return (
    <aside className="guide notice">
      <p className="guide-label">
        <Compass size={24} /> 나침반 · 규칙 기반 가이드
      </p>
      <h2>프로젝트의 추천 진행 방향</h2>
      <div className="guide-grid">
        {[
          [
            "문헌·사례조사",
            "핵심 개념과 유사 사례 3개를 먼저 모아요.",
            "전체 기간의 첫 25%",
          ],
          [
            "기획·데이터 분석",
            "가설과 판단 기준을 정하고 근거를 표로 정리해요.",
            "전체 기간의 25~60%",
          ],
          [
            "발표자료·리허설",
            "결론부터 슬라이드로 옮기고 최소 2일 전에 리허설해요.",
            "마감 2일 전까지",
          ],
        ].map(([title, copy, time]) => (
          <div key={title}>
            <h3>{title}</h3>
            <p>{copy}</p>
            <small>{time}</small>
          </div>
        ))}
      </div>
      <small>
        추천안을 참고해 팀장이 실제 할 일과 담당자·마감일을 수정해 확정하세요.
      </small>
    </aside>
  );
}

function Today({ team, me, leader, readonly, mutate, busy, changeTab }) {
  const [selected, setSelected] = useState(me?.preferences || []);
  const [addOpen, setAddOpen] = useState(false);
  const allDone = team.tasks.filter((t) => t.status === "done").length;
  const progress = team.tasks.length
    ? Math.round((allDone / team.tasks.length) * 100)
    : 0;
  const myTasks = readonly
    ? team.tasks
    : team.tasks.filter((t) => t.assigneeId === me?.id);
  function select(value) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : current.length < 2
          ? [...current, value]
          : current,
    );
  }
  return (
    <div className="team-narrow">
      <p className="helper">
        {team.assigned
          ? "오늘 우리 팀"
          : team.example
            ? "예시 과제 플랜"
            : "새로운 팀플"}
      </p>
      <h1 className="team-title">
        {team.name}
        {team.assigned && (
          <span className="pill soft">
            {daysUntil(team.deadline) >= 0
              ? `D-${daysUntil(team.deadline)}`
              : `D+${Math.abs(daysUntil(team.deadline))}`}
          </span>
        )}
      </h1>
      {!team.assigned ? (
        <>
          <section className="card onboarding-invite">
            <h2>
              팀방이 준비됐어요.
              <br />
              팀원을 초대해 주세요.
            </h2>
            <p className="muted">
              링크로 들어온 팀원은 이름과 선호만 고르면 돼요.
            </p>
            {leader ? (
              <>
                <div className="action-row compact">
                  <CopyButton
                    text={inviteUrl(team.memberCode)}
                    className="lime"
                  >
                    팀원 초대 링크 복사
                  </CopyButton>
                  <button
                    className="button small outline"
                    onClick={() => changeTab("invite")}
                  >
                    교수님 초대
                  </button>
                </div>
                <small className="helper">팀원 코드: {team.memberCode}</small>
              </>
            ) : (
              <p className="helper">새 팀원 초대는 팀장에게 요청해 주세요.</p>
            )}
          </section>
          {!readonly && (
            <section className="card preference-card">
              <h2>
                이번 팀플에서 어떤 일을
                <br />
                가장 하고 싶나요?
              </h2>
              <p className="muted">1~2개만 골라 주세요.</p>
              <div className="preferences">
                {["자료조사", "아이디어", "PPT", "발표", "상관없음"].map(
                  (value) => (
                    <label
                      className={`preference ${selected.includes(value) ? "chosen" : ""}`}
                      key={value}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(value)}
                        disabled={
                          !selected.includes(value) && selected.length >= 2
                        }
                        onChange={() => select(value)}
                      />
                      {value}
                    </label>
                  ),
                )}
              </div>
              <button
                className="button lime"
                disabled={!selected.length || busy}
                onClick={() =>
                  mutate(
                    "preferences",
                    { preferences: selected },
                    "선호하는 일을 저장했어요.",
                  )
                }
              >
                이걸로 할게요
              </button>
            </section>
          )}
          <section className="card waiting-card">
            <h2>
              우리 팀을 기다리고 있어요{" "}
              <small>
                {team.members.length}/{team.size}명
              </small>
            </h2>
            {team.members.map((m) => (
              <p className="muted member-waiting" key={m.id}>
                {m.name} ·{" "}
                {m.preferences.length
                  ? m.preferences.join(" · ")
                  : "선호 선택 중"}
              </p>
            ))}
            <p className="helper">
              상단 ‘초대’에서 팀원용 링크와 교수님용 링크를 따로 복사할 수
              있어요.
              <br />
              {team.members.length < team.size
                ? "아직 모두 참여하지 않았어요. 현재 인원으로 먼저 시작할 수도 있어요."
                : "모두 모였어요. 역할을 추천하고 함께 시작해 보세요."}
            </p>
            {leader && (
              <button
                className="button lime"
                disabled={busy || !me?.preferences.length}
                onClick={() =>
                  mutate(
                    "assign",
                    {},
                    "선호를 참고해 할 일을 배정했어요. 팀에 맞게 수정해 주세요.",
                  )
                }
              >
                현재 {team.members.length}명으로 역할 추천
              </button>
            )}
          </section>
          <details className="disclosure">
            <summary>추천 플랜 다시 보기</summary>
            <p className="muted">{team.topic}</p>
            <TaskOverview team={team} />
          </details>
        </>
      ) : (
        <>
          <section className="card todos-card">
            <h2>
              {readonly ? "우리 팀이 할 일" : "내가 할 일"}{" "}
              <small>{myTasks.filter((t) => t.status !== "done").length}</small>
            </h2>
            {myTasks.length ? (
              <div className="task-list">
                {myTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    readonly={readonly}
                    busy={busy}
                    mutate={mutate}
                  />
                ))}
              </div>
            ) : (
              <p className="muted no-tasks">
                아직 등록된 할 일이 없어요. 아래에서 첫 할 일을 추가해 보세요.
              </p>
            )}
            {!readonly && (
              <>
                <button
                  className="text-button add-task-button"
                  onClick={() => setAddOpen(!addOpen)}
                  aria-expanded={addOpen}
                >
                  <Plus size={18} /> 할 일 추가
                </button>
                {addOpen && (
                  <TaskForm
                    team={team}
                    me={me}
                    leader={leader}
                    busy={busy}
                    mutate={mutate}
                    onDone={() => setAddOpen(false)}
                  />
                )}
              </>
            )}
          </section>
          <Guide />
          <section className="progress-section">
            <h2>
              우리 팀은 지금 <span className="olive">{progress}%</span>
            </h2>
            {team.members.map((m) => {
              const tasks = team.tasks.filter((t) => t.assigneeId === m.id);
              const done = tasks.filter((t) => t.status === "done").length;
              return (
                <div className="member-progress" key={m.id}>
                  <span>
                    {m.name}{" "}
                    {m.id === me?.id && <small className="me-badge">나</small>}
                  </span>
                  <progress
                    max={Math.max(tasks.length, 1)}
                    value={done}
                    aria-label={`${m.name}의 할 일 완료율`}
                  />
                  <div>
                    <span>
                      {!tasks.length || !done
                        ? "시작 전"
                        : done === tasks.length
                          ? "모두 완료"
                          : "진행 중"}
                    </span>
                    <small>
                      {done}/{tasks.length}
                    </small>
                  </div>
                </div>
              );
            })}
            <p className="helper">
              등록된 할 일의 완료 비율이에요. 활동의 질이나 최종 기여도를
              평가하는 점수는 아닙니다.
            </p>
          </section>
          <aside className="meeting-notice">
            <CalendarDays size={25} />
            <strong>
              {team.meeting
                ? `다음 회의 · ${team.meeting}`
                : "다음 회의 일정을 기다리고 있어요"}
            </strong>
          </aside>
          <details className="disclosure calendar-disclosure">
            <summary>캘린더 · 팀 일정</summary>
            <TeamCalendar team={team} />
          </details>
          {leader && (
            <details className="disclosure">
              <summary>팀 마감 · 회의 날짜 설정</summary>
              <ScheduleForm team={team} busy={busy} mutate={mutate} />
            </details>
          )}
          <details className="disclosure">
            <summary>
              전체 할 일 · 담당자와 마감일{leader ? " 수정" : ""}
            </summary>
            <TaskOverview team={team} />
            {leader && (
              <div className="task-edit-list">
                {team.tasks.map((task) => (
                  <TaskEdit
                    key={task.id}
                    task={task}
                    team={team}
                    mutate={mutate}
                    busy={busy}
                  />
                ))}
              </div>
            )}
          </details>
        </>
      )}
    </div>
  );
}
function TaskRow({ task, readonly, busy, mutate }) {
  const remaining = daysUntil(task.date);
  const done = task.status === "done";
  return (
    <article className={`task-row ${done ? "completed" : ""}`}>
      <div>
        <span
          className={`task-date ${remaining < 0 && !done ? "overdue" : ""}`}
        >
          {done
            ? "완료"
            : remaining > 0
              ? `${remaining}일 남음`
              : remaining === 0
                ? "오늘 마감"
                : `${Math.abs(remaining)}일 지남`}
        </span>
        <h3>{task.title}</h3>
      </div>
      <div className="task-actions">
        {!readonly && (
          <>
            <button
              className={`button ${done ? "outline" : "lime"}`}
              disabled={busy}
              onClick={() =>
                mutate(
                  "task",
                  { id: task.id, status: done ? "todo" : "done" },
                  done
                    ? "할 일을 다시 열었어요."
                    : "할 일을 완료했어요. 수고하셨어요!",
                )
              }
            >
              <Check size={18} />
              {done ? "완료 취소" : "완료하기"}
            </button>
            {!done && (
              <button
                disabled={busy || task.status === "doing"}
                className="text-button"
                onClick={() =>
                  mutate(
                    "task",
                    { id: task.id, status: "doing" },
                    "진행 중으로 바꿨어요.",
                  )
                }
              >
                {task.status === "doing" ? "진행 중" : "시작하기"}
              </button>
            )}
          </>
        )}
        {readonly && (
          <span className="pill soft">
            {done ? "완료" : task.status === "doing" ? "진행 중" : "시작 전"}
          </span>
        )}
      </div>
    </article>
  );
}
function TaskForm({ team, me, leader, mutate, busy, onDone }) {
  async function submit(e) {
    e.preventDefault();
    const result = await mutate(
      "task",
      Object.fromEntries(new FormData(e.currentTarget)),
      "할 일을 추가했어요.",
    );
    if (result) onDone();
  }
  return (
    <form className="stack-form add-task-form" onSubmit={submit}>
      <Field label="할 일">
        <input
          name="title"
          required
          maxLength={150}
          placeholder="예: 발표 자료 초안 만들기"
        />
      </Field>
      <div className="form-grid">
        <Field label="마감일">
          <input
            name="date"
            type="date"
            defaultValue={team.deadline}
            required
          />
        </Field>
        {leader && (
          <Field label="담당자">
            <select name="assigneeId" defaultValue={me.id}>
              {team.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
      <button className="button lime" disabled={busy}>
        할 일 저장 <Plus size={18} />
      </button>
    </form>
  );
}
function TaskOverview({ team }) {
  return (
    <div className="task-overview">
      {team.tasks.length ? (
        team.tasks.map((t) => (
          <div key={t.id}>
            <span>
              {t.status === "done" ? "✓" : "·"} {t.title}
            </span>
            <small>
              {team.members.find((m) => m.id === t.assigneeId)?.name ||
                "배정 전"}{" "}
              · {t.date}
            </small>
          </div>
        ))
      ) : (
        <p className="muted">역할 추천 후 할 일을 직접 추가해 주세요.</p>
      )}
    </div>
  );
}
function TaskEdit({ task, team, mutate, busy }) {
  async function submit(e) {
    e.preventDefault();
    await mutate(
      "task",
      { id: task.id, ...Object.fromEntries(new FormData(e.currentTarget)) },
      "할 일을 수정했어요.",
    );
  }
  return (
    <form onSubmit={submit} className="task-edit-form">
      <Field label="할 일 이름">
        <input
          name="title"
          defaultValue={task.title}
          required
          maxLength={150}
        />
      </Field>
      <Field label="담당자">
        <select
          name="assigneeId"
          defaultValue={task.assigneeId || team.members[0].id}
        >
          {team.members.map((m) => (
            <option value={m.id} key={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="마감일">
        <input name="date" type="date" defaultValue={task.date} required />
      </Field>
      <button className="button small outline" disabled={busy}>
        저장
      </button>
    </form>
  );
}

function ScheduleForm({ team, busy, mutate }) {
  async function submit(e) {
    e.preventDefault();
    await mutate(
      "schedule",
      Object.fromEntries(new FormData(e.currentTarget)),
      "일정을 저장했어요.",
    );
  }
  return (
    <form onSubmit={submit} className="stack-form schedule-form">
      <Field label="프로젝트 마감">
        <input
          name="deadline"
          type="date"
          required
          defaultValue={team.deadline}
        />
      </Field>
      <Field label="다음 회의">
        <input name="meeting" type="date" defaultValue={team.meeting} />
      </Field>
      <button className="button lime" disabled={busy}>
        일정 저장
      </button>
    </form>
  );
}
function TeamCalendar({ team }) {
  const today = localDate();
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [year, mon] = month.split("-").map(Number);
  const days = new Date(year, mon, 0).getDate();
  const first = new Date(year, mon - 1, 1).getDay();
  function move(amount) {
    const next = new Date(year, mon - 1 + amount, 1);
    setMonth(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  const entries = team.tasks.filter((t) => t.date === selected);
  const meeting = team.meeting === selected;
  const deadline = team.deadline === selected;
  return (
    <div className="team-calendar">
      <div className="calendar-nav">
        <button
          className="icon-button"
          onClick={() => move(-1)}
          aria-label="이전 달"
        >
          <ChevronLeft size={20} />
        </button>
        <h3>
          {year}년 {mon}월
        </h3>
        <button
          className="icon-button"
          onClick={() => move(1)}
          aria-label="다음 달"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="calendar-grid">
        {"일월화수목금토".split("").map((day) => (
          <div className="day-label" key={day}>
            {day}
          </div>
        ))}
        {Array.from({ length: first }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = `${month}-${String(i + 1).padStart(2, "0")}`;
          const hasEvent =
            team.tasks.some((t) => t.date === d) ||
            team.meeting === d ||
            team.deadline === d;
          return (
            <button
              key={d}
              className={`calendar-day ${d === selected ? "selected" : ""} ${d === today ? "is-today" : ""}`}
              onClick={() => setSelected(d)}
              aria-label={`${d}${hasEvent ? " 일정 있음" : ""}`}
              aria-pressed={d === selected}
            >
              {i + 1}
              {hasEvent && <span className="event-dot" />}
            </button>
          );
        })}
      </div>
      <div className="calendar-events">
        <h3>{selected}</h3>
        {!entries.length && !meeting && !deadline ? (
          <p className="muted">등록된 일정이 없어요.</p>
        ) : (
          <ul>
            {meeting && <li>팀 회의</li>}
            {deadline && <li>프로젝트 마감</li>}
            {entries.map((t) => (
              <li key={t.id}>
                {t.title}{" "}
                <small>
                  {team.members.find((m) => m.id === t.assigneeId)?.name}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Activity({ team, me, readonly, mutate, busy }) {
  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const result = await mutate(
      "activity",
      Object.fromEntries(new FormData(form)),
      "함께한 과정을 기록했어요.",
    );
    if (result) form.reset();
  }
  return (
    <div
      className={`two-columns activity-layout ${readonly ? "read-only-columns" : ""}`}
    >
      <section className="card activity-feed">
        <h2>함께한 과정</h2>
        {!team.activities.length ? (
          <Empty icon={NotebookPen} title="첫 기록을 기다리고 있어요">
            완성본이 아니어도 괜찮아요.
            <br />
            지금까지 한 만큼 남겨보세요.
          </Empty>
        ) : (
          <div className="activity-items">
            {team.activities.map((a) => (
              <article className="activity-item" key={a.id}>
                <div className="activity-author">
                  <span className="avatar small-avatar">{a.authorName[0]}</span>
                  <strong>{a.authorName}</strong>
                  <time dateTime={a.createdAt}>
                    {new Intl.DateTimeFormat("ko-KR", {
                      timeZone: "Asia/Seoul",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(a.createdAt))}
                  </time>
                </div>
                <h3>{a.title}</h3>
                <p className="activity-content">{a.content}</p>
                {a.link && (
                  <a
                    className="evidence-link"
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    근거 자료 보기 <ExternalLink size={16} />
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      {!readonly && (
        <form className="card stack-form activity-form" onSubmit={submit}>
          <h2>오늘의 과정 남기기</h2>
          <Field label="활동 제목">
            <input
              name="title"
              required
              maxLength={150}
              placeholder="예: 경쟁 서비스 5곳 비교"
            />
          </Field>
          <Field label="어떤 일을 했나요?">
            <textarea
              name="content"
              required
              maxLength={10000}
              placeholder="진행한 내용, 발견한 점, 다음 할 일을 적어 주세요."
            />
          </Field>
          <Field label="근거 자료 링크" hint="선택">
            <input
              name="link"
              type="url"
              maxLength={2000}
              placeholder="https://..."
            />
          </Field>
          <p className="helper">
            공유 문서의 열람 권한도 팀원에게 열어 주세요.
          </p>
          <button className="button lime" disabled={busy}>
            활동 기록하기 <Plus size={19} />
          </button>
        </form>
      )}
    </div>
  );
}
function Members({ team, me, readonly, mutate, busy }) {
  async function submit(e) {
    e.preventDefault();
    await mutate(
      "profile",
      Object.fromEntries(new FormData(e.currentTarget)),
      "내 정보를 저장했어요.",
    );
  }
  return (
    <>
      <section className="card members-card">
        <h2>각자의 역할, 함께의 목표</h2>
        <div className="members-grid">
          {team.members.map((member) => (
            <article className="card member-card" key={member.id}>
              <span className="avatar">{member.name[0]}</span>
              <h3>
                {member.name} <small>{member.leader ? "팀장" : "팀원"}</small>
              </h3>
              <p>{member.role}</p>
              <p>기한 {member.deadline}</p>
              <p className="olive member-count">
                활동 기록{" "}
                {team.activities.filter((a) => a.authorId === member.id).length}
                개
              </p>
            </article>
          ))}
        </div>
      </section>
      {!readonly && (
        <form className="card stack-form profile-form" onSubmit={submit}>
          <h2>내 정보 수정</h2>
          <div className="form-grid three">
            <Field label="이름">
              <input
                name="name"
                defaultValue={me.name}
                required
                maxLength={40}
              />
            </Field>
            <Field label="역할">
              <input
                name="role"
                defaultValue={me.role}
                required
                maxLength={100}
              />
            </Field>
            <Field label="기한">
              <input
                name="deadline"
                type="date"
                defaultValue={me.deadline}
                required
              />
            </Field>
          </div>
          <button className="button lime" disabled={busy}>
            변경 저장 <Check size={18} />
          </button>
        </form>
      )}
    </>
  );
}
function Reviews({ team, me, readonly, mutate, busy }) {
  const targets = team.members.filter((m) => m.id !== me?.id);
  const [targetId, setTargetId] = useState(targets[0]?.id || "");
  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const result = await mutate(
      "evaluation",
      {
        targetId,
        scores: ["participation", "responsibility", "communication"].map((k) =>
          Number(data.get(k)),
        ),
        comment: data.get("comment"),
      },
      "상호 평가를 저장했어요.",
    );
    if (result) form.reset();
  }
  return (
    <div className="two-columns review-layout">
      <section className="card review-results">
        <h2>상호 평가 결과</h2>
        <p className="helper review-description">
          평가자 이름은 교수님에게만 표시됩니다. 팀장·교수님은 전체 결과를,
          팀원은 자신이 작성한 평가를 볼 수 있어요. 1점(보완 필요)부터 5점(매우
          좋음)까지의 참고 의견이며 성적이 아닙니다.
        </p>
        {!team.evaluations.length ? (
          <Empty icon={Users} title="아직 작성된 평가가 없어요." />
        ) : (
          <div className="evaluation-list">
            {team.evaluations.map((e) => (
              <article className="evaluation" key={e.id}>
                <h3>
                  {e.targetName}{" "}
                  <small>
                    평균 {(e.scores.reduce((a, b) => a + b, 0) / 3).toFixed(1)}{" "}
                    / 5
                  </small>
                </h3>
                <p className="helper">
                  {readonly ? `작성자 · ${e.authorName}` : "팀원 의견"} ·{" "}
                  {e.createdAt.slice(0, 10)}
                </p>
                <div className="score-summary">
                  {["참여도", "책임감", "소통"].map((title, i) => (
                    <span key={title}>
                      {title} <strong>{e.scores[i]}</strong>
                    </span>
                  ))}
                </div>
                {e.comment && <p className="activity-content">{e.comment}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
      {!readonly && (
        <section className="card">
          <h2>동료의 기여 돌아보기</h2>
          {!targets.length ? (
            <p className="helper">
              다른 팀원이 참여하면 상호 평가를 시작할 수 있어요.
            </p>
          ) : (
            <form className="stack-form review-form" onSubmit={submit}>
              <Field label="평가할 팀원">
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                >
                  {targets.map((m) => (
                    <option value={m.id} key={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>
              {[
                ["participation", "참여도"],
                ["responsibility", "책임감"],
                ["communication", "소통"],
              ].map(([name, title]) => (
                <Field label={title} key={name}>
                  <select name={name} required defaultValue="">
                    <option value="" disabled>
                      점수 선택
                    </option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}점
                        {n === 1
                          ? " · 보완 필요"
                          : n === 5
                            ? " · 매우 좋음"
                            : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
              <Field label="함께한 과정에 대한 의견 (선택)">
                <textarea
                  name="comment"
                  maxLength={2000}
                  placeholder="동료의 기여와 다음에 함께 개선할 점을 적어 주세요."
                />
              </Field>
              <button className="button lime" disabled={busy}>
                평가 저장 <Check size={18} />
              </button>
              <p className="helper">
                같은 팀원을 다시 평가하면 이전 평가가 수정됩니다.
              </p>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
function CopyButton({ text, children, className = "outline", icon = false }) {
  const { notify } = useUI();
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify("클립보드에 복사했어요.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify(
        "브라우저에서 복사가 허용되지 않았어요. 아래 초대 코드를 선택해 복사해 주세요.",
      );
    }
  }
  return (
    <button
      type="button"
      className={`button small ${className}`}
      onClick={copy}
    >
      {icon && (copied ? <Check size={18} /> : <Copy size={18} />)}
      {copied ? "복사 완료" : children}
    </button>
  );
}
function Invites({ team }) {
  return (
    <>
      <div className="invite-grid">
        {[
          [
            "팀원 초대",
            "이름·역할·기한을 정하고 활동에 참여해요.",
            team.memberCode,
          ],
          [
            "교수님 초대",
            "활동과 상호 평가 결과를 열람만 해요.",
            team.professorCode,
          ],
        ].map(([title, copy, code]) => (
          <section className="invitation-box" key={title}>
            <h2>{title}</h2>
            <p className="helper">{copy}</p>
            <p className="invite-code">{code}</p>
            <div className="action-row compact">
              <CopyButton text={code} icon>
                코드 복사
              </CopyButton>
              <CopyButton text={inviteUrl(code)}>
                초대 링크 복사 <Arrow />
              </CopyButton>
            </div>
          </section>
        ))}
      </div>
      <p className="helper invitation-help">
        {IS_BROWSER_DEMO
          ? "이 초대 코드와 링크는 같은 브라우저에서 다른 역할을 체험하는 용도입니다. 다른 기기나 브라우저와는 팀방이 공유되지 않습니다."
          : "초대 코드를 가진 사람은 참여할 수 있어요. 교수님용 코드는 공개 게시하지 말고 초대할 분에게만 전달해 주세요."}
      </p>
    </>
  );
}
