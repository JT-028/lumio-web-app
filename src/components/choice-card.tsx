import { CheckIcon } from "@/components/icons";
import { LumiImage } from "@/components/lumi-image";
import type { Role } from "@/domain/types";

const ART = { parent: "lumi-welcome", student: "lumi-wand" } as const;

/** A real radio inside its label: state shows by border, check badge and the native radio. */
export function ChoiceCard({ role, title, description, checked, invalid, onPick }: {
  role: Role;
  title: string;
  description: string;
  checked: boolean;
  invalid: boolean;
  onPick: () => void;
}) {
  const id = `role-${role}`;
  return (
    <label className="choice-card" htmlFor={id}>
      <input
        id={id}
        type="radio"
        name="role"
        value={role}
        checked={checked}
        aria-labelledby={`${id}-title`}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={invalid ? `${role}-desc role-error` : `${role}-desc`}
        onChange={onPick}
      />
      <span className="choice-check"><CheckIcon size={16} /></span>
      <LumiImage pose={ART[role]} alt="" size="sm" />
      <span id={`${id}-title`} className="choice-title">{title}</span>
      <span id={`${role}-desc`} className="choice-desc">{description}</span>
    </label>
  );
}
