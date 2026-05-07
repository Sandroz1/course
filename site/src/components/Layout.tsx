import type { ReactNode } from "react";
import { SearchBox } from "./SearchBox";
import { Sidebar } from "./Sidebar";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <header className="topbar">
          <SearchBox />
          <ThemeSwitcher />
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
