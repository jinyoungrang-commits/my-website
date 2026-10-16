import React, { createContext, useContext, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { X, ArrowUpRight } from "lucide-react";
import { request } from "./api";
import { Landing } from "./pages/Landing";
import { Lab, Join, NewTeam, Plan } from "./pages/Lab";
import { Team } from "./pages/Team";
import "./styles.css";

const UIContext = createContext(null);
export const useUI = () => useContext(UIContext);
export function Arrow() {
  return <ArrowUpRight size={19} aria-hidden="true" />;
}
export function Logo() {
  return (
    <Link to="/" aria-label="다가치 홈" className="logo">
      <img src="/dagachi-logo.jpg" alt="다가치" />
    </Link>
  );
}
export function Header({ landing = false }) {
  const { open } = useUI();
  return (
    <header
      className={`site-header ${landing ? "landing-header" : "lab-header"}`}
    >
      <div className="header-inner">
        <div className="brand">
          <Logo />
          {!landing && (
            <Link to="/lab" className="lab-label">
              실험실
            </Link>
          )}
        </div>
        {landing ? (
          <nav aria-label="메인 메뉴">
            <button className="text-button" onClick={() => open("preregister")}>
              사전 신청
            </button>
            <a href="#about">다가치 소개</a>
            <Link className="button lime" to="/lab">
              팀 생성하기 <Arrow />
            </Link>
          </nav>
        ) : (
          <button
            className="button dark contact-button"
            onClick={() => open("contact")}
          >
            문의하기 <Arrow />
          </button>
        )}
      </div>
    </header>
  );
}
export function Footer({ landing = false }) {
  const { open } = useUI();
  return landing ? (
    <footer className="landing-footer">
      <Logo />
      <span>다 같이 해서 더 가치 있는 팀플</span>
      <button className="underlined" onClick={() => open("privacy")}>
        개인정보 안내
      </button>
      <small>© 2026 다가치</small>
    </footer>
  ) : (
    <footer className="lab-footer">
      다가치 실험실 · 함께한 과정이 공정한 평가의 근거가 되도록
    </footer>
  );
}
export function Consent({ checked, onChange, short = false }) {
  const { open } = useUI();
  return (
    <div className="consent">
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          체험 데이터의 저장·공유에 동의합니다.
          {!short &&
            " 활동은 팀방 참여자에게, 상호 평가는 팀장·교수님과 작성자에게 공개됩니다."}
        </span>
      </label>
      <button
        type="button"
        className="underlined"
        onClick={() => open("privacy")}
      >
        개인정보 안내
      </button>
    </div>
  );
}
export function Field({ label, hint, children }) {
  const id = React.useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <small>{hint}</small>}
      {React.cloneElement(children, { id })}
    </div>
  );
}
export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={35} strokeWidth={1.8} />}
      <p>{title}</p>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}
export function ErrorText({ children }) {
  return children ? (
    <p className="error-text" role="alert">
      {children}
    </p>
  ) : null;
}

function Modal({ kind, close }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = document.querySelector('[role="dialog"]');
    dialog?.querySelector("button, input")?.focus();
    const handler = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const nodes = [
          ...dialog.querySelectorAll("button, input, textarea, a[href]"),
        ].filter((el) => !el.disabled);
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [close]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await request("/api/submissions", {
        ...values,
        consent: values.consent === "on",
        kind,
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const privacy = kind === "privacy";
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal card"
      >
        <button
          className="icon-button modal-close"
          onClick={close}
          aria-label="닫기"
        >
          <X />
        </button>
        <span className="eyebrow">DAGACHI</span>
        <h2 id="modal-title">
          {privacy
            ? "개인정보 안내"
            : kind === "contact"
              ? "다가치에 문의하기"
              : "다가치를 먼저 만나보세요"}
        </h2>
        {privacy ? (
          <div className="privacy-copy">
            <p>
              이 사이트는 다가치의 화면과 팀 협업 흐름을 재구성한 체험판입니다.
            </p>
            <h3>어떤 내용을 저장하나요?</h3>
            <p>
              입력한 이름, 역할, 할 일, 일정, 활동 기록 및 상호 평가를 이
              서비스의 서버에 저장합니다. 로그인 정보와 참여한 팀방은 현재
              브라우저에 보관합니다.
            </p>
            <h3>누가 볼 수 있나요?</h3>
            <p>
              팀방 기록은 초대받은 팀원과 교수님이 볼 수 있습니다. 상호 평가는
              팀장·교수님과 작성자에게 표시되며, 평가자 이름은 교수님에게만
              표시됩니다. 교수님은 열람만 할 수 있습니다.
            </p>
            <h3>이용 시 참고해 주세요</h3>
            <p>
              초대 링크를 가진 사람은 팀방에 참여할 수 있습니다. 초대 코드를
              공개하지 말고, 민감한 개인정보나 실제 성적 평가 자료는 입력하지
              마세요. 이전 사이트의 데이터는 이 서비스로 이전되지 않았습니다.
            </p>
            <p>
              사전 신청과 문의를 제출하면 이름, 이메일, 입력 내용을 서버에
              보관합니다. 이메일은 자동 발송하지 않습니다.
            </p>
          </div>
        ) : done ? (
          <div className="success-state">
            <span className="success-mark">✓</span>
            <h3>
              {kind === "contact"
                ? "문의가 저장되었어요."
                : "사전 신청이 저장되었어요."}
            </h3>
            <p className="muted">함께 더 가치 있는 팀플을 만들어가요.</p>
            <button className="button lime" onClick={close}>
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="stack-form">
            <p className="muted">
              {kind === "contact"
                ? "궁금한 점이나 개선 의견을 남겨 주세요."
                : "소식 받을 이메일을 남겨 주세요."}
            </p>
            <Field label="이름">
              <input
                name="name"
                required
                maxLength={40}
                autoComplete="name"
                placeholder="이름을 입력해 주세요"
              />
            </Field>
            <Field label="이메일">
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="hello@example.com"
              />
            </Field>
            {kind === "contact" && (
              <Field label="문의 내용">
                <textarea
                  name="message"
                  required
                  maxLength={4000}
                  placeholder="어떤 도움이 필요한가요?"
                />
              </Field>
            )}
            <label className="checkbox-line">
              <input type="checkbox" name="consent" required />
              이름·이메일·입력 내용의 저장에 동의합니다.
            </label>
            <ErrorText>{error}</ErrorText>
            <button className="button lime" disabled={busy}>
              {busy
                ? "저장 중…"
                : kind === "contact"
                  ? "문의 남기기"
                  : "사전 신청하기"}{" "}
              <Arrow />
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="fatal-state">
        <h1>화면을 불러오지 못했어요.</h1>
        <p>저장된 팀방 데이터는 그대로 남아 있어요.</p>
        <button className="button lime" onClick={() => location.reload()}>
          다시 불러오기
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);
  const close = React.useCallback(() => setModal(null), []);
  return (
    <ErrorBoundary>
      <UIContext.Provider value={{ open: setModal, notify: setToast }}>
        <BrowserRouter>
          <ScrollReset />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/lab/plan" element={<Plan />} />
            <Route path="/lab/new" element={<NewTeam />} />
            <Route path="/lab/join" element={<Join />} />
            <Route path="/lab/team/:teamId" element={<Team />} />
            <Route
              path="*"
              element={
                <>
                  <Header />
                  <main className="narrow page-main">
                    <h1>페이지를 찾을 수 없어요.</h1>
                    <Link className="button lime" to="/">
                      홈으로 돌아가기
                    </Link>
                  </main>
                </>
              }
            />
          </Routes>
          {modal && <Modal kind={modal} close={close} />}
          {toast && (
            <div className="toast" role="status">
              {toast}
            </div>
          )}
        </BrowserRouter>
      </UIContext.Provider>
    </ErrorBoundary>
  );
}
createRoot(document.getElementById("root")).render(<App />);
