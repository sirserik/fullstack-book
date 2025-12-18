# Tailwind CSS 4: Полный туториал с нуля

Подробное руководство по Tailwind CSS 4 на русском языке. От установки до создания многостраничного сайта.

## Содержание

1. [Что такое Tailwind CSS](#что-такое-tailwind-css)
2. [Установка и настройка](#установка-и-настройка)
3. [Основы utility-классов](#основы-utility-классов)
4. [Flexbox и Grid](#flexbox-и-grid)
5. [Адаптивный дизайн](#адаптивный-дизайн)
6. [Тёмная тема](#тёмная-тема)
7. [Кастомизация через @theme](#кастомизация-через-theme)
8. [Компоненты](#компоненты)
9. [Практика: Многостраничный сайт](#практика-многостраничный-сайт)

---

## Что такое Tailwind CSS

Tailwind CSS — это **utility-first CSS фреймворк**. Вместо готовых компонентов (как в Bootstrap), вы получаете маленькие классы-утилиты, которые комбинируете для создания любого дизайна.

### Сравнение подходов

**Традиционный CSS:**
```css
/* styles.css */
.card {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}
```

```html
<div class="card">
  <h2 class="card-title">Заголовок</h2>
</div>
```

**Tailwind CSS:**
```html
<div class="bg-white rounded-lg p-6 shadow-md">
  <h2 class="text-xl font-semibold text-gray-900">Заголовок</h2>
</div>
```

### Преимущества Tailwind

| Преимущество | Описание |
|--------------|----------|
| Скорость | Не нужно придумывать имена классов и писать CSS |
| Консистентность | Единая дизайн-система из коробки |
| Размер | Только используемые стили попадают в финальный CSS |
| Гибкость | Полный контроль над внешним видом |
| Адаптивность | Встроенные брейкпоинты (sm, md, lg, xl, 2xl) |

### Что нового в Tailwind CSS 4

- **В 5 раз быстрее** полная сборка
- **В 100+ раз быстрее** инкрементальная сборка
- **CSS-first конфигурация** — настройка прямо в CSS через `@theme`
- **Новые утилиты** — container queries, 3D transforms, градиенты
- **Упрощённая установка** — меньше зависимостей

---

## Установка и настройка

### Способ 1: Vite (рекомендуется)

Создаём новый проект:

```bash
npm create vite@latest my-project
cd my-project
npm install
```

Устанавливаем Tailwind CSS 4:

```bash
npm install tailwindcss @tailwindcss/vite
```

Настраиваем Vite (`vite.config.js`):

```js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

Создаём CSS файл (`src/styles.css`):

```css
@import "tailwindcss";
```

Подключаем в HTML (`index.html`):

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Мой проект</title>
  <link rel="stylesheet" href="/src/styles.css">
</head>
<body>
  <h1 class="text-3xl font-bold text-blue-600">
    Привет, Tailwind CSS 4!
  </h1>
</body>
</html>
```

Запускаем:

```bash
npm run dev
```

### Способ 2: PostCSS

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

Создаём `postcss.config.js`:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### Способ 3: CLI (без сборщика)

```bash
npm install tailwindcss @tailwindcss/cli
```

Запуск:

```bash
npx @tailwindcss/cli -i src/styles.css -o dist/styles.css --watch
```

### Способ 4: CDN (для экспериментов)

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tailwind CSS 4</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
  <div class="container mx-auto p-8">
    <h1 class="text-4xl font-bold text-center text-blue-600">
      Привет, мир!
    </h1>
  </div>
</body>
</html>
```

> **Важно:** CDN — только для обучения и прототипов. Для production используйте полную установку.

---

## Основы utility-классов

### Цвета

Tailwind использует шкалу от 50 (светлый) до 950 (тёмный):

```html
<!-- Цвет текста -->
<p class="text-gray-500">Серый текст</p>
<p class="text-blue-600">Синий текст</p>
<p class="text-red-500">Красный текст</p>

<!-- Цвет фона -->
<div class="bg-white">Белый фон</div>
<div class="bg-gray-100">Светло-серый фон</div>
<div class="bg-blue-500">Синий фон</div>

<!-- Цвет рамки -->
<div class="border border-gray-300">Серая рамка</div>
<div class="border-2 border-blue-500">Синяя рамка 2px</div>
```

**Доступные цвета:**
- `slate`, `gray`, `zinc`, `neutral`, `stone` — оттенки серого
- `red`, `orange`, `amber`, `yellow` — тёплые
- `lime`, `green`, `emerald`, `teal` — зелёные
- `cyan`, `sky`, `blue`, `indigo` — синие
- `violet`, `purple`, `fuchsia`, `pink`, `rose` — фиолетовые/розовые

### Отступы

**Padding (внутренние отступы):**

```html
<div class="p-4">Отступы со всех сторон (16px)</div>
<div class="px-4">Горизонтальные отступы</div>
<div class="py-2">Вертикальные отступы</div>
<div class="pt-4">Только сверху</div>
<div class="pr-4">Только справа</div>
<div class="pb-4">Только снизу</div>
<div class="pl-4">Только слева</div>
```

**Margin (внешние отступы):**

```html
<div class="m-4">Отступы со всех сторон</div>
<div class="mx-auto">Центрирование по горизонтали</div>
<div class="my-8">Вертикальные отступы</div>
<div class="mt-4">Только сверху</div>
<div class="mb-4">Только снизу</div>
```

**Шкала отступов:**

| Класс | Значение |
|-------|----------|
| `p-0` | 0px |
| `p-1` | 4px (0.25rem) |
| `p-2` | 8px (0.5rem) |
| `p-3` | 12px (0.75rem) |
| `p-4` | 16px (1rem) |
| `p-5` | 20px (1.25rem) |
| `p-6` | 24px (1.5rem) |
| `p-8` | 32px (2rem) |
| `p-10` | 40px (2.5rem) |
| `p-12` | 48px (3rem) |
| `p-16` | 64px (4rem) |
| `p-20` | 80px (5rem) |

### Размеры

**Ширина:**

```html
<div class="w-full">100% ширины</div>
<div class="w-1/2">50% ширины</div>
<div class="w-1/3">33.33% ширины</div>
<div class="w-64">256px</div>
<div class="w-screen">100vw</div>
<div class="max-w-md">Максимум 448px</div>
<div class="max-w-4xl">Максимум 896px</div>
```

**Высота:**

```html
<div class="h-screen">100vh</div>
<div class="h-full">100%</div>
<div class="h-64">256px</div>
<div class="min-h-screen">Минимум 100vh</div>
```

### Типографика

```html
<!-- Размер шрифта -->
<p class="text-xs">12px</p>
<p class="text-sm">14px</p>
<p class="text-base">16px (базовый)</p>
<p class="text-lg">18px</p>
<p class="text-xl">20px</p>
<p class="text-2xl">24px</p>
<p class="text-3xl">30px</p>
<p class="text-4xl">36px</p>
<p class="text-5xl">48px</p>

<!-- Жирность -->
<p class="font-light">Тонкий (300)</p>
<p class="font-normal">Обычный (400)</p>
<p class="font-medium">Средний (500)</p>
<p class="font-semibold">Полужирный (600)</p>
<p class="font-bold">Жирный (700)</p>

<!-- Выравнивание -->
<p class="text-left">По левому краю</p>
<p class="text-center">По центру</p>
<p class="text-right">По правому краю</p>

<!-- Межстрочный интервал -->
<p class="leading-tight">Плотный</p>
<p class="leading-normal">Обычный</p>
<p class="leading-relaxed">Свободный</p>
```

### Рамки и скругления

```html
<!-- Рамки -->
<div class="border">Рамка 1px</div>
<div class="border-2">Рамка 2px</div>
<div class="border-4">Рамка 4px</div>

<!-- Скругления -->
<div class="rounded">4px</div>
<div class="rounded-md">6px</div>
<div class="rounded-lg">8px</div>
<div class="rounded-xl">12px</div>
<div class="rounded-2xl">16px</div>
<div class="rounded-full">Круг</div>

<!-- Скругление отдельных углов -->
<div class="rounded-t-lg">Сверху</div>
<div class="rounded-b-lg">Снизу</div>
<div class="rounded-l-lg">Слева</div>
<div class="rounded-r-lg">Справа</div>
```

### Тени

```html
<div class="shadow-sm">Маленькая тень</div>
<div class="shadow">Обычная тень</div>
<div class="shadow-md">Средняя тень</div>
<div class="shadow-lg">Большая тень</div>
<div class="shadow-xl">Очень большая</div>
<div class="shadow-2xl">Максимальная</div>
<div class="shadow-none">Без тени</div>
```

### Состояния (hover, focus, active)

```html
<!-- Hover -->
<button class="bg-blue-500 hover:bg-blue-600">
  Наведи на меня
</button>

<!-- Focus -->
<input class="border focus:border-blue-500 focus:ring-2 focus:ring-blue-200">

<!-- Active -->
<button class="bg-blue-500 active:bg-blue-700">
  Нажми меня
</button>

<!-- Комбинация -->
<button class="
  bg-blue-500
  hover:bg-blue-600
  focus:ring-2
  focus:ring-blue-300
  active:bg-blue-700
  transition
">
  Кнопка
</button>
```

### Переходы и анимации

```html
<!-- Плавный переход -->
<div class="transition hover:bg-blue-500">
  Плавное изменение
</div>

<!-- Настройка перехода -->
<div class="transition-all duration-300 ease-in-out">
  Все свойства за 300ms
</div>

<div class="transition-colors duration-200">
  Только цвета
</div>

<div class="transition-transform duration-500 hover:scale-105">
  Масштабирование
</div>
```

---

## Практика: Первая карточка

Создадим красивую карточку товара:

```html
<div class="max-w-sm mx-auto mt-10">
  <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
    <!-- Изображение -->
    <img
      src="https://picsum.photos/400/300"
      alt="Товар"
      class="w-full h-48 object-cover"
    >

    <!-- Контент -->
    <div class="p-6">
      <!-- Категория -->
      <span class="text-xs font-semibold text-blue-600 uppercase tracking-wide">
        Электроника
      </span>

      <!-- Заголовок -->
      <h2 class="mt-2 text-xl font-bold text-gray-900">
        Беспроводные наушники
      </h2>

      <!-- Описание -->
      <p class="mt-2 text-gray-600 text-sm leading-relaxed">
        Качественный звук и активное шумоподавление для комфортного прослушивания музыки.
      </p>

      <!-- Цена и кнопка -->
      <div class="mt-4 flex items-center justify-between">
        <span class="text-2xl font-bold text-gray-900">
          $299
        </span>
        <button class="
          px-4 py-2
          bg-blue-600 text-white
          rounded-lg font-medium
          hover:bg-blue-700
          transition-colors
        ">
          В корзину
        </button>
      </div>
    </div>
  </div>
</div>
```

**Результат:** Красивая карточка с тенью, скруглёнными углами, изображением и интерактивной кнопкой.

---

---

## Flexbox и Grid

### Flexbox — основы

Flexbox идеален для одномерных раскладок (строка или колонка).

**Включение Flexbox:**

```html
<div class="flex">
  <div>Элемент 1</div>
  <div>Элемент 2</div>
  <div>Элемент 3</div>
</div>
```

**Направление:**

```html
<!-- Горизонтально (по умолчанию) -->
<div class="flex flex-row">...</div>

<!-- Вертикально -->
<div class="flex flex-col">...</div>

<!-- Обратный порядок -->
<div class="flex flex-row-reverse">...</div>
<div class="flex flex-col-reverse">...</div>
```

**Выравнивание по главной оси (justify):**

```html
<!-- Горизонтальное выравнивание для flex-row -->
<div class="flex justify-start">В начало</div>
<div class="flex justify-center">По центру</div>
<div class="flex justify-end">В конец</div>
<div class="flex justify-between">Между элементами</div>
<div class="flex justify-around">Вокруг элементов</div>
<div class="flex justify-evenly">Равномерно</div>
```

**Выравнивание по поперечной оси (items):**

```html
<!-- Вертикальное выравнивание для flex-row -->
<div class="flex items-start">Сверху</div>
<div class="flex items-center">По центру</div>
<div class="flex items-end">Снизу</div>
<div class="flex items-stretch">Растянуть (по умолчанию)</div>
```

**Отступы между элементами (gap):**

```html
<div class="flex gap-4">
  <div>Элемент</div>
  <div>Элемент</div>
  <div>Элемент</div>
</div>

<!-- Разные отступы -->
<div class="flex gap-x-4 gap-y-2">...</div>
```

**Перенос на новую строку:**

```html
<div class="flex flex-wrap">
  <!-- Элементы переносятся если не помещаются -->
</div>
```

**Управление элементами:**

```html
<div class="flex">
  <div class="flex-1">Занимает всё свободное место</div>
  <div class="flex-none">Не растягивается</div>
  <div class="flex-auto">Растягивается от контента</div>
</div>

<!-- Порядок -->
<div class="flex">
  <div class="order-3">Третий</div>
  <div class="order-1">Первый</div>
  <div class="order-2">Второй</div>
</div>
```

### Практика: Навигация с Flexbox

```html
<nav class="bg-white shadow">
  <div class="max-w-6xl mx-auto px-4">
    <div class="flex justify-between items-center h-16">
      <!-- Логотип -->
      <a href="#" class="text-xl font-bold text-blue-600">
        MyBrand
      </a>

      <!-- Меню -->
      <div class="flex items-center gap-8">
        <a href="#" class="text-gray-600 hover:text-blue-600 transition">
          Главная
        </a>
        <a href="#" class="text-gray-600 hover:text-blue-600 transition">
          О нас
        </a>
        <a href="#" class="text-gray-600 hover:text-blue-600 transition">
          Услуги
        </a>
        <a href="#" class="text-gray-600 hover:text-blue-600 transition">
          Контакты
        </a>
      </div>

      <!-- Кнопка -->
      <button class="
        px-4 py-2
        bg-blue-600 text-white
        rounded-lg font-medium
        hover:bg-blue-700 transition
      ">
        Войти
      </button>
    </div>
  </div>
</nav>
```

### Практика: Центрирование

```html
<!-- Центрирование по вертикали и горизонтали -->
<div class="min-h-screen flex items-center justify-center bg-gray-100">
  <div class="bg-white p-8 rounded-xl shadow-lg">
    <h1 class="text-2xl font-bold">Центрированный блок</h1>
  </div>
</div>
```

### Grid — основы

CSS Grid идеален для двумерных раскладок (строки И колонки).

**Включение Grid:**

```html
<div class="grid grid-cols-3 gap-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
  <div>5</div>
  <div>6</div>
</div>
```

**Количество колонок:**

```html
<div class="grid grid-cols-1">1 колонка</div>
<div class="grid grid-cols-2">2 колонки</div>
<div class="grid grid-cols-3">3 колонки</div>
<div class="grid grid-cols-4">4 колонки</div>
<div class="grid grid-cols-6">6 колонок</div>
<div class="grid grid-cols-12">12 колонок</div>
```

**Отступы:**

```html
<div class="grid grid-cols-3 gap-4">Одинаковые отступы</div>
<div class="grid grid-cols-3 gap-x-4 gap-y-8">Разные отступы</div>
```

**Объединение ячеек:**

```html
<div class="grid grid-cols-3 gap-4">
  <div class="col-span-2">Занимает 2 колонки</div>
  <div>1 колонка</div>
  <div class="col-span-3">Вся ширина</div>
</div>

<!-- Строки -->
<div class="grid grid-cols-2 gap-4">
  <div class="row-span-2">Занимает 2 строки</div>
  <div>Обычная ячейка</div>
  <div>Обычная ячейка</div>
</div>
```

**Автоматические колонки:**

```html
<!-- Минимум 250px, максимум равное распределение -->
<div class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
  <div>Карточка</div>
  <div>Карточка</div>
  <div>Карточка</div>
  <div>Карточка</div>
</div>
```

### Практика: Сетка карточек

```html
<div class="max-w-6xl mx-auto p-8">
  <h2 class="text-3xl font-bold text-gray-900 mb-8">
    Наши услуги
  </h2>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Карточка 1 -->
    <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        Быстрая доставка
      </h3>
      <p class="text-gray-600 text-sm">
        Доставим ваш заказ в течение 24 часов по всему городу.
      </p>
    </div>

    <!-- Карточка 2 -->
    <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        Гарантия качества
      </h3>
      <p class="text-gray-600 text-sm">
        100% гарантия на все товары. Возврат в течение 30 дней.
      </p>
    </div>

    <!-- Карточка 3 -->
    <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
      <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        Поддержка 24/7
      </h3>
      <p class="text-gray-600 text-sm">
        Наша команда всегда готова помочь вам в любое время.
      </p>
    </div>
  </div>
</div>
```

### Практика: Сложная раскладка

```html
<div class="grid grid-cols-4 grid-rows-3 gap-4 h-screen p-4">
  <!-- Шапка на всю ширину -->
  <header class="col-span-4 bg-blue-600 rounded-xl flex items-center justify-center">
    <h1 class="text-white text-2xl font-bold">Header</h1>
  </header>

  <!-- Сайдбар -->
  <aside class="row-span-2 bg-gray-200 rounded-xl p-4">
    <h2 class="font-bold mb-4">Sidebar</h2>
    <nav class="space-y-2">
      <a href="#" class="block text-gray-600 hover:text-blue-600">Ссылка 1</a>
      <a href="#" class="block text-gray-600 hover:text-blue-600">Ссылка 2</a>
      <a href="#" class="block text-gray-600 hover:text-blue-600">Ссылка 3</a>
    </nav>
  </aside>

  <!-- Основной контент -->
  <main class="col-span-3 row-span-2 bg-white rounded-xl shadow p-6">
    <h2 class="text-xl font-bold mb-4">Main Content</h2>
    <p class="text-gray-600">
      Здесь находится основной контент страницы.
    </p>
  </main>
</div>
```

---

## Адаптивный дизайн

Tailwind использует подход **mobile-first**. Базовые стили применяются к мобильным устройствам, а модификаторы добавляют стили для больших экранов.

### Брейкпоинты

| Префикс | Минимальная ширина | CSS |
|---------|-------------------|-----|
| `sm` | 640px | `@media (min-width: 640px)` |
| `md` | 768px | `@media (min-width: 768px)` |
| `lg` | 1024px | `@media (min-width: 1024px)` |
| `xl` | 1280px | `@media (min-width: 1280px)` |
| `2xl` | 1536px | `@media (min-width: 1536px)` |

### Использование

```html
<!-- Мобильный: 1 колонка, Планшет: 2, Десктоп: 4 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div>Карточка 1</div>
  <div>Карточка 2</div>
  <div>Карточка 3</div>
  <div>Карточка 4</div>
</div>

<!-- Скрыть на мобильном -->
<div class="hidden md:block">
  Видно только на планшетах и выше
</div>

<!-- Показать только на мобильном -->
<div class="block md:hidden">
  Видно только на мобильных
</div>

<!-- Разные отступы -->
<div class="p-4 md:p-6 lg:p-8 xl:p-12">
  Адаптивные отступы
</div>

<!-- Разный размер текста -->
<h1 class="text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
  Адаптивный заголовок
</h1>
```

### Практика: Адаптивная навигация

```html
<nav class="bg-white shadow">
  <div class="max-w-6xl mx-auto px-4">
    <div class="flex justify-between items-center h-16">
      <!-- Логотип -->
      <a href="#" class="text-xl font-bold text-blue-600">
        MyBrand
      </a>

      <!-- Бургер-меню (мобильное) -->
      <button class="md:hidden p-2">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <!-- Меню (десктоп) -->
      <div class="hidden md:flex items-center gap-8">
        <a href="#" class="text-gray-600 hover:text-blue-600">Главная</a>
        <a href="#" class="text-gray-600 hover:text-blue-600">О нас</a>
        <a href="#" class="text-gray-600 hover:text-blue-600">Услуги</a>
        <a href="#" class="text-gray-600 hover:text-blue-600">Контакты</a>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Войти
        </button>
      </div>
    </div>
  </div>
</nav>
```

### Практика: Адаптивный Hero-блок

```html
<section class="bg-gradient-to-br from-blue-600 to-purple-700 min-h-screen">
  <div class="max-w-6xl mx-auto px-4 py-12 md:py-20 lg:py-32">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <!-- Текст -->
      <div class="text-center lg:text-left">
        <h1 class="
          text-3xl md:text-4xl lg:text-5xl xl:text-6xl
          font-bold text-white leading-tight
        ">
          Создаём цифровые продукты
        </h1>
        <p class="
          mt-4 md:mt-6
          text-lg md:text-xl
          text-blue-100
          max-w-xl mx-auto lg:mx-0
        ">
          Мы помогаем бизнесу расти с помощью современных технологий
          и инновационных решений.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
          <button class="
            px-8 py-3
            bg-white text-blue-600
            rounded-lg font-semibold
            hover:bg-gray-100 transition
          ">
            Начать проект
          </button>
          <button class="
            px-8 py-3
            border-2 border-white text-white
            rounded-lg font-semibold
            hover:bg-white/10 transition
          ">
            Узнать больше
          </button>
        </div>
      </div>

      <!-- Изображение -->
      <div class="hidden lg:block">
        <img
          src="https://picsum.photos/600/400"
          alt="Hero"
          class="rounded-2xl shadow-2xl"
        >
      </div>
    </div>
  </div>
</section>
```

---

## Тёмная тема

### Автоматическая (системные настройки)

По умолчанию Tailwind CSS 4 использует системные настройки:

```html
<div class="bg-white dark:bg-gray-900">
  <h1 class="text-gray-900 dark:text-white">
    Заголовок
  </h1>
  <p class="text-gray-600 dark:text-gray-400">
    Текст параграфа
  </p>
</div>
```

### Ручное переключение

Добавьте в CSS:

```css
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));
```

Теперь тёмная тема активируется классом `dark` на `<html>`:

```html
<html class="dark">
  <body class="bg-white dark:bg-gray-900">
    ...
  </body>
</html>
```

**JavaScript для переключения:**

```html
<button onclick="toggleDark()" class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
  <span class="dark:hidden">🌙</span>
  <span class="hidden dark:inline">☀️</span>
</button>

<script>
function toggleDark() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme',
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
}

// Загрузка сохранённой темы
if (localStorage.theme === 'dark' ||
    (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}
</script>
```

### Практика: Карточка с тёмной темой

```html
<div class="
  bg-white dark:bg-gray-800
  rounded-xl shadow-lg dark:shadow-gray-900/50
  p-6
  transition-colors duration-300
">
  <div class="flex items-center gap-4">
    <img
      src="https://i.pravatar.cc/100"
      alt="Avatar"
      class="w-12 h-12 rounded-full"
    >
    <div>
      <h3 class="font-semibold text-gray-900 dark:text-white">
        Иван Иванов
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Frontend Developer
      </p>
    </div>
  </div>

  <p class="mt-4 text-gray-600 dark:text-gray-300">
    Занимаюсь веб-разработкой более 5 лет.
    Специализируюсь на React и Vue.
  </p>

  <div class="mt-4 flex gap-2">
    <span class="
      px-3 py-1
      bg-blue-100 dark:bg-blue-900
      text-blue-600 dark:text-blue-300
      rounded-full text-sm
    ">
      React
    </span>
    <span class="
      px-3 py-1
      bg-green-100 dark:bg-green-900
      text-green-600 dark:text-green-300
      rounded-full text-sm
    ">
      Vue
    </span>
  </div>
</div>
```

---

## Кастомизация через @theme

В Tailwind CSS 4 конфигурация происходит прямо в CSS через директиву `@theme`.

### Базовая настройка

```css
/* styles.css */
@import "tailwindcss";

@theme {
  /* Кастомные цвета */
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-secondary: #ec4899;
  --color-accent: #f59e0b;

  /* Шрифты */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-display: "Montserrat", sans-serif;

  /* Кастомные размеры */
  --spacing-18: 4.5rem;
  --spacing-128: 32rem;

  /* Кастомные брейкпоинты */
  --breakpoint-xs: 475px;
  --breakpoint-3xl: 1920px;

  /* Тени */
  --shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-glow: 0 0 30px rgba(99, 102, 241, 0.3);

  /* Радиусы */
  --radius-4xl: 2rem;

  /* Анимации */
  --animate-fade-in: fade-in 0.5s ease-out;
  --animate-slide-up: slide-up 0.4s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Использование кастомных значений

```html
<!-- Кастомные цвета -->
<button class="bg-primary hover:bg-primary-dark text-white">
  Основная кнопка
</button>

<span class="text-secondary">Акцентный текст</span>

<!-- Кастомные шрифты -->
<h1 class="font-display text-4xl">Заголовок</h1>
<p class="font-sans">Основной текст</p>

<!-- Кастомные размеры -->
<div class="p-18 max-w-128">Контент</div>

<!-- Кастомные тени -->
<div class="shadow-soft hover:shadow-glow transition-shadow">
  Карточка с мягкой тенью
</div>

<!-- Кастомные анимации -->
<div class="animate-fade-in">Появление</div>
<div class="animate-slide-up">Выезд снизу</div>
```

### Сброс дефолтных значений

```css
@theme {
  /* Убрать все дефолтные цвета и задать свои */
  --color-*: initial;

  --color-brand: #2563eb;
  --color-brand-light: #3b82f6;
  --color-brand-dark: #1d4ed8;

  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;
}
```

---

## Компоненты

Создадим переиспользуемые компоненты с помощью `@layer components`.

### Кнопки

```css
@import "tailwindcss";

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  }

  .btn-primary {
    @apply btn bg-blue-600 text-white;
    @apply hover:bg-blue-700;
    @apply focus:ring-blue-500;
  }

  .btn-secondary {
    @apply btn bg-gray-200 text-gray-800;
    @apply hover:bg-gray-300;
    @apply focus:ring-gray-400;
  }

  .btn-outline {
    @apply btn border-2 border-blue-600 text-blue-600 bg-transparent;
    @apply hover:bg-blue-600 hover:text-white;
    @apply focus:ring-blue-500;
  }

  .btn-ghost {
    @apply btn text-gray-600 bg-transparent;
    @apply hover:bg-gray-100;
    @apply focus:ring-gray-400;
  }

  .btn-sm {
    @apply px-3 py-1.5 text-sm;
  }

  .btn-lg {
    @apply px-6 py-3 text-lg;
  }
}
```

**Использование:**

```html
<button class="btn-primary">Основная</button>
<button class="btn-secondary">Вторичная</button>
<button class="btn-outline">С обводкой</button>
<button class="btn-ghost">Прозрачная</button>

<button class="btn-primary btn-sm">Маленькая</button>
<button class="btn-primary btn-lg">Большая</button>
```

### Инпуты

```css
@layer components {
  .input {
    @apply w-full px-4 py-2 rounded-lg border border-gray-300;
    @apply bg-white text-gray-900;
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
    @apply placeholder:text-gray-400;
    @apply transition-all duration-200;
  }

  .input-error {
    @apply input border-red-500 focus:ring-red-500;
  }

  .label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }

  .input-group {
    @apply space-y-1;
  }

  .error-text {
    @apply text-sm text-red-600 mt-1;
  }
}
```

**Использование:**

```html
<div class="input-group">
  <label class="label">Email</label>
  <input type="email" class="input" placeholder="you@example.com">
</div>

<div class="input-group">
  <label class="label">Пароль</label>
  <input type="password" class="input-error" placeholder="********">
  <p class="error-text">Минимум 8 символов</p>
</div>
```

### Карточки

```css
@layer components {
  .card {
    @apply bg-white rounded-xl shadow-md overflow-hidden;
    @apply dark:bg-gray-800;
  }

  .card-hover {
    @apply card transition-all duration-300;
    @apply hover:shadow-xl hover:-translate-y-1;
  }

  .card-body {
    @apply p-6;
  }

  .card-title {
    @apply text-xl font-bold text-gray-900 dark:text-white;
  }

  .card-text {
    @apply text-gray-600 dark:text-gray-300 mt-2;
  }

  .card-footer {
    @apply px-6 py-4 bg-gray-50 dark:bg-gray-700/50;
  }
}
```

---

## Практика: Многостраничный сайт

Создадим полноценный многостраничный шаблон с:
- Главная страница
- О компании
- Услуги
- Контакты

### Структура проекта

```
my-website/
├── index.html          # Главная
├── about.html          # О нас
├── services.html       # Услуги
├── contact.html        # Контакты
├── src/
│   └── styles.css      # Стили
└── package.json
```

### styles.css

```css
@import "tailwindcss";

@theme {
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-secondary: #7c3aed;
  --font-sans: "Inter", system-ui, sans-serif;
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.08);
}

@variant dark (&:where(.dark, .dark *));

@layer components {
  /* Кнопки */
  .btn {
    @apply inline-flex items-center justify-center gap-2;
    @apply px-5 py-2.5 rounded-lg font-medium;
    @apply transition-all duration-200;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  }

  .btn-primary {
    @apply btn bg-primary text-white hover:bg-primary-dark focus:ring-primary;
  }

  .btn-white {
    @apply btn bg-white text-primary hover:bg-gray-100 focus:ring-white;
  }

  .btn-outline {
    @apply btn border-2 border-white text-white hover:bg-white/10;
  }

  /* Карточки */
  .card {
    @apply bg-white rounded-2xl shadow-card p-6;
    @apply dark:bg-gray-800;
  }

  /* Секции */
  .section {
    @apply py-16 md:py-24;
  }

  .container-main {
    @apply max-w-6xl mx-auto px-4 sm:px-6 lg:px-8;
  }

  /* Заголовки секций */
  .section-title {
    @apply text-3xl md:text-4xl font-bold text-gray-900 dark:text-white;
  }

  .section-subtitle {
    @apply mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl;
  }
}
```

### Общий Header (для всех страниц)

```html
<!-- Header -->
<header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-700">
  <div class="container-main">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="index.html" class="flex items-center gap-2">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span class="text-white font-bold">M</span>
        </div>
        <span class="text-xl font-bold text-gray-900 dark:text-white">MyBrand</span>
      </a>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center gap-8">
        <a href="index.html" class="text-gray-600 hover:text-primary transition dark:text-gray-300">Главная</a>
        <a href="about.html" class="text-gray-600 hover:text-primary transition dark:text-gray-300">О нас</a>
        <a href="services.html" class="text-gray-600 hover:text-primary transition dark:text-gray-300">Услуги</a>
        <a href="contact.html" class="text-gray-600 hover:text-primary transition dark:text-gray-300">Контакты</a>
      </nav>

      <!-- Actions -->
      <div class="flex items-center gap-4">
        <button onclick="toggleDark()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <svg class="w-5 h-5 text-gray-600 dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
          <svg class="w-5 h-5 text-gray-300 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </button>
        <a href="contact.html" class="btn-primary hidden sm:inline-flex">
          Связаться
        </a>
        <!-- Mobile menu button -->
        <button class="md:hidden p-2" onclick="toggleMenu()">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Menu -->
  <div id="mobileMenu" class="hidden md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
    <div class="container-main py-4 space-y-3">
      <a href="index.html" class="block py-2 text-gray-600 dark:text-gray-300">Главная</a>
      <a href="about.html" class="block py-2 text-gray-600 dark:text-gray-300">О нас</a>
      <a href="services.html" class="block py-2 text-gray-600 dark:text-gray-300">Услуги</a>
      <a href="contact.html" class="block py-2 text-gray-600 dark:text-gray-300">Контакты</a>
    </div>
  </div>
</header>

<script>
function toggleDark() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('hidden');
}

if (localStorage.theme === 'dark' || (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}
</script>
```

### index.html — Главная страница

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MyBrand — Цифровые решения</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="src/styles.css">
</head>
<body class="bg-gray-50 dark:bg-gray-900">
  <!-- Header здесь -->

  <main class="pt-16">
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-primary to-secondary min-h-[90vh] flex items-center">
      <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      <div class="container-main relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div class="text-center lg:text-left">
            <span class="inline-block px-4 py-1.5 bg-white/20 text-white rounded-full text-sm font-medium mb-6">
              Новое поколение решений
            </span>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Создаём цифровое
              <span class="block">будущее вместе</span>
            </h1>
            <p class="mt-6 text-lg sm:text-xl text-white/80 max-w-xl mx-auto lg:mx-0">
              Мы помогаем компаниям трансформироваться и расти с помощью
              современных технологий и инновационных решений.
            </p>
            <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="contact.html" class="btn-white">
                Начать проект
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </a>
              <a href="about.html" class="btn-outline">
                Узнать больше
              </a>
            </div>
          </div>
          <div class="hidden lg:block">
            <img src="https://picsum.photos/600/500" alt="Hero" class="rounded-2xl shadow-2xl">
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="section bg-white dark:bg-gray-800">
      <div class="container-main">
        <div class="text-center mb-16">
          <h2 class="section-title">Почему выбирают нас</h2>
          <p class="section-subtitle mx-auto">
            Мы объединяем опыт, технологии и креативность для достижения ваших целей
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="card group hover:shadow-xl transition-all duration-300">
            <div class="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Быстрая разработка</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Используем современные технологии для ускорения разработки без потери качества.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="card group hover:shadow-xl transition-all duration-300">
            <div class="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Надёжность</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Гарантируем стабильную работу и поддержку на всех этапах сотрудничества.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="card group hover:shadow-xl transition-all duration-300">
            <div class="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Уникальный дизайн</h3>
            <p class="text-gray-600 dark:text-gray-400">
              Каждый проект создаётся с нуля под ваши уникальные потребности и бренд.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="section bg-gray-50 dark:bg-gray-900">
      <div class="container-main">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-4xl md:text-5xl font-bold text-primary">150+</div>
            <div class="mt-2 text-gray-600 dark:text-gray-400">Проектов</div>
          </div>
          <div class="text-center">
            <div class="text-4xl md:text-5xl font-bold text-primary">50+</div>
            <div class="mt-2 text-gray-600 dark:text-gray-400">Клиентов</div>
          </div>
          <div class="text-center">
            <div class="text-4xl md:text-5xl font-bold text-primary">8</div>
            <div class="mt-2 text-gray-600 dark:text-gray-400">Лет опыта</div>
          </div>
          <div class="text-center">
            <div class="text-4xl md:text-5xl font-bold text-primary">24/7</div>
            <div class="mt-2 text-gray-600 dark:text-gray-400">Поддержка</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section bg-primary">
      <div class="container-main text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-white">
          Готовы начать проект?
        </h2>
        <p class="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          Свяжитесь с нами сегодня и получите бесплатную консультацию
          по вашему проекту.
        </p>
        <a href="contact.html" class="btn-white mt-8 inline-flex">
          Связаться с нами
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </a>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="bg-gray-900 text-gray-400 py-12">
    <div class="container-main">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div class="md:col-span-2">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span class="text-white font-bold">M</span>
            </div>
            <span class="text-xl font-bold text-white">MyBrand</span>
          </div>
          <p class="max-w-sm">
            Создаём цифровые продукты, которые помогают бизнесу расти и развиваться.
          </p>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-4">Навигация</h4>
          <ul class="space-y-2">
            <li><a href="index.html" class="hover:text-white transition">Главная</a></li>
            <li><a href="about.html" class="hover:text-white transition">О нас</a></li>
            <li><a href="services.html" class="hover:text-white transition">Услуги</a></li>
            <li><a href="contact.html" class="hover:text-white transition">Контакты</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-4">Контакты</h4>
          <ul class="space-y-2">
            <li>info@mybrand.com</li>
            <li>+7 (999) 123-45-67</li>
            <li>г. Москва</li>
          </ul>
        </div>
      </div>
      <div class="mt-12 pt-8 border-t border-gray-800 text-center">
        <p>&copy; 2024 MyBrand. Все права защищены.</p>
      </div>
    </div>
  </footer>
</body>
</html>
```

### contact.html — Страница контактов

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Контакты — MyBrand</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="src/styles.css">
</head>
<body class="bg-gray-50 dark:bg-gray-900">
  <!-- Header здесь (тот же) -->

  <main class="pt-16">
    <!-- Hero -->
    <section class="section bg-white dark:bg-gray-800">
      <div class="container-main">
        <div class="text-center mb-12">
          <h1 class="section-title">Свяжитесь с нами</h1>
          <p class="section-subtitle mx-auto">
            Готовы обсудить ваш проект? Заполните форму или свяжитесь любым удобным способом.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Contact Info -->
          <div class="space-y-6">
            <div class="card flex items-start gap-4">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">Email</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-1">info@mybrand.com</p>
              </div>
            </div>

            <div class="card flex items-start gap-4">
              <div class="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">Телефон</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-1">+7 (999) 123-45-67</p>
              </div>
            </div>

            <div class="card flex items-start gap-4">
              <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">Адрес</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-1">г. Москва, ул. Примерная, д. 1</p>
              </div>
            </div>
          </div>

          <!-- Contact Form -->
          <div class="lg:col-span-2">
            <form class="card">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Имя
                  </label>
                  <input
                    type="text"
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    placeholder="Ваше имя"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition"
                    placeholder="you@example.com"
                  >
                </div>
              </div>

              <div class="mt-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Тема
                </label>
                <select class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition">
                  <option>Выберите тему</option>
                  <option>Разработка сайта</option>
                  <option>Мобильное приложение</option>
                  <option>Дизайн</option>
                  <option>Консультация</option>
                  <option>Другое</option>
                </select>
              </div>

              <div class="mt-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Сообщение
                </label>
                <textarea
                  rows="5"
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none"
                  placeholder="Опишите ваш проект..."
                ></textarea>
              </div>

              <button type="submit" class="btn-primary w-full mt-6">
                Отправить сообщение
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer здесь (тот же) -->
</body>
</html>
```

---

## Чеклист изученного

- [ ] Понимаю что такое utility-first подход
- [ ] Могу установить Tailwind CSS 4
- [ ] Знаю основные классы (цвета, отступы, типографика)
- [ ] Умею работать с Flexbox и Grid
- [ ] Понимаю адаптивный дизайн (sm, md, lg, xl)
- [ ] Могу настроить тёмную тему
- [ ] Умею кастомизировать через @theme
- [ ] Могу создавать компоненты через @layer
- [ ] Способен сверстать многостраничный сайт

---

## Полезные ресурсы

- [Официальная документация](https://tailwindcss.com/docs)
- [Tailwind UI](https://tailwindui.com) — готовые компоненты
- [Heroicons](https://heroicons.com) — иконки от создателей Tailwind
- [Headless UI](https://headlessui.com) — доступные компоненты

---

**Поздравляю!** Вы прошли полный курс по Tailwind CSS 4. Теперь вы можете создавать современные адаптивные сайты с тёмной темой и кастомным дизайном.
