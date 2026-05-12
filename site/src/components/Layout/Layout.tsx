import type { ReactNode } from "react";

import { AccountMenu } from "../AccountMenu/AccountMenu";
import { AiAssistant } from "../AiAssistant/AiAssistant";
import { SearchBox } from "../SearchBox/SearchBox";
import { Sidebar } from "../Sidebar/Sidebar";
import { ThemeSwitcher } from "../ThemeSwitcher/ThemeSwitcher";
import styles from "./Layout.module.scss";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.root}>
      <Sidebar />
      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.searchSlot}>
            <SearchBox />
          </div>
          <div className={styles.topbarActions}>
            <ThemeSwitcher />
            <AiAssistant />
            <AccountMenu />
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
