import "server-only";
import { listOfficialCards } from "@/data/cards";
import { findHousehold, listHouseholdsForParent } from "@/data/households";
import { listProfilesByIds } from "@/data/profiles";
import type { ChildLibrary, HomeResponse } from "@/domain/types";
import type { AccountCaller } from "@/services/authz";
import { AppError } from "@/services/errors";

export async function getHome(account: AccountCaller): Promise<HomeResponse> {
  if (account.role === "parent") {
    return {
      role: "parent",
      first_name: account.first_name,
      needs_parent: false,
      children: await childrenForParent(account.id),
    };
  }
  const own = await libraryForStudent(account);
  if (!own) {
    return {
      role: "student",
      first_name: account.first_name,
      needs_parent: true,
      children: [],
    };
  }
  return {
    role: "student",
    first_name: account.first_name,
    needs_parent: false,
    children: [own],
  };
}

async function childrenForParent(parentId: string): Promise<ChildLibrary[]> {
  const links = await listHouseholdsForParent(parentId);
  if (links.length === 0) {
    return [];
  }
  const ids = links.map((link) => link.student_id);
  const profiles = await listProfilesByIds(ids);
  const cards = await listOfficialCards(ids);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const children: ChildLibrary[] = [];
  for (const link of links) {
    if (link.main_parent_id !== parentId) {
      throw new AppError("INTERNAL", 500, "Something went wrong.", null);
    }
    const profile = profileById.get(link.student_id);
    if (!profile || profile.role !== "student" || !profile.first_name) {
      throw new AppError("INTERNAL", 500, "Something went wrong.", null);
    }
    children.push({
      id: profile.id,
      first_name: profile.first_name,
      email: profile.email,
      official_cards: cards.get(profile.id) ?? [],
      study_sets: [],
    });
  }
  return children;
}

async function libraryForStudent(account: AccountCaller): Promise<ChildLibrary | null> {
  const household = await findHousehold(account.id);
  if (!household || household.student_id !== account.id) {
    return null;
  }
  const cards = await listOfficialCards([account.id]);
  return {
    id: account.id,
    first_name: account.first_name,
    email: account.email,
    official_cards: cards.get(account.id) ?? [],
    study_sets: [],
  };
}
