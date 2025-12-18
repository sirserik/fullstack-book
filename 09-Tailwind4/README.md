# Tailwind CSS 4

Tailwind CSS 4 — это крупнейшее обновление фреймворка с момента его создания. Полностью переписанный движок обеспечивает до 5x более быструю полную сборку и более 100x быструю инкрементальную сборку.

## Ключевые изменения в Tailwind CSS 4

### Высокопроизводительный движок

Tailwind CSS 4 построен на новом движке Oxide, написанном на Rust:

- **5x быстрее** полная сборка
- **100x+ быстрее** инкрементальная сборка
- Уменьшенный размер установки
- Унифицированный тулчейн (Lightning CSS встроен)

### CSS-first конфигурация

Главное изменение — конфигурация теперь происходит в CSS, а не в JavaScript:

```css
/* app.css */
@import "tailwindcss";

@theme {
  --font-display: "Satoshi", "sans-serif";

  --breakpoint-3xl: 1920px;

  --color-primary: #3490dc;
  --color-secondary: #ffed4a;
  --color-danger: #e3342f;

  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
  --ease-snappy: cubic-bezier(0.2, 0, 0, 1);

  --animate-fade-in: fade-in 0.5s var(--ease-fluid);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Установка

```bash
# Установка через npm
npm install tailwindcss @tailwindcss/postcss

# Или через CLI
npm install tailwindcss @tailwindcss/cli
```

### Настройка PostCSS

```js
// postcss.config.js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Импорт в CSS

```css
/* Новый способ - один импорт */
@import "tailwindcss";

/* Старый способ (deprecated) */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Директива @theme

Директива `@theme` заменяет объект `theme` из `tailwind.config.js`:

```css
@import "tailwindcss";

@theme {
  /* Цвета */
  --color-*: initial; /* Сброс всех цветов */
  --color-primary: oklch(0.84 0.18 117.33);
  --color-secondary: oklch(0.83 0.14 254.13);
  --color-accent: oklch(0.7 0.2 30);

  /* Шрифты */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Fira Code", monospace;

  /* Размеры текста */
  --text-tiny: 0.625rem;
  --text-tiny--line-height: 1rem;

  /* Брейкпоинты */
  --breakpoint-xs: 475px;
  --breakpoint-3xl: 1920px;

  /* Радиусы */
  --radius-4xl: 2rem;

  /* Тени */
  --shadow-glow: 0 0 20px oklch(0.7 0.2 30 / 0.5);

  /* Анимации */
  --animate-bounce-in: bounce-in 0.5s ease-out;
}

@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

## Новые утилиты

### Container Queries

Контейнерные запросы теперь встроены:

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row @lg:grid @lg:grid-cols-3">
    <!-- Реагирует на размер контейнера, не viewport -->
  </div>
</div>

<!-- Именованные контейнеры -->
<div class="@container/sidebar">
  <nav class="@md/sidebar:flex-row">...</nav>
</div>
```

### 3D Transforms

```html
<!-- Поворот в 3D -->
<div class="rotate-x-45 rotate-y-12">
  3D Card
</div>

<!-- Перспектива -->
<div class="perspective-500">
  <div class="rotate-y-45 preserve-3d">
    Content with perspective
  </div>
</div>

<!-- Transform origin в 3D -->
<div class="origin-top-left transform-3d">
  ...
</div>
```

### Расширенные градиенты

```html
<!-- Градиенты с интерполяцией в oklch -->
<div class="bg-linear-to-r/oklch from-blue-500 to-green-500">
  Более насыщенный градиент
</div>

<!-- Конические градиенты -->
<div class="bg-conic from-red-500 via-yellow-500 to-green-500">
  Conic gradient
</div>

<!-- Радиальные градиенты с позицией -->
<div class="bg-radial-at-tl from-purple-500 to-transparent">
  Radial from top-left
</div>
```

### Расширенные тени

```html
<!-- Inset shadow -->
<div class="inset-shadow-sm inset-shadow-black/10">
  Внутренняя тень
</div>

<!-- Ring с inset -->
<div class="inset-ring inset-ring-white/20">
  Внутреннее кольцо
</div>

<!-- Цветные тени -->
<div class="shadow-lg shadow-blue-500/50">
  Синяя тень
</div>
```

### Field Sizing

```html
<!-- Автоматический размер textarea -->
<textarea class="field-sizing-content">
  Высота подстраивается под контент
</textarea>
```

### Новые цветовые утилиты

```html
<!-- Color scheme для dark mode -->
<html class="scheme-dark">
  <!-- Браузерные элементы тоже темные -->
</html>

<!-- currentColor -->
<div class="border-current bg-current/10">
  Использует текущий цвет текста
</div>
```

### Логические свойства

```html
<!-- Start/End вместо Left/Right -->
<div class="ms-4 me-2 ps-6 pe-4">
  Margin/Padding start/end
</div>

<div class="rounded-s-lg border-e-2">
  Border/Radius start/end
</div>

<!-- Для RTL языков автоматически меняется -->
```

## Варианты состояний

### Новые варианты

```html
<!-- Starting style (для анимаций появления) -->
<div class="starting:opacity-0 starting:scale-95 transition">
  Анимация появления
</div>

<!-- Not варианты -->
<div class="not-first:mt-4 not-last:mb-4">
  Все кроме первого/последнего
</div>

<!-- Inert -->
<div class="inert:opacity-50 inert:pointer-events-none">
  Состояние inert
</div>

<!-- nth-child -->
<div class="nth-3:bg-blue-500 nth-odd:bg-gray-100">
  Каждый третий синий
</div>

<!-- Open state -->
<details class="open:bg-blue-50">
  <summary>Details</summary>
</details>
```

### Группировка вариантов

```html
<!-- Несколько вариантов одновременно -->
<div class="group-hover:group-focus:text-blue-500">
  ...
</div>

<!-- Вложенные группы -->
<div class="group/outer">
  <div class="group/inner">
    <span class="group-hover/inner:text-blue-500">
      Inner hover
    </span>
  </div>
</div>
```

## Работа с темами

### Темная тема

```css
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));
```

```html
<html class="dark">
  <body class="bg-white dark:bg-gray-900">
    <h1 class="text-gray-900 dark:text-white">
      Темная тема
    </h1>
  </body>
</html>
```

### Кастомные варианты

```css
@import "tailwindcss";

/* Вариант для режима высокой контрастности */
@variant hc (&:where(.high-contrast, .high-contrast *));

/* Медиа запрос вариант */
@variant touch (@media (hover: none));
```

```html
<button class="hc:border-2 hc:border-black touch:p-4">
  Адаптивная кнопка
</button>
```

## Плагины и расширения

### Использование плагинов

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms";
```

### Создание утилит

```css
@import "tailwindcss";

@utility scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

@utility text-balance {
  text-wrap: balance;
}
```

### Создание компонентов

```css
@import "tailwindcss";

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition;
  }

  .btn-primary {
    @apply btn bg-blue-500 text-white hover:bg-blue-600;
  }

  .card {
    @apply bg-white rounded-xl shadow-lg p-6;
  }
}
```

## Миграция с Tailwind CSS 3

### Изменения в конфигурации

```css
/* Было: tailwind.config.js */
/* module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3490dc'
      }
    }
  }
} */

/* Стало: app.css */
@import "tailwindcss";

@theme {
  --color-primary: #3490dc;
}
```

### Переименованные утилиты

| Tailwind CSS 3 | Tailwind CSS 4 |
|----------------|----------------|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `shadow-md` | `shadow-md` (без изменений) |
| `drop-shadow-sm` | `drop-shadow-xs` |
| `drop-shadow` | `drop-shadow-sm` |
| `blur-sm` | `blur-xs` |
| `blur` | `blur-sm` |
| `rounded-sm` | `rounded-xs` |
| `rounded` | `rounded-sm` |
| `outline-none` | `outline-hidden` |

### Изменения в Ring

```html
<!-- Tailwind CSS 3 -->
<div class="ring">
  По умолчанию 3px ring
</div>

<!-- Tailwind CSS 4 -->
<div class="ring">
  По умолчанию 1px ring
</div>

<!-- Для 3px как раньше -->
<div class="ring-3">
  3px ring
</div>
```

### Изменения в градиентах

```html
<!-- Tailwind CSS 3 -->
<div class="bg-gradient-to-r from-blue-500 to-green-500">

<!-- Tailwind CSS 4 -->
<div class="bg-linear-to-r from-blue-500 to-green-500">
```

### Удаленные deprecated классы

```html
<!-- Удалены в v4 -->
flex-grow → grow
flex-shrink → shrink
overflow-ellipsis → text-ellipsis
decoration-slice → box-decoration-slice
decoration-clone → box-decoration-clone
```

## Интеграция с Nuxt

### Настройка

```bash
npm install tailwindcss @tailwindcss/postcss
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
})
```

```css
/* assets/css/main.css */
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.7 0.15 250);
  --color-secondary: oklch(0.8 0.12 150);
  --font-sans: "Inter", system-ui, sans-serif;
}
```

### Использование в компонентах

```vue
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 shadow-sm">
      <nav class="@container">
        <div class="@md:flex @md:items-center @md:justify-between">
          <Logo class="h-8" />
          <Navigation />
        </div>
      </nav>
    </header>

    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>
```

### Темная тема с Nuxt

```vue
<script setup lang="ts">
const colorMode = useColorMode()

function toggleDark() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <html :class="{ dark: colorMode.value === 'dark' }">
    <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <button @click="toggleDark" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
        <SunIcon v-if="colorMode.value === 'dark'" class="w-5 h-5" />
        <MoonIcon v-else class="w-5 h-5" />
      </button>
    </body>
  </html>
</template>
```

## Оптимизация производительности

### Автоматическое tree-shaking

Tailwind CSS 4 автоматически включает только используемые стили:

```css
/* Указание путей для сканирования (опционально) */
@import "tailwindcss";
@source "../components/**/*.vue";
@source "../pages/**/*.vue";
@source "../layouts/**/*.vue";
```

### Кэширование

Новый движок эффективно кэширует результаты:

- Инкрементальные сборки практически мгновенные
- Hot reload работает без задержек
- Первая сборка значительно быстрее

## Практический пример: Карточка товара

```vue
<template>
  <article class="group @container">
    <div class="
      relative overflow-hidden rounded-2xl bg-white
      shadow-sm hover:shadow-lg
      ring-1 ring-black/5
      transition duration-300
      dark:bg-gray-800 dark:ring-white/10
    ">
      <!-- Изображение -->
      <div class="aspect-square overflow-hidden">
        <img
          :src="product.image"
          :alt="product.name"
          class="
            h-full w-full object-cover
            transition duration-500
            group-hover:scale-105
          "
        />
      </div>

      <!-- Бейдж скидки -->
      <div
        v-if="product.discount"
        class="
          absolute top-4 right-4
          rounded-full bg-red-500 px-3 py-1
          text-xs font-bold text-white
          shadow-lg shadow-red-500/30
        "
      >
        -{{ product.discount }}%
      </div>

      <!-- Контент -->
      <div class="p-4 @md:p-6">
        <h3 class="
          text-lg font-semibold text-gray-900
          @lg:text-xl
          dark:text-white
        ">
          {{ product.name }}
        </h3>

        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ product.description }}
        </p>

        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-primary">
              {{ formatPrice(product.price) }}
            </span>
            <span
              v-if="product.oldPrice"
              class="text-sm text-gray-400 line-through"
            >
              {{ formatPrice(product.oldPrice) }}
            </span>
          </div>

          <button class="
            rounded-xl bg-primary px-4 py-2
            text-sm font-medium text-white
            transition
            hover:bg-primary/90
            active:scale-95
          ">
            В корзину
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
interface Product {
  name: string
  description: string
  image: string
  price: number
  oldPrice?: number
  discount?: number
}

defineProps<{
  product: Product
}>()

function formatPrice(price: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0,
  }).format(price)
}
</script>
```

## Чеклист миграции

- [ ] Установить `tailwindcss` v4 и `@tailwindcss/postcss`
- [ ] Заменить `tailwind.config.js` на `@theme` в CSS
- [ ] Обновить импорт с `@tailwind` на `@import "tailwindcss"`
- [ ] Переименовать утилиты (shadow-sm → shadow-xs и т.д.)
- [ ] Обновить градиенты (bg-gradient → bg-linear)
- [ ] Проверить ring утилиты (по умолчанию теперь 1px)
- [ ] Заменить deprecated классы (flex-grow → grow)
- [ ] Обновить плагины через `@plugin`
- [ ] Протестировать темную тему
- [ ] Проверить container queries (@container)

## Ресурсы

- [Официальная документация Tailwind CSS 4](https://tailwindcss.com/docs)
- [Гайд по миграции](https://tailwindcss.com/docs/upgrade-guide)
- [Блог-пост о v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [GitHub репозиторий](https://github.com/tailwindlabs/tailwindcss)
