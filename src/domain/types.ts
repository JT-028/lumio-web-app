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
