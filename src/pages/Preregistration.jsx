import React from "react";
import { Link } from "react-router-dom";
import { Arrow, Field, Footer, Header } from "../main";
import {
  PREREGISTRATION_ACTION,
  preregistrationReturnUrl,
} from "../preregistration";

export function PreregistrationForm() {
  return (
    <form
      action={PREREGISTRATION_ACTION}
      method="POST"
      acceptCharset="UTF-8"
      className="stack-form"
    >
      <p className="muted">
        다가치의 새로운 소식과 정식 오픈 안내를 가장 먼저 받아보세요.
      </p>
      <input type="hidden" name="_subject" value="[다가치] 새로운 사전 신청" />
      <input type="hidden" name="_template" value="table" />
      <input type="hidden" name="_next" value={preregistrationReturnUrl()} />
      <input type="hidden" name="신청 경로" value="다가치 홈페이지" />
      <div className="form-honeypot" aria-hidden="true" inert>
        <label>
          이 항목은 비워두세요
          <input type="text" name="_honey" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
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
          maxLength={254}
          autoComplete="email"
          placeholder="소식을 받을 이메일을 입력해 주세요"
        />
      </Field>
      <details className="registration-privacy">
        <summary>개인정보 수집·이용 안내</summary>
        <p>
          수집 항목: 이름, 이메일 주소. 이용 목적: 사전 신청 접수 및 다가치
          서비스 출시·이용 안내. 서비스 출시 안내 종료 또는 동의 철회 시
          삭제합니다. 동의를 거부할 수 있으며, 이 경우 신청할 수 없습니다.
        </p>
        <p>
          신청 정보는 FormSubmit을 통해 다가치 운영자의 이메일로 전송됩니다.
          처리 방식은{" "}
          <a
            href="https://formsubmit.co/privacy.pdf"
            target="_blank"
            rel="noreferrer"
          >
            FormSubmit 개인정보 처리방침
          </a>
          을 참고해 주세요. 동의 철회·삭제 요청: jinyoungrang0502@gmail.com
        </p>
      </details>
      <label className="checkbox-line">
        <input
          type="checkbox"
          name="consent"
          value="이름·이메일 수집·이용 및 서비스 소식 수신에 동의함"
          required
        />
        이름·이메일 수집·이용 및 다가치 서비스 소식 수신에 동의합니다.
      </label>
      <p className="registration-note">
        제출하면 신청 접수 및 스팸 방지 확인 화면으로 이동합니다.
      </p>
      <button type="submit" className="button lime">
        사전 신청하기 <Arrow />
      </button>
    </form>
  );
}

export function PreregistrationThanks() {
  return (
    <>
      <Header landing />
      <main className="registration-thanks">
        <span className="eyebrow">THANK YOU</span>
        <h1>다가치를 기다려 주셔서 고마워요.</h1>
        <p>새로운 소식이 준비되면 남겨주신 이메일로 알려드릴게요.</p>
        <Link to="/" className="button lime">
          다가치 홈으로 <Arrow />
        </Link>
      </main>
      <Footer landing />
    </>
  );
}
