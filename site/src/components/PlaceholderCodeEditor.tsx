export function PlaceholderCodeEditor() {
  return (
    <details className="placeholder-editor">
      <summary>Будущий онлайн-редактор</summary>
      <div>
        <p>Решение прямо на сайте можно будет добавить позже.</p>
        <ol>
          <li>Сейчас откройте файл из practice локально.</li>
          <li>Напишите код в Visual Studio или другом редакторе.</li>
          <li>Скомпилируйте как C++17 программу.</li>
        </ol>
        <p>
          Этот блок оставлен как место для будущего редактора кода. Компиляция C++
          в браузере сейчас намеренно не добавлена.
        </p>
      </div>
    </details>
  );
}
