import { appRoutes } from "../../app/routes";
import { LinkButton } from "../../components/shared/ActionButton/ActionButton";
import { toPath } from "../../utils/slug";
import styles from "./NotFoundPage.module.scss";

export function NotFoundPage() {
  return (
    <article className="reading-page compact-page route-page">
      <header className="page-header">
        <p className="eyebrow">Страница не найдена</p>
        <h1>Такой страницы нет</h1>
        <p className="lead">
          Возможно, ссылка устарела или адрес введён с ошибкой. Выберите ближайший раздел
          и продолжайте обучение.
        </p>
        <div className={styles.actions}>
          <LinkButton href={toPath(appRoutes.home)} variant="primary">
            На главную
          </LinkButton>
          <LinkButton href={toPath(appRoutes.courses)}>К курсам</LinkButton>
          <LinkButton href={toPath(appRoutes.tasks)} variant="ghost">
            К задачам
          </LinkButton>
        </div>
      </header>
    </article>
  );
}
