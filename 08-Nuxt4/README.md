# Глава 8: Nuxt 4 — Полное руководство

## Что нового в Nuxt 4

Nuxt 4.0 выпущен **15 июля 2025** года. Это stability-focused релиз с улучшенной производительностью и Developer Experience.

### Ключевые изменения

| Изменение | Описание |
|-----------|----------|
| Новая структура `app/` | Разделение кода приложения |
| Улучшенный Data Fetching | Shared refs, автоочистка |
| TypeScript | Раздельные проекты по контексту |
| Производительность | Быстрый CLI, сокеты |
| Vue DevTools | Консистентные имена компонентов |

---

## Установка Nuxt 4

### Новый проект

```bash
npx nuxi@latest init my-nuxt4-app
cd my-nuxt4-app
npm install
npm run dev
```

### Обновление существующего проекта

```bash
# Обновление до Nuxt 4
npx nuxt upgrade --dedupe

# Автоматическая миграция структуры
npx codemod@latest nuxt/4/migration-recipe

# Миграция только файловой структуры
npx codemod@latest nuxt/4/file-structure
```

---

## Новая структура проекта

### Nuxt 3 (старая)

```
my-app/
├── assets/
├── components/
├── composables/
├── layouts/
├── middleware/
├── pages/
├── plugins/
├── utils/
├── public/
├── server/
├── nuxt.config.ts
└── package.json
```

### Nuxt 4 (новая)

```
my-app/
├── app/                    # ← Весь код приложения
│   ├── assets/
│   ├── components/
│   ├── composables/
│   ├── layouts/
│   ├── middleware/
│   ├── pages/
│   ├── plugins/
│   └── utils/
├── content/                # Nuxt Content (остаётся)
├── layers/                 # Layers (остаётся)
├── public/                 # Статика (остаётся)
├── server/                 # Серверный код (остаётся)
├── shared/                 # ← НОВОЕ: Общий код
├── nuxt.config.ts          # Конфиг (остаётся)
└── package.json
```

### Преимущества новой структуры

- **Быстрее file watching** — Chokidar работает эффективнее
- **Чище root** — меньше папок в корне
- **Shared код** — общие типы и утилиты для app и server
- **TypeScript** — раздельные tsconfig по контексту

---

## Конфигурация nuxt.config.ts

### Базовый конфиг Nuxt 4

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // Новые опции Nuxt 4
  future: {
    compatibilityVersion: 4,  // Включить все фичи v4
  },

  // Модули
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
  ],

  // Настройки приложения
  app: {
    head: {
      title: 'My Nuxt 4 App',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  // Runtime config
  runtimeConfig: {
    apiSecret: process.env.API_SECRET,
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:8000/api',
    },
  },

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // SSR настройки
  ssr: true,

  // Экспериментальные опции
  experimental: {
    payloadExtraction: true,
    typedPages: true,
  },
})
```

### Совместимость с Nuxt 3

```typescript
// nuxt.config.ts - для постепенной миграции
export default defineNuxtConfig({
  // Использовать старую структуру
  srcDir: '.',

  // Отключить новые функции
  experimental: {
    normalizeComponentNames: false,
    purgeCachedData: false,
  },
})
```

---

## Data Fetching (улучшения)

### useAsyncData - новые возможности

```vue
<script setup lang="ts">
// Базовое использование
const { data: posts, status, error, refresh } = await useAsyncData(
  'posts',
  () => $fetch('/api/posts')
)

// Реактивные ключи (НОВОЕ в Nuxt 4)
const page = ref(1)
const { data } = await useAsyncData(
  () => `posts-page-${page.value}`,  // Реактивный ключ
  () => $fetch(`/api/posts?page=${page.value}`)
)

// При изменении page автоматически рефетчится!
</script>
```

### useFetch - улучшенное кэширование

```vue
<script setup lang="ts">
// Несколько компонентов с одинаковым ключом
// теперь РАЗДЕЛЯЮТ данные автоматически
const { data: user } = await useFetch('/api/user', {
  key: 'current-user',
})

// getCachedData теперь получает причину вызова
const { data } = await useFetch('/api/data', {
  getCachedData(key, nuxtApp, ctx) {
    // ctx.cause: 'initial' | 'refresh' | 'watch'
    if (ctx.cause === 'refresh') {
      return null  // Всегда рефетчить при refresh
    }
    return nuxtApp.payload.data[key]
  },
})

// Автоматическая очистка при unmount
// Данные удаляются когда компонент размонтируется
</script>
```

### Shared Data между компонентами

```vue
<!-- ComponentA.vue -->
<script setup lang="ts">
const { data: user } = await useFetch('/api/user', { key: 'user' })
</script>

<!-- ComponentB.vue -->
<script setup lang="ts">
// Использует ТЕ ЖЕ данные, без повторного запроса!
const { data: user } = await useFetch('/api/user', { key: 'user' })
</script>
```

### Shallow Reactivity (ВАЖНО!)

```vue
<script setup lang="ts">
// В Nuxt 4 data - это shallowRef, не ref!
const { data } = await useAsyncData('items', () => $fetch('/api/items'))

// ❌ Не работает - не реактивно
data.value.items.push(newItem)

// ✅ Правильно - заменяем весь объект
data.value = {
  ...data.value,
  items: [...data.value.items, newItem]
}

// Или используйте triggerRef
import { triggerRef } from 'vue'
data.value.items.push(newItem)
triggerRef(data)
</script>
```

---

## Компоненты

### Создание компонента

```vue
<!-- app/components/UserCard.vue -->
<script setup lang="ts">
interface Props {
  user: {
    id: number
    name: string
    email: string
    avatar?: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [userId: number]
}>()
</script>

<template>
  <div
    class="user-card p-4 rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
    @click="emit('click', user.id)"
  >
    <img
      v-if="user.avatar"
      :src="user.avatar"
      :alt="user.name"
      class="w-16 h-16 rounded-full"
    />
    <h3 class="font-bold text-lg">{{ user.name }}</h3>
    <p class="text-gray-600">{{ user.email }}</p>
  </div>
</template>
```

### Авто-импорт компонентов

```vue
<!-- app/pages/index.vue -->
<template>
  <div>
    <!-- Авто-импорт из components/ -->
    <UserCard
      v-for="user in users"
      :key="user.id"
      :user="user"
      @click="handleUserClick"
    />

    <!-- Вложенные компоненты -->
    <BaseButton>Click me</BaseButton>
    <FormInput v-model="email" placeholder="Email" />
  </div>
</template>
```

### Именование компонентов (Nuxt 4)

```vue
<!-- app/components/base/Button.vue -->
<!--
  В Nuxt 4: имя в DevTools = BaseButton
  В Nuxt 3: имя в DevTools = button

  Теперь консистентно с auto-import!
-->
<script setup lang="ts">
// Для KeepAlive теперь можно использовать BaseButton
</script>

<template>
  <button class="btn">
    <slot />
  </button>
</template>
```

---

## Страницы и роутинг

### Создание страниц

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
// Главная страница
const { data: featured } = await useFetch('/api/featured')
</script>

<template>
  <div>
    <h1>Главная</h1>
    <FeaturedSection :items="featured" />
  </div>
</template>
```

```vue
<!-- app/pages/posts/index.vue -->
<script setup lang="ts">
// Список постов /posts
const { data: posts, status } = await useFetch('/api/posts')
</script>

<template>
  <div>
    <h1>Посты</h1>
    <div v-if="status === 'pending'">Загрузка...</div>
    <PostList v-else :posts="posts" />
  </div>
</template>
```

```vue
<!-- app/pages/posts/[slug].vue -->
<script setup lang="ts">
// Динамический роут /posts/:slug
const route = useRoute()
const { data: post, error } = await useFetch(`/api/posts/${route.params.slug}`)

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Post not found'
  })
}
</script>

<template>
  <article>
    <h1>{{ post.title }}</h1>
    <div v-html="post.content" />
  </article>
</template>
```

### Вложенные роуты

```
app/pages/
├── users/
│   ├── index.vue          # /users
│   ├── [id].vue           # /users/:id
│   └── [id]/
│       ├── posts.vue      # /users/:id/posts
│       └── settings.vue   # /users/:id/settings
```

### Typed Routes (Nuxt 4)

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  experimental: {
    typedPages: true,
  },
})
```

```vue
<script setup lang="ts">
// TypeScript автодополнение для роутов!
const router = useRouter()

// Проверка типов для параметров
router.push({
  name: 'posts-slug',
  params: { slug: 'my-post' }  // TS проверит что slug - string
})
</script>
```

---

## Composables

### Создание composable

```typescript
// app/composables/useUser.ts
export function useUser() {
  const user = useState<User | null>('user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  async function login(email: string, password: string) {
    const { data } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    user.value = data.value
  }

  async function logout() {
    await useFetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }

  async function fetchUser() {
    const { data } = await useFetch('/api/user')
    user.value = data.value
  }

  return {
    user: readonly(user),
    isLoggedIn,
    login,
    logout,
    fetchUser,
  }
}
```

### Использование

```vue
<script setup lang="ts">
const { user, isLoggedIn, login, logout } = useUser()
</script>

<template>
  <div>
    <template v-if="isLoggedIn">
      <span>{{ user.name }}</span>
      <button @click="logout">Выйти</button>
    </template>
    <template v-else>
      <LoginForm @submit="login" />
    </template>
  </div>
</template>
```

---

## Shared директория (НОВОЕ)

```
my-app/
├── app/
├── server/
└── shared/              # ← Общий код
    ├── types/
    │   └── index.ts
    └── utils/
        └── validators.ts
```

### shared/types/index.ts

```typescript
// Типы доступны и в app/, и в server/
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  authorId: number
}

export interface ApiResponse<T> {
  data: T
  meta?: {
    total: number
    page: number
    perPage: number
  }
}
```

### shared/utils/validators.ts

```typescript
// Валидаторы доступны везде
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug)
}
```

### Использование в app/

```vue
<script setup lang="ts">
import type { User, Post } from '~/shared/types'
import { isValidEmail } from '~/shared/utils/validators'

const email = ref('')
const isValid = computed(() => isValidEmail(email.value))
</script>
```

### Использование в server/

```typescript
// server/api/users/[id].get.ts
import type { User } from '~/shared/types'

export default defineEventHandler(async (event): Promise<User> => {
  const id = getRouterParam(event, 'id')
  // ...
})
```

---

## Server API

### Создание API endpoint

```typescript
// server/api/posts/index.get.ts
import type { Post, ApiResponse } from '~/shared/types'

export default defineEventHandler(async (event): Promise<ApiResponse<Post[]>> => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const perPage = Number(query.perPage) || 10

  // Fetch from database or external API
  const posts = await $fetch('http://laravel-api.local/api/posts', {
    query: { page, perPage }
  })

  return {
    data: posts.data,
    meta: {
      total: posts.total,
      page,
      perPage,
    }
  }
})
```

```typescript
// server/api/posts/index.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Валидация
  if (!body.title || !body.content) {
    throw createError({
      statusCode: 400,
      message: 'Title and content are required'
    })
  }

  // Создание
  const post = await $fetch('http://laravel-api.local/api/posts', {
    method: 'POST',
    body,
    headers: {
      Authorization: `Bearer ${event.context.token}`
    }
  })

  return post
})
```

```typescript
// server/api/posts/[slug].get.ts
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  const post = await $fetch(`http://laravel-api.local/api/posts/${slug}`)

  if (!post) {
    throw createError({
      statusCode: 404,
      message: 'Post not found'
    })
  }

  return post
})
```

---

## Middleware

### Route Middleware

```typescript
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isLoggedIn } = useUser()

  if (!isLoggedIn.value && to.path !== '/login') {
    return navigateTo('/login')
  }
})
```

```typescript
// app/middleware/admin.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useUser()

  if (user.value?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Access denied'
    })
  }
})
```

### Применение к страницам

```vue
<!-- app/pages/admin/index.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin']
})
</script>
```

### Server Middleware

```typescript
// server/middleware/auth.ts
export default defineEventHandler((event) => {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (token) {
    // Verify token and set user context
    event.context.token = token
    event.context.user = verifyToken(token)
  }
})
```

---

## Plugins

### Client Plugin

```typescript
// app/plugins/toast.client.ts
import Toast from 'vue-toastification'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Toast, {
    position: 'top-right',
    timeout: 3000,
  })
})
```

### Universal Plugin

```typescript
// app/plugins/api.ts
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      const token = useCookie('token')
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        navigateTo('/login')
      }
    },
  })

  return {
    provide: {
      api,
    },
  }
})
```

### Использование

```vue
<script setup lang="ts">
const { $api } = useNuxtApp()

const { data } = await useAsyncData('posts', () =>
  $api('/posts')
)
</script>
```

---

## i18n (Локализация)

### Установка

```bash
npm install @nuxtjs/i18n
```

### Конфигурация

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'ru', file: 'ru.json', name: 'Русский' },
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'kk', file: 'kk.json', name: 'Қазақша' },
    ],
    defaultLocale: 'ru',
    lazy: true,
    langDir: 'locales/',
    strategy: 'prefix_except_default',
  },
})
```

### Файлы переводов

```json
// app/locales/ru.json
{
  "nav": {
    "home": "Главная",
    "about": "О нас",
    "news": "Новости"
  },
  "common": {
    "loading": "Загрузка...",
    "error": "Произошла ошибка",
    "save": "Сохранить"
  }
}
```

### Использование

```vue
<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
</script>

<template>
  <nav>
    <NuxtLink :to="localePath('/')">{{ t('nav.home') }}</NuxtLink>
    <NuxtLink :to="localePath('/about')">{{ t('nav.about') }}</NuxtLink>

    <!-- Переключатель языка -->
    <select v-model="locale" @change="setLocale($event.target.value)">
      <option v-for="loc in locales" :key="loc.code" :value="loc.code">
        {{ loc.name }}
      </option>
    </select>
  </nav>
</template>
```

---

## SEO и Meta

### useSeoMeta

```vue
<script setup lang="ts">
useSeoMeta({
  title: 'Главная страница',
  description: 'Описание сайта для поисковиков',
  ogTitle: 'Заголовок для соцсетей',
  ogDescription: 'Описание для соцсетей',
  ogImage: '/og-image.jpg',
  twitterCard: 'summary_large_image',
})
</script>
```

### Динамические мета-теги

```vue
<script setup lang="ts">
const { data: post } = await useFetch(`/api/posts/${route.params.slug}`)

useSeoMeta({
  title: () => post.value?.title,
  description: () => post.value?.excerpt,
  ogImage: () => post.value?.image,
})
</script>
```

---

## TypeScript в Nuxt 4

### Раздельные tsconfig

Nuxt 4 создаёт отдельные TypeScript проекты:

```
.nuxt/
├── tsconfig.app.json     # Для app/
├── tsconfig.server.json  # Для server/
├── tsconfig.shared.json  # Для shared/
└── tsconfig.json         # Общий
```

### Строгая типизация

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  typescript: {
    strict: true,
    typeCheck: true,
  },
})
```

### Типизация API ответов

```typescript
// app/composables/usePosts.ts
import type { Post, ApiResponse } from '~/shared/types'

export function usePosts() {
  return useFetch<ApiResponse<Post[]>>('/api/posts')
}

export function usePost(slug: string) {
  return useFetch<Post>(`/api/posts/${slug}`)
}
```

---

## Чек-лист миграции на Nuxt 4

- [ ] Обновил Nuxt: `npx nuxt upgrade --dedupe`
- [ ] Запустил миграцию: `npx codemod@latest nuxt/4/migration-recipe`
- [ ] Переместил файлы в `app/` директорию
- [ ] Создал `shared/` для общих типов
- [ ] Обновил импорты
- [ ] Проверил data fetching (shallowRef!)
- [ ] Проверил KeepAlive компоненты
- [ ] Обновил TypeScript конфиги
- [ ] Протестировал все страницы
- [ ] Проверил SEO мета-теги

---

**Следующая глава:** [Tailwind CSS 4 →](../09-Tailwind4/README.md)
