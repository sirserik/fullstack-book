# Глава 4: Интеграция Frontend и Backend

## Архитектура взаимодействия

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      СХЕМА ИНТЕГРАЦИИ                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   NUXT (Frontend)                     LARAVEL (Backend)                 │
│   ───────────────                     ─────────────────                 │
│                                                                         │
│   ┌─────────────┐     HTTP GET        ┌─────────────┐                   │
│   │ pages/      │ ──────────────────► │ routes/     │                   │
│   │ index.vue   │                     │ api.php     │                   │
│   └─────────────┘                     └──────┬──────┘                   │
│         │                                    │                          │
│         │                                    ▼                          │
│   ┌─────▼─────┐                       ┌─────────────┐                   │
│   │ useFetch  │                       │ ApiControl- │                   │
│   │ (SSR)     │                       │ ler.php     │                   │
│   └───────────┘                       └──────┬──────┘                   │
│         │                                    │                          │
│         │     ◄──── JSON Response ───────────┤                          │
│         │                                    │                          │
│   ┌─────▼─────┐                       ┌──────▼──────┐                   │
│   │ Component │                       │ Resources/  │                   │
│   │ Template  │                       │ *Resource   │                   │
│   └───────────┘                       └─────────────┘                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Настройка API URL

### На стороне Frontend

```typescript
// nuxt.config.ts

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'https://api.example.com/api'
    }
  }
})
```

### Использование в компонентах

```vue
<script setup>
const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const { data } = await useFetch(`${apiBase}/mainPage`)
</script>
```

### Переменные окружения

```env
# .env (Frontend)
API_BASE=http://localhost:8000/api

# .env.production
API_BASE=https://api.example.com/api
```

---

## Работа с useFetch

### Базовый запрос

```vue
<script setup lang="ts">
const { locale } = useI18n()

const { data, error, pending, refresh } = await useFetch(
  `https://api.example.com/api/mainPage?lang=${locale.value}`
)

// data - полученные данные
// error - ошибка (если есть)
// pending - загрузка в процессе
// refresh - функция для повторного запроса
</script>
```

### С типизацией

```vue
<script setup lang="ts">
interface MainPageData {
  banner: {
    title: string
    content: string
    image: string
  }
  educationProgram: {
    title: { title: string }
    items: Array<{ title: string; content: string; image: string }>
  }
  // ... остальные поля
}

const { data: mainPageData, error } = await useFetch<MainPageData>(
  `https://api.example.com/api/mainPage?lang=${locale.value}`
)

if (error.value) {
  console.error('Ошибка:', error.value.message)
}
</script>
```

### Динамический запрос с параметрами

```vue
<script setup lang="ts">
const { locale } = useI18n()

const selectedValues = reactive({
  year: null as number | null,
  month: null as number | null,
  sort: 'new' as string
})

const newsDataFetch = ref<any>(null)

const fetchData = async () => {
  let apiUrl = `https://api.example.com/api/news?lang=${locale.value}`

  if (selectedValues.year) apiUrl += `&year=${selectedValues.year}`
  if (selectedValues.month) apiUrl += `&month=${selectedValues.month}`
  if (selectedValues.sort) apiUrl += `&sort=${selectedValues.sort}`

  const { data } = await useFetch<{ data: any }>(apiUrl)
  newsDataFetch.value = data.value?.data
}

// Вызов при монтировании
fetchData()

// Отслеживание изменений фильтров
watch(selectedValues, () => {
  fetchData()
}, { deep: true })
</script>
```

---

## Реактивность при смене языка

### Layout с watch на locale

```vue
<script setup lang="ts">
const { locale } = useI18n()

const headerNavBarData = ref<any>(null)
const footerNavBarData = ref<any>(null)

const fetchData = async () => {
  const { data } = await useFetch(
    `https://api.example.com/api/headerNavBar?lang=${locale.value}`
  )
  headerNavBarData.value = data.value?.data
}

const fetchFooterData = async () => {
  const { data } = await useFetch(
    `https://api.example.com/api/footerNavBar?lang=${locale.value}`
  )
  footerNavBarData.value = data.value
}

// Первоначальная загрузка
await fetchData()
await fetchFooterData()

// Перезагрузка при смене языка
watch(locale, async () => {
  await fetchData()
  await fetchFooterData()
})
</script>
```

---

## CORS на Backend

```php
<?php
// config/cors.php

return [
    // Пути, для которых включен CORS
    'paths' => ['api/*'],

    // Разрешённые методы
    'allowed_methods' => ['*'],

    // Разрешённые источники
    // Development: все
    'allowed_origins' => ['*'],

    // Production: только ваш домен
    // 'allowed_origins' => ['https://example.com'],

    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

---

## Обработка ошибок

### На Frontend

```vue
<script setup lang="ts">
const { data, error, pending } = await useFetch('/api/mainPage')

// Показываем ошибку пользователю
if (error.value) {
  console.error('API Error:', error.value.message)
}
</script>

<template>
  <div v-if="pending">
    <UILoader />
  </div>

  <div v-else-if="error">
    <div class="error-page">
      <img src="/img/error.svg" alt="Error" />
      <p>Произошла ошибка при загрузке данных</p>
      <button @click="refresh()">Попробовать снова</button>
    </div>
  </div>

  <div v-else>
    <!-- Основной контент -->
  </div>
</template>
```

### На Backend

```php
<?php
// app/Http/Controllers/Controller.php

protected static function response($status, $data, $message = null)
{
    return response()->json([
        'success' => boolval($status == 200 || $status == 201 || $status == 202),
        'status'  => $status,
        'message' => $message,
        'data'    => $data,
    ], $status);
}

// Использование
public function news(Request $request)
{
    try {
        $news = News::query()->with(['getName', 'getChild'])->get();
        return NewsResource::collection($news);
    } catch (\Exception $e) {
        return self::response(500, null, 'Ошибка при получении новостей');
    }
}
```

---

## Мультиязычность: Frontend + Backend

### Запрос с параметром lang

```typescript
// Frontend
const { locale } = useI18n()

const { data } = await useFetch(
  `https://api.example.com/api/news?lang=${locale.value}`
)
```

### Обработка на Backend (Resource)

```php
<?php
// app/Http/Resources/NewsResource.php

public function toArray($request)
{
    // Получаем язык из query параметра, по умолчанию ru
    $lang = in_array($request->lang, ['ru', 'en', 'kz']) ? $request->lang : 'ru';

    return [
        'id' => $this->id,
        // Берём перевод на нужном языке
        'name' => $this->getName ? $this->getName->{$lang} : '',
        'date' => $this->date,
        'image' => $this->background_image ? url($this->background_image) : '',
    ];
}
```

---

## Структура данных API

### Пример ответа /api/mainPage

```json
{
  "banner": {
    "title": "Fullstack Demo",
    "content": "Качественное образование для вашего будущего",
    "image": "https://api.example.com/storage/images/banner.jpg"
  },
  "educationProgram": {
    "title": {
      "title": "Программы обучения"
    },
    "items": [
      {
        "title": "Бакалавриат",
        "content": "4 года обучения",
        "image": "https://api.example.com/storage/images/bachelor.jpg"
      },
      {
        "title": "Магистратура",
        "content": "2 года обучения",
        "image": "https://api.example.com/storage/images/master.jpg"
      }
    ]
  },
  "professionalSchools": {
    "title": {
      "title": "Профессиональные школы"
    },
    "item": [
      {
        "id": 1,
        "name": "Школа IT",
        "image": "https://api.example.com/storage/images/it.jpg"
      }
    ]
  }
}
```

---

## Типы TypeScript

### types/mainPage.ts

```typescript
// utils/types/mainPage.ts

export interface MainPageData {
  banner: BannerData
  educationProgram: EducationProgram
  professionalSchools: ProfessionalSchools
  advantages: Advantages
  inNumbers: InNumbers
  news: NewsSection
  instagram: SocialSection
  youtube: SocialSection
  application: ApplicationSection
  faqTitle: TitleData
  faqQuestions: FaqQuestion[]
}

export interface BannerData {
  title: string
  content: string
  image: string
}

export interface EducationProgram {
  title: TitleData
  items: EducationProgramItem[]
}

export interface EducationProgramItem {
  title: string
  content: string
  image: string
}

export interface TitleData {
  title: string
  content?: string
  image?: string
}

// ... остальные типы
```

---

## Чек-лист главы

- [ ] Понимаю архитектуру взаимодействия
- [ ] Настроил API URL через runtimeConfig
- [ ] Умею использовать useFetch
- [ ] Понимаю работу с CORS
- [ ] Умею обрабатывать ошибки
- [ ] Понимаю мультиязычность в связке

---

**Следующая глава:** [Деплой →](../05-Деплой/README.md)
