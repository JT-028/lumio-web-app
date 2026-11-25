"use client";

import { useEffect, useRef, useState } from "react";
import type { Me, Role } from "@/domain/types";
import { normalizeFirstName, parseFirstName } from "@/domain/name";
import { firstNameError } from "@/lib/form-checks";
import { AuthFailure, authPost, readAuthContext } from "@/lib/auth-client";
import { AccountGate } from "@/components/account-gate";
import { ChoiceCard } from "@/components/choice-card";
import { Field } from "@/components/field";
import { AlertIcon } from "@/components/icons";
import { Shell } from "@/components/shell";
import { StatusLine } from "@/components/ui";

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
        <StatusLine id="role-status" tone={status === ALREADY ? "info" : "error"} focusable>{status}</StatusLine>
        {status === CHECK_FAILED ? (
          <button type="button" className="button-primary" disabled={submitting} onClick={() => { void redirectFromMe().catch(() => setStatus(CHECK_FAILED)); }}>
            Check again
          </button>
        ) : null}
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
        <h1 className="page-title">Finish setting up your account.</h1>
        {me.role ? <p>Your saved role: {me.role === "parent" ? "Parent" : "Student"}. It can{"\u2019"}t be changed.</p> : null}
        <fieldset className="choice-group" disabled={Boolean(me.role) || submitting} aria-describedby={roleMessage ? "role-help role-error" : "role-help"}>
          <legend className="legend-title">Who is this account for?</legend>
          <p id="role-help" className="helper">
            You choose once. Lumio can{"\u2019"}t change this later.
          </p>
          <div className="choices">
            <ChoiceCard role="parent" title="Parent" description="I'll connect my child's account." checked={role === "parent"} invalid={Boolean(roleMessage)}
              onPick={() => { setRole("parent"); setRoleMessage(""); }} />
            <ChoiceCard role="student" title="Student" description="I'm the Grade 6 student." checked={role === "student"} invalid={Boolean(roleMessage)}
              onPick={() => { setRole("student"); setRoleMessage(""); }} />
          </div>
          <p id="role-error" className="field-error">{roleMessage ? <><AlertIcon size={16} />{roleMessage}</> : null}</p>
        </fieldset>
        <Field
          id="first-name"
          label="First name"
          type="text"
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="done"
          value={firstName}
          onValue={(value) => { setFirstName(value); setNameMessage(""); }}
          help="Up to 40 characters. Letters, spaces, hyphens, or apostrophes."
          helpId="name-help"
          error={nameMessage}
          errorId="name-error"
        />
        <StatusLine id="role-status" tone="error" focusable>{status}</StatusLine>
        <button type="submit" className="button-primary" disabled={submitting}>
          Save and continue
        </button>
      </form>
    </Shell>
  );
}
