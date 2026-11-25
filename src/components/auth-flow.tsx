"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type MailFlow = { purpose: "confirmation" | "recovery"; email: string; retryAt: number };
const MailContext = createContext<{ mail: MailFlow | null; setMail: (value: MailFlow | null) => void }>({ mail: null, setMail: () => {} });

// Only this mounted tree retains nonsecret send context; reload starts empty.
export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [mail, setMail] = useState<MailFlow | null>(null);
  const pathname = usePathname();
  useEffect(() => { if (pathname !== "/check-email") setMail(null); }, [pathname]);
  return <MailContext.Provider value={{ mail, setMail }}>{children}</MailContext.Provider>;
}

export function useMailFlow() { return useContext(MailContext); }
