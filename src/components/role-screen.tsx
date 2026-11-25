"use client";

import { useEffect, useRef, useState } from "react";
import type { Me, Role } from "@/domain/types";
import { normalizeFirstName, parseFirstName } from "@/domain/name";
import { firstNameError } from "@/lib/form-checks";
import { AuthFailure, authPost, readAuthContext } from "@/lib/auth-client";
import { AccountGate } from "@/components/account-gate";
import { Shell } from "@/components/shell";

const CHECK_FAILED = "We could not check your account. Check again.";
const SAVED_STUCK =
  "Your role was saved, but the next page did not open. Try again.";
const ALREADY = "Your role is already saved. It cannot be changed.";
const GENERIC = "Your role could not be saved. Try again.";
const EMPTY_VALIDATION = "Check your first name and your role, then try again.";

export function RoleScreen() {
  return (
    <AccountGate page="role">
      {(me) => (me.role === null || !me.first_name?.trim() ? <RoleForm me={me} /> : null)}
    </AccountGate>
  );
}

function RoleForm({ me }: { me: Me }) {
  const [role, setRole] = useState<Role | "">(me.role ?? "");
  const [firstName, setFirstName] = useState(me.first_name ?? "");
  const [roleMessage, setRoleMessage] = useState("");
  const [nameMessage, setNameMessage] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [focus, setFocus] = useState({ id: "", n: 0 });
  const submitLock = useRef(false);
  const generation = useRef(0);
  const uncertain = useRef(false);
  useEffect(() => () => { generation.current += 1; }, []);

  useEffect(() => {
    if (!focus.id) {
      return;
    }
    document.getElementById(focus.id)?.focus();
  }, [focus]);

  function moveFocus(id: string) {
    setFocus((current) => ({ id, n: current.n + 1 }));
  }

  async function redirectFromMe(current = generation.current) {
    const { context } = await readAuthContext();
    if (current !== generation.current) return;
    if (!context.authenticated) { window.location.replace("/login"); return; }
    if (!context.next || context.next === "/role") throw new AuthFailure("INTERNAL");
    window.location.replace(context.next);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    const nextRole = role === "" ? "Choose Parent or Student." : "";
    const nextName = firstNameError(firstName) ?? (parseFirstName(firstName).ok ? "" : "Enter your first name with at least one letter.");
    setRoleMessage(nextRole); setNameMessage(nextName); setStatus("");
    if (nextName || nextRole) { moveFocus(nextName ? "first-name" : "role-parent"); return; }
    if (role !== "parent" && role !== "student") return;
    const current = generation.current;
    submitLock.current = true; setSubmitting(true);
    try {
      if (uncertain.current) {
        const { context } = await readAuthContext();
        if (current !== generation.current) return;
        if (context.authenticated && context.next && context.next !== "/role") {
          window.location.replace(context.next); return;
        }
      }
      uncertain.current = true;
      await authPost("/api/profile", { first_name: normalizeFirstName(firstName), role });
      if (current !== generation.current) return;
      setLocked(true);
      try { await redirectFromMe(current); }
      catch { if (current === generation.current) setStatus(CHECK_FAILED); }
    } catch (error) {
      if (current !== generation.current) return;
      if (error instanceof AuthFailure && error.code === "ROLE_ALREADY_SET") {
        setLocked(true); setStatus(ALREADY);
        try { await redirectFromMe(current); }
        catch { if (current === generation.current) setStatus(CHECK_FAILED); }
      } else if (error instanceof AuthFailure && error.code === "UNAUTHENTICATED") {
        window.location.replace("/login");
      } else if (error instanceof AuthFailure && error.code === "VALIDATION") {
        const message = error.field === "first_name" ? "Check your first name and try again." : EMPTY_VALIDATION;
        if (error.field === "first_name") { setNameMessage(message); moveFocus("first-name"); }
        else if (error.field === "role") { setRoleMessage(message); moveFocus("role-parent"); }
        else { setStatus(message); moveFocus("role-status"); }
      } else { setStatus(locked ? SAVED_STUCK : GENERIC); moveFocus("role-status"); }
    } finally {
      if (current === generation.current) { submitLock.current = false; setSubmitting(false); }
    }
  }

  if (locked) {
    return (
      <Shell signedIn busy={submitting}>
        <div className="stack">
          <p id="role-status" tabIndex={-1} className="status is-error" aria-live="polite">
            {status}
          </p>
          {status === CHECK_FAILED ? (
            <button type="button" className="button-primary" disabled={submitting} onClick={() => { void redirectFromMe().catch(() => setStatus(CHECK_FAILED)); }}>
              Check again
            </button>
          ) : null}
        </div>
      </Shell>
    );
  }

  return (
    <Shell signedIn busy={submitting}>
      <form
        className="stack"
        method="post"
        noValidate
        aria-busy={submitting}
        onSubmit={(event) => void onSubmit(event)}
      >
        <h1 className="page-title display-text">Finish setting up your account.</h1>
        {me.role ? <p>Your saved role: {me.role === "parent" ? "Parent" : "Student"}. Your saved role cannot be changed.</p> : null}
        <fieldset disabled={Boolean(me.role) || submitting} aria-describedby={roleMessage ? "role-help role-error" : "role-help"}>
          <legend className="page-title display-text">Who is this account for?</legend>
          <p id="role-help" className="helper">
            You choose once. Lumio cannot change this later.
          </p>
          <div className="choices">
            <div className="choice-block">
              <label className="choice" htmlFor="role-parent">
                <input
                  id="role-parent"
                  type="radio"
                  name="role"
                  value="parent"
                  checked={role === "parent"}
                  aria-invalid={roleMessage ? true : undefined}
                  aria-describedby={roleMessage ? "parent-desc role-error" : "parent-desc"}
                  onChange={() => {
                    setRole("parent");
                    setRoleMessage("");
                  }}
                />
                <span className="choice-name">Parent</span>
              </label>
              <p id="parent-desc" className="helper">
                I will connect my child{"\u2019"}s account.
              </p>
            </div>
            <div className="choice-block">
              <label className="choice" htmlFor="role-student">
                <input
                  id="role-student"
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === "student"}
                  aria-invalid={roleMessage ? true : undefined}
                  aria-describedby={roleMessage ? "student-desc role-error" : "student-desc"}
                  onChange={() => {
                    setRole("student");
                    setRoleMessage("");
                  }}
                />
                <span className="choice-name">Student</span>
              </label>
              <p id="student-desc" className="helper">
                I am the Grade 6 student.
              </p>
            </div>
          </div>
          <p id="role-error" className="field-error">
            {roleMessage}
          </p>
        </fieldset>
        <div className="field">
          <label className="label" htmlFor="first-name">
            First name
          </label>
          <input
            id="first-name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            aria-invalid={nameMessage ? true : undefined}
            aria-describedby={nameMessage ? "name-help name-error" : "name-help"}
            onChange={(event) => {
              setFirstName(event.target.value);
              setNameMessage("");
            }}
          />
          <p id="name-help" className="helper">
            Up to 40 characters. Letters, spaces, hyphens, or apostrophes.
          </p>
          <p id="name-error" className="field-error">
            {nameMessage}
          </p>
        </div>
        <p
          id="role-status"
          tabIndex={-1}
          className={status ? "status is-error" : "status"}
          aria-live="polite"
        >
          {status}
        </p>
        <button type="submit" className="button-primary" disabled={submitting}>
          Save and continue
        </button>
      </form>
    </Shell>
  );
}
