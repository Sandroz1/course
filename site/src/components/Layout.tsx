import type { ReactNode } from "react";
import { SearchBox } from "./SearchBox";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <header className="topbar">
          <SearchBox />
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
