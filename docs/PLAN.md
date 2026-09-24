# PLAN — доработки формы генерации CV

## 1. Отдельный шаг «Оформление»

Финальные опции (объём CV, шаблон, свой промпт) выносятся с последнего шага
«Вакансия» в отдельный шаг.

Файл: `components/form/cv-form.tsx`

- В тип `StepId` добавить `"options"`.
- В `ALL_STEPS` после `"vacancy"` добавить шаг `options` (title «Оформление»,
  fields: [], component-заглушка).
- В профильном режиме (`saveProfile`) фильтровать и `"options"`, как `"vacancy"`.
- Показ блока `LengthSelector` + `TemplatePicker` + `CustomPromptField` —
  по условию `step.id === "options"` вместо `isLast`.

Результат: «Вакансия» (шаг 7) → «Далее» → «Оформление» (шаг 8) →
«Сгенерировать CV».

## 2. Выбор профиля на главной

Быстрая генерация без ручного ввода данных: выбор сохранённого профиля прямо на
главной странице.

Файлы: `components/generator.tsx`, `components/applications/application-detail.tsx`,
`components/settings/profiles-manager.tsx`

- В `Generator` добавить проп `showProfilePicker` (по умолчанию `true`).
- При авторизации грузить `/api/profiles`; рендерить селект профилей на экране
  выбора режима; предвыбирать профиль по умолчанию (`isDefault`).
- Опция «Без профиля (ввести вручную)».
- Эффективные данные: `initialValues ?? selectedProfile?.data`.
- В `application-detail.tsx` и `profiles-manager.tsx` (где `initialValues` уже
  задан) передавать `showProfilePicker={false}`.

## 3. Мобильный адаптив шага «Навыки»

Файл: `components/form/steps/skills-step.tsx`

- Строка навыка: `flex items-start gap-2` → `flex flex-col gap-2 sm:flex-row sm:items-start`.
- Селект уровня: `w-40` → `w-full sm:w-40`.
- Кнопка удаления: выравнивание на мобильном (`self-end` / `sm:self-start`).

## Проверка

```bash
npm run typecheck
npm run lint
npm run build
```
