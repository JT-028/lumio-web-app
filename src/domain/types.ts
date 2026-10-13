export type Role = "parent" | "student";

export type Me = {
  id: string;
  role: Role | null;
  first_name: string | null;
  email: string;
  has_main_parent: boolean;
};

export type SessionUser = {
  id: string;
  email: string;
};

export type ProfileRecord = {
  id: string;
  role: Role | null;
  first_name: string | null;
  email: string;
};

export type OfficialCard = {
  id: string;
  kind: "official";
  slug: string;
  course: string;
  course_label: string;
  quarter: 1 | 2;
  quarter_label: string;
  header: string;
};

export type ChildLibrary = {
  id: string;
  first_name: string;
  email: string;
  official_cards: OfficialCard[];
  study_sets: [];
};

export type HomeResponse = {
  role: Role;
  first_name: string;
  needs_parent: boolean;
  children: ChildLibrary[];
};

export type ConnectPreview = {
  invited_email: string;
  parent_first_name: string;
  expires_at: string;
  state: "sent" | "accepted" | "ignored";
};

export type AcceptResult =
  | { state: "accepted"; student_id: string; main_parent_id: string }
  | { state: "ignored"; student_id: string; reason: "MAIN_PARENT_EXISTS" };
