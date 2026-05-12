# Styles

Global styles are reserved for reset rules, theme variables, base typography and shared utilities.

New or refactored components should keep their styles next to the component:

```text
ComponentName/
  ComponentName.tsx
  ComponentName.module.scss
  index.ts
```

Use CSS Modules for component-specific classes. Keep `:root[data-theme="..."]` variables global.
