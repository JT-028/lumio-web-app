"use client";

import { useState, type InputHTMLAttributes } from "react";
import { AlertIcon, EyeIcon, EyeOffIcon } from "@/components/icons";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange" | "aria-describedby" | "aria-invalid">;

export type FieldProps = InputProps & {
  id: string;
  label: string;
  value: string;
  onValue: (value: string) => void;
  help?: string;
  error?: string;
  helpId?: string;
  errorId?: string;
};

/** Label, input, helper, then error (Iris §5). Describedby lists the error only while invalid. */
export function Field({ id, label, value, onValue, help, error, helpId = `${id}-help`, errorId = `${id}-error`, children, ...input }: FieldProps & { children?: React.ReactNode }) {
  const describedBy = [help ? helpId : "", error ? errorId : ""].filter(Boolean).join(" ");
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      <div className={children ? "input-wrap has-toggle" : "input-wrap"}>
        <input
          id={id}
          className="input"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(event) => onValue(event.target.value)}
          {...input}
        />
        {children}
      </div>
      {help ? <p id={helpId} className="helper">{help}</p> : null}
      <p id={errorId} className="field-error">{error ? <><AlertIcon size={16} />{error}</> : null}</p>
    </div>
  );
}

/** Field with a Show/Hide toggle that keeps the value and focus. */
export function PasswordField(props: FieldProps) {
  const [shown, setShown] = useState(false);
  return (
    <Field {...props} type={shown ? "text" : "password"}>
      <button type="button" className="password-toggle" aria-controls={props.id} aria-pressed={shown} onClick={() => setShown((value) => !value)}>
        {shown ? <EyeOffIcon /> : <EyeIcon />}
        {shown ? "Hide" : "Show"}
        <span className="visually-hidden">{props.id === "confirm" ? " confirmation password" : " password"}</span>
      </button>
    </Field>
  );
}
