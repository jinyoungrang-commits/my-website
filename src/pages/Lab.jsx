import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ImagePlus,
  Users,
  GraduationCap,
  ArrowLeft,
  Check,
} from "lucide-react";
import {
  Header,
  Footer,
  Arrow,
  Field,
  Consent,
  ErrorText,
  useUI,
} from "../main";
import { request, remember, savedRooms, sampleTasks, localDate } from "../api";
import { IS_BROWSER_DEMO } from "../config";

export function Lab() {
  const [image, setImage] = useState(null);
  const [imageError, setImageError] = useState("");
  const rooms = savedRooms();
  function pickImage(e) {
    const file = e.target.files?.[0];
    if (image) URL.revokeObjectURL(image.url);
    setImage(null);
    setImageError("");
    if (!file) return;
    if (
      !["image/png", "image/jpeg"].includes(file.type) ||
      file.size > 4 * 1024 * 1024
    ) {
      setImageError("PNG 또는 JPG 이미지를 4MB 이하로 선택해 주세요.");
      e.target.value = "";
      return;
    }
    setImage({ name: file.name, url: URL.createObjectURL(file) });
  }
  return (
    <>
      <Header />
      <main className="narrow page-main lab-home">
        <span className="pill lime eyebrow-pill">DAGACHI LAB</span>
        <h1>새 팀플을 시작해요.</h1>
        <p className="intro">
          팀 이름과 프로젝트 주제만 정하면 바로 초대할 수 있어요.
        </p>
        <div className="action-row">
          <Link to="/lab/new" className="button lime">
            새 팀 만들기 <Arrow />
          </Link>
          <Link to="/lab/join" className="button outline">
            초대 코드로 참여 <Users size={19} />
          </Link>
        </div>
        {rooms.length > 0 && (
          <section className="recent-rooms">
            <h3>참여한 팀방 다시 열기</h3>
            {rooms.map((room) => (
              <Link
                className="recent-room"
                key={room.id}
                to={`/lab/team/${room.id}`}
              >
                <span>
                  {room.name}
                  <small>
                    {room.kind === "professor"
                      ? "교수님 · 열람 전용"
                      : room.kind === "leader"
                        ? "팀장"
                        : "팀원"}
                  </small>
                </span>
                <Arrow />
              </Link>
            ))}
          </section>
        )}
        <aside className="notice">
          <strong>나침반으로 계획부터 잡고 싶나요?</strong>
          <p>
            과제 내용을 넣으면 문헌·사례조사, 기획/분석, 발표자료의 권장 순서를
            먼저 볼 수 있어요.
          </p>
        </aside>
        <h2 className="subheading">과제 내용으로 권장 일정 미리보기</h2>
        <div className="upload-box">
          <ImagePlus size={32} />
          <strong>과제 공지 이미지 선택</strong>
          <p>LMS 공지 캡처 · PNG, JPG · 4MB 이하</p>
          <input
            aria-label="과제 공지 이미지"
            type="file"
            accept="image/png,image/jpeg"
            onChange={pickImage}
          />
          {image && (
            <img className="upload-preview" src={image.url} alt={image.name} />
          )}
        </div>
        <ErrorText>{imageError}</ErrorText>
        <Field label="또는 과제 설명 붙여넣기">
          <textarea
            placeholder="교수님의 과제 설명을 그대로 붙여넣으세요."
            maxLength={10000}
          />
        </Field>
        <p className="helper">
          실제 이미지·텍스트 분석은 AI 연결 준비 중이에요. 지금 선택한 자료는
          분석 서버로 전송되지 않습니다.
        </p>
        <button className="button lime" disabled>
          내 과제 분석 · 준비 중
        </button>
        <aside className="example-box">
          <small>지금 바로 체험하기</small>
          <p>
            4인 1조로 브랜드를 선정하고,
            <br />
            시장·타깃 분석과 마케팅 전략을 발표하는 과제예요.
          </p>
          <Link to="/lab/plan" className="button lime">
            예시 과제로 체험하기 <Arrow />
          </Link>
        </aside>
        <Link className="join-bottom" to="/lab/join">
          이미 초대받았나요? 코드로 참여 <Users size={18} />
        </Link>
      </main>
      <Footer />
    </>
  );
}

export function PlanList() {
  return (
    <div className="plan-list">
      {[1, 2, 3].map((week) => (
        <section className="card week-card" key={week}>
          <p>{week}주차</p>
          {sampleTasks
            .filter((t) => t.week === week)
            .map((task) => (
              <div className="plan-task" key={task.title}>
                <Check size={18} />
                <strong>{task.title}</strong>
                <span>{task.date.slice(5)}</span>
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
export function Plan() {
  const [formOpen, setFormOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deadline, setDeadline] = useState("2026-11-06");
  const navigate = useNavigate();
  async function create(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await request("/api/teams", {
        name: "마케팅관리 팀플",
        topic: "브랜드의 시장·타깃을 분석하고 마케팅 전략 발표하기",
        deadline,
        size: 4,
        memberName: form.get("memberName"),
        example: true,
        consent,
      });
      remember(result);
      navigate(`/lab/team/${result.team.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="narrow page-main plan-page">
        <Link className="back-link" to="/lab">
          <ArrowLeft size={18} /> 과제 넣기
        </Link>
        <p className="helper plan-label">
          예시 과제 체험 · 실제 공지 분석 아님
        </p>
        <h1>
          4명이면 이렇게
          <br />
          진행하는 걸 추천해요.
        </h1>
        <p className="plan-meta">마케팅관리 팀플 · {deadline} 마감</p>
        <p className="intro small-intro">
          브랜드의 시장·타깃을 분석하고 마케팅 전략 발표하기
        </p>
        <PlanList />
        <details className="disclosure">
          <summary>과제 요구사항 · 마감일 조정</summary>
          <p className="muted">
            4인 1조로 브랜드를 선정하고, 시장조사·경쟁사 분석·타깃 정의를
            바탕으로 마케팅 전략을 발표합니다.
          </p>
          <Field label="프로젝트 마감">
            <input
              type="date"
              value={deadline}
              required
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>
          <p className="helper">
            위 표는 캡처의 예시 일정입니다. 팀방 생성 시 선택한 마감일을
            기준으로 일정을 조정합니다.
          </p>
        </details>
        {!formOpen ? (
          <button className="button lime" onClick={() => setFormOpen(true)}>
            팀원 초대하고 시작하기 <Arrow />
          </button>
        ) : (
          <form className="card stack-form invite-form" onSubmit={create}>
            <Field label="팀원에게 보일 내 이름">
              <input
                name="memberName"
                required
                maxLength={40}
                placeholder="예: 김나나"
                autoComplete="name"
              />
            </Field>
            <Consent short checked={consent} onChange={setConsent} />
            <ErrorText>{error}</ErrorText>
            <button className="button lime" disabled={!consent || busy}>
              {busy ? "팀방 만드는 중…" : "이 플랜으로 초대하기"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}

export function NewTeam() {
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function create(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    try {
      const result = await request("/api/teams", {
        ...values,
        consent,
        size: Number(values.size),
      });
      remember(result);
      navigate(`/lab/team/${result.team.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="narrow page-main">
        <Link className="back-link" to="/lab">
          <ArrowLeft size={18} /> 실험실 홈
        </Link>
        <span className="pill lime eyebrow-pill">NEW TEAM</span>
        <h1>
          우리의 팀플,
          <br />
          여기서 시작해요.
        </h1>
        <p className="intro">팀방을 만들고, 함께할 팀원을 초대해 보세요.</p>
        <form className="card stack-form" onSubmit={create}>
          <Field label="팀 이름">
            <input
              name="name"
              required
              maxLength={80}
              placeholder="예: 마케팅관리 3조"
            />
          </Field>
          <Field label="프로젝트 주제">
            <textarea
              name="topic"
              required
              maxLength={500}
              placeholder="어떤 프로젝트를 함께하나요?"
            />
          </Field>
          <div className="form-grid">
            <Field label="프로젝트 마감">
              <input
                type="date"
                name="deadline"
                required
                defaultValue={localDate()}
              />
            </Field>
            <Field label="팀 인원">
              <input
                type="number"
                name="size"
                min="1"
                max="20"
                defaultValue="4"
                required
              />
            </Field>
          </div>
          <Field label="팀원에게 보일 내 이름">
            <input
              name="memberName"
              required
              maxLength={40}
              placeholder="내 이름"
              autoComplete="name"
            />
          </Field>
          <Consent checked={consent} onChange={setConsent} />
          <ErrorText>{error}</ErrorText>
          <button className="button lime" disabled={!consent || busy}>
            {busy ? "팀방 만드는 중…" : "새 팀 만들기"} <Arrow />
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}

export function Join() {
  const [params] = useSearchParams();
  const [kind, setKind] = useState(
    params.get("code")?.startsWith("P-") ? "professor" : "member",
  );
  const [code, setCode] = useState(params.get("code") || "");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const professor = kind === "professor";
  async function join(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const name = new FormData(e.currentTarget).get("name");
    try {
      if (professor !== code.trim().toUpperCase().startsWith("P-"))
        throw new Error(
          professor
            ? "교수님용 초대 코드(P-)를 입력해 주세요."
            : "팀원용 초대 코드(M-)를 입력해 주세요.",
        );
      const result = await request("/api/join", { code, name, consent });
      remember(result);
      navigate(`/lab/team/${result.team.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="join-page content-width page-main">
        <div className="join-intro">
          <span className="pill lime eyebrow-pill">TEST DRIVE</span>
          <h1>다가치, 직접 눌러보세요</h1>
          <p className="intro">
            팀방을 만들고, 팀원·교수님을 초대하고.
            <br />
            함께한 과정을 기록하며 상호 평가까지 경험해 보세요.
          </p>
          <aside className="notice">
            <strong>
              {IS_BROWSER_DEMO
                ? "이 브라우저에서 체험하는 무료 사이트예요."
                : "다른 기기에서도 함께 쓰는 체험판이에요."}
            </strong>
            <p>
              {IS_BROWSER_DEMO
                ? "기록은 현재 브라우저에만 저장됩니다. 초대 코드는 같은 브라우저의 새 탭에서 다른 역할을 체험할 때 사용할 수 있어요. 다른 기기나 브라우저에서는 팀방을 공유할 수 없습니다."
                : "입력한 내용은 서버에 저장되어 초대받은 사람과 공유됩니다. 실제 성적 평가용 자료나 민감한 개인정보는 입력하지 마세요. 같은 브라우저에서는 참여한 팀방을 다시 열 수 있어요."}
            </p>
          </aside>
        </div>
        <Link className="back-link" to="/lab">
          과제 넣기로 돌아가기
        </Link>
        <div className="join-choice" role="group" aria-label="참여 유형">
          {[
            [
              "member",
              "02",
              Users,
              "팀원으로 참여하기",
              "받은 코드로 입장하고 이름, 역할, 기한을 정해요.",
            ],
            [
              "professor",
              "03",
              GraduationCap,
              "교수님으로 열람하기",
              "교수님용 초대로 활동 기록과 상호 평가 결과를 확인해요.",
            ],
          ].map(([value, num, Icon, title, copy]) => (
            <button
              key={value}
              className={`card choice-card ${kind === value ? "selected" : ""}`}
              aria-pressed={kind === value}
              onClick={() => {
                setKind(value);
                setError("");
              }}
            >
              <div>
                <span className="number-tag">{num}</span>
                <Icon size={20} />
              </div>
              <h2>{title}</h2>
              <p>{copy}</p>
              <Arrow />
            </button>
          ))}
        </div>
        <form className="card stack-form join-form" onSubmit={join}>
          <h2>
            {professor ? "교수님으로 팀방 열람하기" : "우리 팀에 합류하기"}
          </h2>
          <Field
            label={
              professor ? "교수님용 초대 코드 (P-)" : "팀원용 초대 코드 (M-)"
            }
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={50}
              autoCapitalize="characters"
              placeholder={professor ? "P-..." : "M-..."}
            />
          </Field>
          {!professor && (
            <Field label="내 이름">
              <input
                name="name"
                className="name-input"
                required
                maxLength={40}
                placeholder="팀원들에게 보일 이름"
                autoComplete="name"
              />
            </Field>
          )}
          {!professor && <Consent checked={consent} onChange={setConsent} />}
          <ErrorText>{error}</ErrorText>
          <button
            className="button lime"
            disabled={busy || !code || (!professor && !consent)}
          >
            {busy ? "입장 중…" : professor ? "팀방 열람하기" : "팀방 입장하기"}{" "}
            <Arrow />
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
