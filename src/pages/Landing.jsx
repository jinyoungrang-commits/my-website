import React from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Users, Check } from "lucide-react";
import { Header, Footer, Arrow, useUI } from "../main";
import { logoUrl } from "../config";

export function Landing() {
  const { open } = useUI();
  return (
    <>
      <Header landing />
      <main>
        <section className="hero landing-width">
          <div className="hero-body">
            <p className="hero-kicker">
              <span /> 대학생을 위한 팀플 서비스
            </p>
            <h1>
              다 같이 해서
              <br />
              <span className="highlight">더 가치 있는</span> 팀플
            </h1>
            <p className="hero-description">
              역할과 마감일을 한눈에 보고, 결과물과 과정을 함께 남겨요.
            </p>
            <div className="hero-actions">
              <Link to="/lab" className="button dark">
                팀 생성하기 <Arrow />
              </Link>
              <button
                className="underlined"
                onClick={() => open("preregister")}
              >
                사전 신청하기
              </button>
            </div>
          </div>
          <div className="hero-bottom">
            <span>다 같이 해서 더 가치 있는 팀플</span>
            <a
              href="#why"
              onClick={(event) => {
                event.preventDefault();
                document
                  .getElementById("why")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              SCROLL TO DISCOVER ↓
            </a>
          </div>
        </section>
        <section className="why landing-width" id="why">
          <p className="eyebrow">WHY DAGACHI</p>
          <h2>
            팀플에 쏟은 노력,
            <br />
            제대로 보이고 있나요?
          </h2>
          <div className="problem-grid">
            {[
              [
                MessageCircle,
                "역할이 명확하지 않아서",
                "누가 뭘 하는지 모르겠어요",
              ],
              [Users, "연락이 잘 안되어서", "진행이 항상 늦어져요"],
              [Check, "일은 열심히 했는데", "평가가 공정하지 않아요"],
            ].map(([Icon, a, b], i) => (
              <article className="problem-card" key={a}>
                <div>
                  <span>0{i + 1}</span>
                  <Icon size={34} strokeWidth={1.8} />
                </div>
                <h3>
                  {a}
                  <br />
                  {b}
                </h3>
              </article>
            ))}
          </div>
        </section>
        <section className="process content-width" id="about">
          <p className="eyebrow">BETTER, TOGETHER</p>
          <h2>
            좋은 팀플의 시작은
            <br />
            <span className="olive">기록과 확인, 그리고 근거.</span>
          </h2>
          <p className="section-description">
            함께한 과정이 보이고, 성실한 기여가 인정받는 팀플.
            <br />
            다가치는 기록을 공정한 평가의 근거로 연결합니다.
          </p>
          <div className="process-rows">
            {[
              [
                "기록",
                <>마감 날짜를 정하고, 과정을 남깁니다.</>,
                <>
                  정해진 날짜마다 각자 맡은 결과물과 진행 상황을 업로드합니다.
                  <br />
                  완성본이 아니어도, 지금까지 한 만큼이 기록으로 쌓입니다.
                </>,
              ],
              [
                "확인",
                <>동료들과 실시간으로 공유합니다.</>,
                <>
                  업로드된 과정물은 팀원과 담당 교수님이 그 자리에서 바로 볼 수
                  있습니다.
                  <br />
                  누가 무엇을 얼마나 진행했는지, 더 이상 숨겨지지 않습니다.
                </>,
              ],
              [
                "근거",
                <>
                  쌓인 과정이,
                  <br />
                  공정한 평가의 근거가 됩니다.
                </>,
                <>
                  기록된 과정물이 곧 기여의 증거가 됩니다.
                  <br />
                  성실하게 참여한 만큼, 정당하게 인정받습니다.
                </>,
              ],
            ].map(([label, title, copy], i) => (
              <article className="process-row" key={label}>
                <div>
                  <span className="pill lime">
                    0{i + 1} / {label}
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="belief content-width">
          <div>
            <p className="eyebrow">OUR NAME, OUR BELIEF</p>
            <h2>
              ‘다 같이’의 마음을
              <br />
              ‘다가치’에 담았어요.
            </h2>
            <p className="section-description">
              교수님들과의 면담을 통해 팀플의 본질을 돌아봤습니다.
              <br />
              함께 프로젝트에 관해 대화하고,
              <br />
              각자가 맡은 역할을 다하는 것.
            </p>
            <p className="section-description">
              ‘다 같이’의 발음에서 시작한 이름, 다가치.
              <br />
              협동과 공유로 더 큰 가치를 만드는 팀플을 지향합니다.
            </p>
          </div>
          <div className="belief-logo card">
            <img src={logoUrl} alt="다가치" />
            <span className="pill lime">다 같이 + 가치</span>
          </div>
        </section>
        <section className="closing">
          <span className="outline-pill">지금 사용 가능</span>
          <h2>
            다음 팀플은,
            <br />더 가치 있게.
          </h2>
          <p>
            함께한 과정과 성실한 기여가 인정받는 팀플.
            <br />
            다가치에서 바로 시작해 보세요.
          </p>
          <Link className="button lime" to="/lab">
            지금 팀 시작하기 <Arrow />
          </Link>
          <button className="underlined" onClick={() => open("preregister")}>
            별도 사전 신청
          </button>
        </section>
      </main>
      <Footer landing />
    </>
  );
}
