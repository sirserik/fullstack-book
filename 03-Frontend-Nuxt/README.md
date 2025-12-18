# Глава 3: Frontend — Nuxt 3

## Создание проекта

```bash
npx nuxi@latest init app-frontend
cd app-frontend
```

### Зависимости (package.json)

```json
{
  "name": "app-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "nuxt start --port 3008",
    "build": "nuxt build",
    "dev": "nuxt dev --host",
    "generate": "nuxt generate",
    "preview": "nuxt preview"
  },
  "dependencies": {
    "@formkit/auto-animate": "^0.8.1",
    "@nuxtjs/i18n": "^8.3.1",
    "@nuxtjs/seo": "^2.0.0-rc.11",
    "@pinia/nuxt": "^0.5.1",
    "@vueuse/core": "^10.9.0",
    "@vueuse/motion": "^2.1.0",
    "axios": "^1.6.8",
    "maska": "^2.1.11",
    "nuxt": "^3.10.3",
    "nuxt-swiper": "^1.2.2",
    "pinia": "^2.1.7",
    "vue": "^3.4.19",
    "vue-awesome-paginate": "^1.1.46"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwind-scrollbar": "^3.1.0",
    "tailwindcss": "^3.4.1"
  }
}
```

```bash
npm install
```

---

## nuxt.config.ts

```typescript
// nuxt.config.ts

export default defineNuxtConfig({
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Fullstack Demo',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: [
    '@vueuse/motion/nuxt',
    'nuxt-swiper',
    '@formkit/auto-animate',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
    '@pinia/nuxt',
  ],

  i18n: {
    vueI18n: './i18n.config.ts',
    lazy: true,
    langDir: 'locales',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'kz', name: 'KZ', file: 'kz.json' },
      { code: 'en', name: 'EN', file: 'en.json' },
      { code: 'ru', name: 'RU', file: 'ru.json' }
    ],
    defaultLocale: 'ru',
  },

  plugins: [
    { src: '~/plugins/vue-content-loader.js', mode: 'client' }
  ],
});
```

---

## tailwind.config.js

```javascript
// tailwind.config.js

module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        violet: '#4E4481',
        white: '#fff',
        green: '#AAA0FC',
        grey: '#F1F1F1',
      },
      screens: {
        xs: '450px',
        ms: '500px',
        sm: '640px',
        md: '768px',
        lg: '992px',
        lg2: '1150px',
        '2lg': '1040px',
        xl: '1280px',
        '2xl': '1470px',
      },
      borderRadius: {
        15: '15px',
      },
      lineHeight: {
        140: '140%',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar')({ preferredStrategy: 'pseudoelements' }),
  ],
}
```

---

## Локализация (i18n)

### i18n.config.ts

```typescript
// i18n.config.ts

export default defineI18nConfig(() => ({
  fallbackLocale: 'ru'
}))
```

### locales/ru.json

```json
{
  "welcome": "Новости",
  "contacts": "Контакты",
  "btnNewsText": "Вернуться к новостям",
  "formTitle": "Оставь заявку",
  "contactsTextAdress": "Адрес:",
  "contactsTextSelectionCommittee": "Приемная комиссия:",
  "contactsTextRectorsReception": "Приемная ректора:",
  "contactsTextOffice": "Офис регистратор:",
  "contactAdressInfo": "г. Москва, ул. Примерная, д. 1",
  "contactPhoneText": "Телефон:",
  "faqTitleFirst": "Какие программы обучения предлагает университет?",
  "faqAnswer": "Учебный процесс включает лекции, практические занятия...",
  "professionAboutManagement": "Председатель Правления-Ректор",
  "bachelorSchoolsTitle": "Профессиональные школы"
}
```

### locales/en.json

```json
{
  "welcome": "News",
  "contacts": "Contacts",
  "btnNewsText": "Back to news",
  "formTitle": "Leave a request",
  "contactsTextAdress": "Address:",
  "contactsTextSelectionCommittee": "Selection committee:",
  "contactsTextRectorsReception": "Rector's reception:",
  "contactsTextOffice": "Office registrar:",
  "contactAdressInfo": "Moscow, Example Street, 1",
  "contactPhoneText": "Phone:",
  "bachelorSchoolsTitle": "Vocational schools"
}
```

### locales/kz.json

```json
{
  "welcome": "Жаналык",
  "contacts": "Контактілер",
  "btnNewsText": "Жаңалықтарға оралу",
  "formTitle": "Өтініш қалдырыңыз",
  "contactsTextAdress": "Мекенжай:",
  "contactsTextSelectionCommittee": "Қабылдау комиссиясы:",
  "contactsTextRectorsReception": "Ректордың қабылдауы:",
  "bachelorSchoolsTitle": "Кәсіптік оқу орындары"
}
```

---

## Stores (Pinia)

### stores/lang.ts

```typescript
// stores/lang.ts

export const useLangStore = defineStore('lang', () => {
  const activeLang = ref<any>({
    id: 1,
    name: 'RU',
    value: 'RU'
  })

  return { activeLang }
})
```

### stores/seo.ts

```typescript
// stores/seo.ts

export const useSeoStore = defineStore('seo', () => {
  const { data: seoData, error: seoDataError } = useFetch<SeoProps>(
    `https://api.example.com/api/metaData`
  )

  if (seoDataError.value) {
    console.error('Ошибка при загрузке данных:', seoDataError.value.message)
  }

  return { seoData, seoDataError }
})
```

---

## Layout

### layouts/default.vue

```vue
<script setup lang="ts">
const { locale } = useI18n()

const headerNavBarData = ref<any>(null)
const headerNavBarError = ref<any>(null)
const footerNavBarData = ref<any>(null)
const footerNavBarError = ref<any>(null)
const footerNavBarLoader = ref<boolean>(false)

const fetchData = async () => {
  const { data, error } = await useFetch<{
    data: any
  }>(`https://api.example.com/api/headerNavBar?lang=${locale.value}`)

  headerNavBarData.value = data.value?.data
  headerNavBarError.value = error
}

const fetchFooterData = async () => {
  const { data, error } = await useFetch<{
    data: any
  }>(`https://api.example.com/api/footerNavBar?lang=${locale.value}`)

  footerNavBarData.value = data.value
  footerNavBarError.value = error
}

await fetchData()
await fetchFooterData()

// Следим за изменением языка
watch(locale, async () => {
  await fetchData()
  await fetchFooterData()
})
</script>

<template>
  <main>
    <MainHeader :headerNavBarData="headerNavBarData" />
    <div>
      <slot />
    </div>
    <MainFooter
      :footerNavBarLoader="footerNavBarLoader"
      :footerNavBarData="footerNavBarData"
    />
  </main>
</template>
```

---

## Страницы

### pages/index.vue (Главная)

```vue
<script setup lang="ts">
import { ibg } from '~/utils/lib/ibg'
const { locale } = useI18n()

// Загрузка данных главной страницы
const { data: mainPageData, error: mainPageError } = useFetch<MainPageData>(
  `https://api.example.com/api/mainPage?lang=${locale.value}`
)

if (mainPageError.value) {
  console.error('Ошибка при загрузке данных:', mainPageError.value.message)
}

// Контакты
const { data: contactsData, error: contactsError } = useFetch<ContactResponse>(
  `https://api.example.com/api/contacts?lang=${locale.value}`
)

// Новости
const { data: newsData, error: newsDataError } = useFetch<NewsDataResponse>(
  `https://api.example.com/api/news?lang=${locale.value}`
)

onMounted(() => {
  ibg()
})
</script>

<template>
  <div v-if="mainPageData">
    <!-- Баннер -->
    <MainBg :banner="mainPageData.banner" />

    <!-- Программы обучения -->
    <MainTraning
      :title="mainPageData.educationProgram.title.title"
      :items="mainPageData.educationProgram.items"
    />

    <!-- Школы -->
    <MainSchools
      :title="mainPageData.professionalSchools.title.title"
      :item="mainPageData.professionalSchools.item"
    />

    <!-- Преимущества -->
    <MainAdvantages
      :title="mainPageData.advantages.title.title"
      :items="mainPageData.advantages.items"
    />

    <!-- Цифры -->
    <MainNumbers
      :title="mainPageData.inNumbers.title.title"
      :items="mainPageData.inNumbers.items"
    />

    <!-- Новости -->
    <MainNews
      v-if="newsData"
      :title="mainPageData.news.title"
      :newsData="newsData"
    />

    <!-- Соцсети -->
    <MainSocials
      :instagram="mainPageData.instagram"
      :youtube="mainPageData.youtube"
    />

    <!-- Форма заявки -->
    <MainForm
      :btnText="mainPageData.application.button.content"
      :image="mainPageData.application.title.image"
      :content="mainPageData.application.title.content"
      :subContent="mainPageData.application.description.content"
    />

    <!-- FAQ -->
    <MainFaq
      :faqTitle="mainPageData.faqTitle"
      :faqQuestions="mainPageData.faqQuestions"
    />

    <!-- Контакты -->
    <MainContacts v-if="contactsData" :contactsData="contactsData" />
  </div>

  <!-- Загрузка или ошибка -->
  <div v-else>
    <div
      v-if="mainPageError"
      class="xl:h-[100vh] flex flex-col items-center justify-center"
    >
      <img src="/img/error.svg" alt="" />
      <p class="font-semibold text-[24px]">Страница не найдена</p>
    </div>
    <div v-else>
      <UILoader />
    </div>
  </div>
</template>
```

### pages/news/index.vue (Список новостей)

```vue
<script setup lang="ts">
import { ibg } from '~/utils/lib/ibg'

const { locale } = useI18n()

// Фильтры
const selectedValues = reactive({
  sort: '' as string | number,
  year: null as string | number | null,
  month: null as string | number | null,
  day: null as string | number | null,
})

const newsDataFetch = ref<any>(null)
const loading = ref(false)

// Загрузка новостей с фильтрами
const fetchData = async () => {
  loading.value = true

  let apiUrl = `https://api.example.com/api/news?lang=${locale.value}`

  if (selectedValues.year) apiUrl += `&year=${selectedValues.year}`
  if (selectedValues.month) apiUrl += `&month=${selectedValues.month}`
  if (selectedValues.day) apiUrl += `&day=${selectedValues.day}`
  if (selectedValues.sort) apiUrl += `&sort=${selectedValues.sort}`

  const { data, error } = await useFetch<{ data: any }>(apiUrl)

  newsDataFetch.value = data.value?.data
  loading.value = false
}

fetchData()

// Данные для фильтров
const exampleDate = {
  data: [
    {
      title: 'Новости',
      filters: [
        {
          id: 176,
          name: 'Упорядочить',
          child: [
            { id: 1, name: 'Сначала новые', value: 'new' },
            { id: 2, name: 'Сначала старые', value: 'old' },
          ],
        },
        {
          id: 177,
          name: 'Год',
          child: [
            { id: 1, name: 2024, value: 2024 },
            { id: 2, name: 2023, value: 2023 },
            { id: 3, name: 2022, value: 2022 },
          ],
        },
        {
          id: 178,
          name: 'Месяц',
          child: [
            { id: 1, name: 'Январь', value: 1 },
            { id: 2, name: 'Февраль', value: 2 },
            // ... остальные месяцы
            { id: 12, name: 'Декабрь', value: 12 },
          ],
        },
      ],
    },
  ],
}

// Обработка выбора фильтра
const handleChange = (type: string, value: string | number) => {
  if (type === 'год') selectedValues.year = value
  else if (type === 'месяц') selectedValues.month = value
  else if (type === 'число') selectedValues.day = value
  else if (type === 'упорядочить') selectedValues.sort = value

  fetchData()
}

// Сброс фильтров
const resetFilters = () => {
  selectedValues.sort = ''
  selectedValues.year = null
  selectedValues.month = null
  selectedValues.day = null
  fetchData()
}

// Отслеживание изменений
watch(
  () => selectedValues,
  () => fetchData(),
  { deep: true }
)

onMounted(() => {
  ibg()
})
</script>

<template>
  <div class="paddingSection">
    <div class="container">
      <h2 class="title">Новости</h2>

      <!-- Фильтры -->
      <div class="filters-container flex items-center justify-center mb-[30px]">
        <button
          class="py-[16px] px-[25px] border rounded-15 border-violet"
          @click="resetFilters"
        >
          <span class="font-semibold text-violet">Сбросить</span>
        </button>

        <UIBtnFilter
          v-for="item in exampleDate.data[0].filters"
          :key="item.id"
        >
          {{ item.name }}
          <ul class="dropdown">
            <li
              v-for="elem in item.child"
              :key="elem.id"
              @click="handleChange(item.name.toLowerCase(), elem.value)"
            >
              {{ elem.name }}
            </li>
          </ul>
        </UIBtnFilter>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="flex w-full items-center justify-center py-[50px]">
        <img class="loading-animation" src="/img/loading.svg" alt="" />
      </div>

      <!-- Список новостей -->
      <div
        v-else-if="newsDataFetch && newsDataFetch.length > 0"
        class="flex flex-wrap gap-[50px]"
      >
        <MainNewsItem v-for="item in newsDataFetch" :key="item.id" :item="item" />
      </div>

      <!-- Пусто -->
      <div v-else class="flex w-full items-center justify-center py-[50px]">
        <img src="/img/news-empty.svg" alt="" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-animation {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
```

---

## Утилиты

### utils/lib/ibg.ts

```typescript
// utils/lib/ibg.ts

export const ibg = () => {
  const ibgElements = document.querySelectorAll<HTMLElement>('.ibg')
  ibgElements.forEach((ibgElement) => {
    const img = ibgElement.querySelector('img')
    if (img) {
      ibgElement.style.backgroundImage = `url(${img.getAttribute('src')})`
    }
  })
}
```

### utils/lib/fadeIn.ts

```typescript
// utils/lib/fadeIn.ts

const fadeIn = (direction: string, delay: number) => {
  return {
    hidden: {
      y: direction === 'up' ? 80 : direction === 'down' ? -80 : 0,
      opacity: 0,
      x: direction === 'left' ? 80 : direction === 'right' ? -80 : 0,
    },
    show: {
      y: 0,
      x: 0,
      opacity: 1,
      transition: {
        type: 'tween',
        delay: delay,
        duration: 1.2,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
  }
}

export default fadeIn
```

---

## CSS (assets/css/main.css)

```css
/* assets/css/main.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

.container {
  @apply max-w-[1470px] mx-auto px-[15px];
}

.title {
  @apply text-[32px] md:text-[48px] font-bold text-violet mb-[30px] text-center;
}

.paddingSection {
  @apply py-[50px] md:py-[100px];
}

.ibg {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.ibg img {
  width: 0;
  height: 0;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  visibility: hidden;
}
```

---

## Запуск

```bash
# Разработка
npm run dev

# Сборка для production
npm run build

# Preview production build
npm run preview
```

---

## Чек-лист главы

- [ ] Создал проект Nuxt 3
- [ ] Настроил nuxt.config.ts
- [ ] Настроил Tailwind CSS
- [ ] Создал файлы локализации (ru, en, kz)
- [ ] Создал Pinia stores
- [ ] Создал layout (default.vue)
- [ ] Создал страницы (index, news)
- [ ] Создал утилиты (ibg, fadeIn)
- [ ] Проверил работу приложения

---

**Следующая глава:** [Интеграция →](../04-Интеграция/README.md)
