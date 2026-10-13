"use client";

import { useEffect, useState } from "react";
import type { Role } from "@/domain/types";
import { normalizeFirstName } from "@/domain/name";
import { firstNameError } from "@/lib/form-checks";
import { getMe, pathForAccount, postProfile } from "@/lib/lumio-client";
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
      {(me) => (me.role === null || !me.first_name?.trim() ? <RoleForm /> : null)}
    </AccountGate>
  );
}

function RoleForm() {
  const [role, setRole] = useState<Role | "">("");
  const [firstName, setFirstName] = useState("");
  const [roleMessage, setRoleMessage] = useState("");
  const [nameMessage, setNameMessage] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [focus, setFocus] = useState({ id: "", n: 0 });

  useEffect(() => {
    if (!focus.id) {
      return;
    }
    document.getElementById(focus.id)?.focus();
  }, [focus]);

  function moveFocus(id: string) {
    setFocus((current) => ({ id, n: current.n + 1 }));
  }

  async function redirectFromMe() {
    const result = await getMe();
    if (!result.ok) {
      if (result.status === 401) {
        window.location.replace("/");
        return;
      }
      setStatus(CHECK_FAILED);
      setSubmitting(false);
      return;
    }
    window.location.replace(pathForAccount(result.me));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextRole = role === "" ? "Choose Parent or Student." : "";
    const nextName = firstNameError(firstName) ?? "";
    setRoleMessage(nextRole);
    setNameMessage(nextName);
    setStatus("");
    if (nextRole || nextName) {
      moveFocus(nextRole ? "role-parent" : "first-name");
      return;
    }
    if (role !== "parent" && role !== "student") {
      setRoleMessage("Choose Parent or Student.");
      moveFocus("role-parent");
      return;
    }
    setSubmitting(true);
    const result = await postProfile({
      first_name: normalizeFirstName(firstName),
      role,
    });
    if (!result.ok) {
      if (result.error.status === 401) {
        window.location.replace("/");
        return;
      }
      if (result.error.status === 409 && result.error.code === "ROLE_ALREADY_SET") {
        setLocked(true);
        setStatus(ALREADY);
        await redirectFromMe();
        return;
      }
      if (result.error.status === 400 && result.error.code === "VALIDATION") {
        const message = result.error.message.trim() || EMPTY_VALIDATION;
        setSubmitting(false);
        if (result.error.field === "first_name") {
          setNameMessage(message);
          moveFocus("first-name");
          return;
        }
        if (result.error.field === "role") {
          setRoleMessage(message);
          moveFocus("role-parent");
          return;
        }
        setStatus(message);
        moveFocus("role-status");
        return;
      }
      setSubmitting(false);
      setStatus(GENERIC);
      moveFocus("role-status");
      return;
    }
    const next = pathForAccount(result.me);
    if (next === "/role") {
      setSubmitting(false);
      setStatus(SAVED_STUCK);
      moveFocus("role-status");
      return;
    }
    try {
      window.location.replace(next);
    } catch {
      setSubmitting(false);
      setStatus(SAVED_STUCK);
      moveFocus("role-status");
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
            <button type="button" className="button-primary" onClick={() => void redirectFromMe()}>
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
        <fieldset aria-describedby={roleMessage ? "role-help role-error" : "role-help"}>
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
