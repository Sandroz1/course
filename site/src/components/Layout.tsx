import type { ReactNode } from "react";
import { SearchBox } from "./SearchBox";
import { Sidebar } from "./Sidebar";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { AiAssistant } from "./AiAssistant";
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <header className="topbar">
          <SearchBox />
          <ThemeSwitcher />
          <AiAssistant />
        </header>
      
        <main className="content">{children}</main>

      </div>
    </div>
  );
}
