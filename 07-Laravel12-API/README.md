# Глава 7: Laravel 12 — Создание API

## Что нового в Laravel 12

Laravel 12 выпущен **24 февраля 2025** года. Это "maintenance release" с минимальными breaking changes.

### Требования

| Требование | Версия |
|------------|--------|
| PHP | 8.2 - 8.5 |
| Bug fixes | до 13 августа 2026 |
| Security fixes | до 24 февраля 2027 |

### Ключевые изменения

- Новые Starter Kits (React, Vue, Livewire)
- Поддержка Inertia 2, TypeScript, shadcn/ui
- WorkOS AuthKit интеграция (SSO, passkeys)
- Laravel Breeze и Jetstream больше не обновляются

---

## Установка Laravel 12

```bash
# Создание нового проекта
composer create-project laravel/laravel my-api

# Переход в директорию
cd my-api
```

### Настройка .env

```env
APP_NAME=MyAPI
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=my_api
DB_USERNAME=root
DB_PASSWORD=
```

---

## Установка API маршрутизации

В Laravel 12 API маршруты устанавливаются отдельной командой:

```bash
php artisan install:api
```

Эта команда:
- Устанавливает **Laravel Sanctum** для аутентификации
- Создаёт файл `routes/api.php`
- Автоматически добавляет префикс `/api` ко всем маршрутам
- Настраивает `api` middleware group (stateless)

---

## Структура API маршрутов

### routes/api.php

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PostController;

// Защищённый маршрут (требует токен)
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Группа маршрутов с контроллером
Route::controller(UserController::class)->group(function () {
    Route::get('/users', 'index');
    Route::get('/users/{user}', 'show');
    Route::post('/users', 'store');
    Route::put('/users/{user}', 'update');
    Route::delete('/users/{user}', 'destroy');
});

// Ресурсные маршруты
Route::apiResource('posts', PostController::class);

// Группа с префиксом и middleware
Route::prefix('admin')->middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
    Route::get('/stats', [AdminController::class, 'stats']);
    Route::get('/users', [AdminController::class, 'users']);
});
```

### Изменение API префикса

В `bootstrap/app.php`:

```php
->withRouting(
    api: __DIR__.'/../routes/api.php',
    apiPrefix: 'api/v1',  // Меняем с 'api' на 'api/v1'
)
```

---

## Создание моделей и миграций

### Создание модели с миграцией

```bash
php artisan make:model Post -m
```

### Миграция

```php
<?php
// database/migrations/xxxx_create_posts_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('content');
            $table->string('image')->nullable();
            $table->boolean('published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
```

### Модель

```php
<?php
// app/Models/Post.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'content',
        'image',
        'published',
    ];

    protected $casts = [
        'published' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

```bash
php artisan migrate
```

---

## API Resources (Laravel 12)

### Создание ресурса

```bash
php artisan make:resource PostResource
php artisan make:resource PostCollection
```

### PostResource.php

```php
<?php
// app/Http/Resources/PostResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->content,
            'image' => $this->image ? url($this->image) : null,
            'published' => $this->published,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),

            // Условная загрузка отношения
            'author' => new UserResource($this->whenLoaded('user')),

            // Условный атрибут (только для админов)
            'admin_notes' => $this->when(
                $request->user()?->isAdmin(),
                $this->admin_notes
            ),

            // Количество связей
            'comments_count' => $this->whenCounted('comments'),
        ];
    }
}
```

### PostCollection.php

```php
<?php
// app/Http/Resources/PostCollection.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class PostCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total' => $this->collection->count(),
            ],
        ];
    }

    // Добавление мета-данных
    public function with(Request $request): array
    {
        return [
            'api_version' => '1.0',
            'api_author' => 'MyApp',
        ];
    }
}
```

### Новые методы в Laravel 12

```php
// Быстрое преобразование модели в ресурс
return User::findOrFail($id)->toResource();

// Быстрое преобразование коллекции
return User::all()->toResourceCollection();

// С пагинацией
return User::paginate()->toResourceCollection();
```

---

## API Controller

### Создание контроллера

```bash
php artisan make:controller Api/PostController --api
```

### PostController.php

```php
<?php
// app/Http/Controllers/Api/PostController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Http\Resources\PostCollection;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PostController extends Controller
{
    /**
     * Список постов с пагинацией
     */
    public function index(Request $request): PostCollection
    {
        $posts = Post::query()
            ->with('user')
            ->withCount('comments')
            ->when($request->search, function ($query, $search) {
                $query->where('title', 'like', "%{$search}%");
            })
            ->when($request->published, function ($query) {
                $query->where('published', true);
            })
            ->latest()
            ->paginate($request->per_page ?? 15);

        return new PostCollection($posts);
    }

    /**
     * Создание поста
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image' => 'nullable|image|max:2048',
            'published' => 'boolean',
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['slug'] = str($validated['title'])->slug();

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')
                ->store('posts', 'public');
        }

        $post = Post::create($validated);

        return response()->json([
            'message' => 'Post created successfully',
            'data' => new PostResource($post),
        ], 201);
    }

    /**
     * Просмотр поста
     */
    public function show(Post $post): PostResource
    {
        return new PostResource($post->load('user'));
    }

    /**
     * Обновление поста
     */
    public function update(Request $request, Post $post): JsonResponse
    {
        // Проверка авторизации
        $this->authorize('update', $post);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'image' => 'nullable|image|max:2048',
            'published' => 'boolean',
        ]);

        if (isset($validated['title'])) {
            $validated['slug'] = str($validated['title'])->slug();
        }

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')
                ->store('posts', 'public');
        }

        $post->update($validated);

        return response()->json([
            'message' => 'Post updated successfully',
            'data' => new PostResource($post),
        ]);
    }

    /**
     * Удаление поста
     */
    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);

        $post->delete();

        return response()->json([
            'message' => 'Post deleted successfully',
        ]);
    }
}
```

---

## Laravel Sanctum — Аутентификация

### Настройка модели User

```php
<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
```

### AuthController.php

```php
<?php
// app/Http/Controllers/Api/AuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Регистрация
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Авторизация
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Удаляем старые токены (опционально)
        // $user->tokens()->delete();

        $token = $user->createToken(
            'auth-token',
            ['*'],                    // abilities
            now()->addDays(7)        // срок действия
        )->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Выход (удаление токена)
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Выход со всех устройств
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logged out from all devices',
        ]);
    }

    /**
     * Текущий пользователь
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
```

### Маршруты аутентификации

```php
<?php
// routes/api.php

use App\Http\Controllers\Api\AuthController;

// Публичные маршруты
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Защищённые маршруты
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
});
```

---

## Token Abilities (Права доступа)

### Создание токена с правами

```php
// Токен только для чтения
$token = $user->createToken('read-only', ['read'])->plainTextToken;

// Токен с полным доступом
$token = $user->createToken('full-access', ['create', 'read', 'update', 'delete'])->plainTextToken;

// Админский токен
$token = $user->createToken('admin', ['*'])->plainTextToken;
```

### Проверка прав в контроллере

```php
public function update(Request $request, Post $post)
{
    if ($request->user()->tokenCan('update')) {
        // Разрешено обновление
    }

    if ($request->user()->tokenCant('delete')) {
        // Удаление запрещено
    }
}
```

### Middleware для проверки прав

В `bootstrap/app.php`:

```php
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;

->withMiddleware(function (Middleware $middleware): void {
    $middleware->alias([
        'abilities' => CheckAbilities::class,
        'ability' => CheckForAnyAbility::class,
    ]);
})
```

Использование:

```php
// Требуются ВСЕ указанные права
Route::put('/posts/{post}', [PostController::class, 'update'])
    ->middleware(['auth:sanctum', 'abilities:update,publish']);

// Требуется ХОТЯ БЫ ОДНО право
Route::get('/posts', [PostController::class, 'index'])
    ->middleware(['auth:sanctum', 'ability:read,admin']);
```

---

## Rate Limiting (Ограничение запросов)

### Настройка лимитов

В `app/Providers/AppServiceProvider.php`:

```php
<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Стандартный лимит API
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Лимит для аутентификации
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // VIP пользователи без лимита
        RateLimiter::for('uploads', function (Request $request) {
            return $request->user()?->isPremium()
                ? Limit::none()
                : Limit::perHour(10)->by($request->user()->id);
        });

        // Множественные лимиты
        RateLimiter::for('api-strict', function (Request $request) {
            return [
                Limit::perMinute(60)->by($request->user()?->id),
                Limit::perDay(1000)->by($request->user()?->id),
            ];
        });
    }
}
```

### Применение лимитов к маршрутам

```php
Route::middleware(['throttle:api'])->group(function () {
    Route::apiResource('posts', PostController::class);
});

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:auth');
```

---

## Обработка ошибок API

### Handler.php (Laravel 12)

В `bootstrap/app.php`:

```php
->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
        return $request->is('api/*') || $request->expectsJson();
    });

    $exceptions->render(function (NotFoundHttpException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found',
            ], 404);
        }
    });

    $exceptions->render(function (ValidationException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    });

    $exceptions->render(function (AuthenticationException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }
    });
})
```

---

## CORS настройка

```bash
php artisan config:publish cors
```

```php
<?php
// config/cors.php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',      // Nuxt dev
        'https://your-frontend.com',  // Production
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
```

---

## Тестирование API

### Пример теста

```php
<?php
// tests/Feature/Api/PostTest.php

namespace Tests\Feature\Api;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_posts_list(): void
    {
        Post::factory()->count(5)->create();

        $response = $this->getJson('/api/posts');

        $response->assertOk()
            ->assertJsonCount(5, 'data');
    }

    public function test_authenticated_user_can_create_post(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/posts', [
            'title' => 'Test Post',
            'content' => 'Test content',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Test Post');

        $this->assertDatabaseHas('posts', [
            'title' => 'Test Post',
        ]);
    }

    public function test_guest_cannot_create_post(): void
    {
        $response = $this->postJson('/api/posts', [
            'title' => 'Test Post',
            'content' => 'Test content',
        ]);

        $response->assertUnauthorized();
    }

    public function test_user_can_only_update_own_post(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/posts/{$post->id}", [
            'title' => 'Updated Title',
        ]);

        $response->assertOk();
    }
}
```

### Запуск тестов

```bash
php artisan test --filter=PostTest
```

---

## Проверка API

```bash
# Регистрация
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password","password_confirmation":"password"}'

# Авторизация
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Получение постов (с токеном)
curl http://localhost:8000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN"

# Создание поста
curl -X POST http://localhost:8000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Post","content":"Content here"}'
```

---

## Чек-лист главы

- [ ] Установил Laravel 12
- [ ] Выполнил `php artisan install:api`
- [ ] Создал модели и миграции
- [ ] Создал API Resources
- [ ] Написал API контроллеры
- [ ] Настроил Sanctum аутентификацию
- [ ] Добавил Token Abilities
- [ ] Настроил Rate Limiting
- [ ] Настроил CORS
- [ ] Написал тесты

---

**Следующая глава:** [На главную](../README.md)
