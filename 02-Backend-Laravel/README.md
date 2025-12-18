# Глава 2: Backend — Laravel

## Создание проекта

```bash
composer create-project laravel/laravel app-backend "8.*"
cd app-backend
```

### Зависимости (composer.json)

```json
{
    "require": {
        "php": "^7.3|^8.0",
        "laravel/framework": "^8.12",
        "laravel/tinker": "^2.5",
        "laravel/ui": "^3.2",
        "intervention/image": "^2.5",
        "jeroennoten/laravel-adminlte": "^3.5",
        "fruitcake/laravel-cors": "^2.0",
        "guzzlehttp/guzzle": "^7.0.1"
    }
}
```

```bash
composer install
```

---

## Настройка .env

```env
APP_NAME=MyApp
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=myapp
DB_USERNAME=root
DB_PASSWORD=
```

---

## Миграции

### Таблица переводов (translates)

Центральная таблица для мультиязычности:

```php
<?php
// database/migrations/2024_03_11_085138_create_translates_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTranslatesTable extends Migration
{
    public function up()
    {
        Schema::create('translates', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->text('ru')->nullable();
            $table->text('kz')->nullable();
            $table->text('en')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('translates');
    }
}
```

### Таблица новостей (news)

```php
<?php
// database/migrations/2024_03_26_052941_create_news_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNewsTable extends Migration
{
    public function up()
    {
        Schema::create('news', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('name');              // FK → translates.id
            $table->string('background_image');
            $table->date('date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('news');
    }
}
```

### Таблица контактов (contacts)

```php
<?php
// database/migrations/2024_03_25_090654_create_contacts_table.php

Schema::create('contacts', function (Blueprint $table) {
    $table->id();
    $table->timestamps();
    $table->string('tab_name')->nullable();        // FK → translates.id
    $table->string('address');
    $table->string('admissions_committee_num_1');
    $table->string('admissions_committee_num_2');
    $table->string('admissions_committee_mail');
    $table->string('rectors_reception_num');
    $table->string('office_receptionist_num');
    $table->string('tiktok_name');
    $table->text('tiktok_link');
    $table->string('instagram_name');
    $table->text('instagram_link');
    $table->text('facebook_link');
    $table->text('youtube_link');
});
```

```bash
php artisan migrate
```

---

## Модели

### Translate.php

```php
<?php
// app/Models/Translate.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Translate extends Model
{
    protected $table = 'translates';
    protected $primaryKey = 'id';
    protected $fillable = ['ru', 'en', 'kz'];
}
```

### News.php

```php
<?php
// app/Models/News.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    use HasFactory;

    protected $table = 'news';
    protected $primaryKey = 'id';
    protected $fillable = ['name', 'background_image', 'date'];

    // Связь с переводом названия
    public function getName()
    {
        return $this->hasOne(Translate::class, 'id', 'name');
    }

    // Связь с контентом новости
    public function getChild()
    {
        return $this->hasMany(NewsContent::class, 'parent_id', 'id');
    }

    // Связь с документами
    public function getDocuments()
    {
        return $this->hasOne(NewsDocument::class, 'parent_id', 'id');
    }

    // Связь со слайдером
    public function getSlider()
    {
        return $this->hasOne(NewsPageSlider::class, 'news_id', 'id');
    }
}
```

### BachelorSchool.php

```php
<?php
// app/Models/BachelorSchool.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BachelorSchool extends Model
{
    use HasFactory;

    protected $table = 'bachelor_schools';
    protected $primaryKey = 'id';
    protected $fillable = ['name', 'image'];

    public function getName()
    {
        return $this->hasOne(Translate::class, 'id', 'name');
    }

    public function getSpecialties()
    {
        return $this->hasMany(BachelorSchoolSpecialty::class, 'school_id', 'id');
    }

    public function getEducators()
    {
        return $this->hasMany(BachelorSchoolEducator::class, 'school_id', 'id');
    }

    public function getPage()
    {
        return $this->hasMany(BachelorSchoolPage::class, 'school_id', 'id');
    }
}
```

### Contact.php

```php
<?php
// app/Models/Contact.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    use HasFactory;

    protected $table = 'contacts';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id',
        'timestable',
        'tab_name',
        'address',
        'admissions_committee_num_1',
        'admissions_committee_num_2',
        'admissions_committee_mail',
        'rectors_reception_num',
        'office_receptionist_num',
        'tiktok_name',
        'tiktok_link',
        'instagram_name',
        'instagram_link',
        'facebook_link',
        'youtube_link'
    ];

    public function getTabName()
    {
        return $this->hasOne(Translate::class, 'id', 'tab_name');
    }
}
```

---

## Базовый контроллер

```php
<?php
// app/Http/Controllers/Controller.php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\Storage;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    // Стандартный JSON ответ
    protected static function response($status, $data, $message = null)
    {
        return response()->json([
            'success' => boolval($status == 200 || $status == 201 || $status == 202),
            'status'  => $status,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    // Загрузка изображений
    protected function uploadImage($image)
    {
        $path = Storage::disk('public')->put('images', $image);
        $name = basename($path);
        return 'storage/images/' . $name;
    }

    // Загрузка документов
    protected function uploadDocument($doc)
    {
        $fileName = 'profile-'.time().'.'.$doc->getClientOriginalExtension();
        $path = $doc->storeAs('public/files', $fileName);
        return 'storage/files/' . $fileName;
    }
}
```

---

## API Controller (ключевые методы)

```php
<?php
// app/Http/Controllers/ApiController.php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\HeaderNavBar;
use App\Models\Contact;
use App\Models\News;
use App\Models\MainPage;
use App\Models\BachelorSchool;
// ... другие импорты

use App\Http\Resources\NewsResource;
use App\Http\Resources\ContactResource;
use App\Http\Resources\MainPageResource;
use App\Http\Resources\BachelorSchoolResource;
// ... другие ресурсы

use Illuminate\Http\Request;
use stdClass;

class ApiController extends Controller
{
    /**
     * Навигация шапки
     */
    public function headerNavBar()
    {
        $headerNavBarData = HeaderNavBar::query()->with('getName')->get();
        return HeaderNavBarResource::collection($headerNavBarData);
    }

    /**
     * Контакты
     */
    public function contacts()
    {
        $contactsData = Contact::query()->with('getTabName')->get();
        return ContactResource::collection($contactsData)[0];
    }

    /**
     * Новости с фильтрацией
     */
    public function news(Request $request)
    {
        $correctNews = [];
        $news = News::query()->with(['getName', 'getChild'])->get();

        $year = $request->input('year');
        $month = $request->input('month');
        $day = $request->input('day');
        $sort = $request->input('sort');

        $requestDate = [$year, $month, $day];

        foreach ($news as $item) {
            $correctCount = 0;
            $dateArr = explode('-', $item->date);

            foreach ($requestDate as $key => $value) {
                if ($value) {
                    if ($dateArr[$key] == $value) {
                        $correctCount += 1;
                    }
                } else {
                    $correctCount += 1;
                }
            }

            if ($correctCount == 3) {
                $correctNews[] = $item;
            }
        }

        $sortedCorrectNews = $this->sorted($correctNews, $sort);
        return NewsResource::collection($sortedCorrectNews);
    }

    /**
     * Сортировка новостей
     */
    private function sorted($data, $type)
    {
        if ($type == 'old') {
            usort($data, [$this, 'sortByDateOldToNew']);
        } else {
            usort($data, [$this, 'sortByDateNewToOld']);
        }
        return $data;
    }

    private function sortByDateOldToNew($a, $b)
    {
        return strtotime($a->date) - strtotime($b->date);
    }

    private function sortByDateNewToOld($a, $b)
    {
        return strtotime($b->date) - strtotime($a->date);
    }

    /**
     * Главная страница
     */
    public function mainPage()
    {
        $mainPageData = MainPage::query()->with(['getTitle', 'getContent'])->get();
        $schools = BachelorSchool::query()->with(['getName'])->get();

        // Формирование структуры ответа
        foreach ($mainPageData as $key => $value) {
            switch($key) {
                case 0:
                    $banner = new MainPageResource($value);
                    break;
                case 1:
                    $educationProgram['title'] = new MainPageResource($value);
                    break;
                // ... остальные case
            }
        }

        $mainPageApi = new stdClass;
        $mainPageApi->banner = $banner;
        $mainPageApi->educationProgram = $educationProgram;
        $mainPageApi->professionalSchools = $professionalSchools;
        // ... остальные поля

        return $mainPageApi;
    }

    /**
     * О нас
     */
    public function aboutUs()
    {
        $aboutUs = AboutUsPage::query()->with(['getTitle', 'getContent'])->get();
        $metaData = AboutUniversityPagesMeta::where('page_id', 1)->first();

        foreach ($aboutUs as $key => $value) {
            switch($key) {
                case 0:
                    $banner = new AboutUsPageResource($value);
                    break;
                case 1:
                    $history = new AboutUsPageResource($value);
                    break;
                // ...
            }
        }

        $aboutUsApi = new stdClass;
        $aboutUsApi->banner = $banner;
        $aboutUsApi->history = $history;
        $aboutUsApi->historyYears = $historyYears;
        $aboutUsApi->blocks = $blocks;
        $aboutUsApi->meta = $metaData ? new MetaDataResource($metaData) : null;

        return $aboutUsApi;
    }

    /**
     * Факультеты
     */
    public function bachelorSchool()
    {
        $bachelorSchool = BachelorSchool::query()
            ->with(['getName', 'getSpecialties', 'getEducators', 'getPage'])
            ->get();

        return BachelorSchoolResource::collection($bachelorSchool);
    }

    /**
     * Футер навигация
     */
    public function footerNavBar(Request $request)
    {
        $lang = in_array($request->lang, ['ru', 'en', 'kz']) ? $request->lang : 'ru';
        $contactsData = $this->contacts();
        $address = explode(', ', $contactsData->address)[2];

        $contacts = [
            'id' => 6,
            'name' => $contactsData->getTabName->{$lang},
            'child' => [
                'address' => $address,
                'email' => $contactsData->admissions_committee_mail,
                'phone' => $contactsData->admissions_committee_num_2,
                'facebook' => $contactsData->facebook_link,
                'instagram' => $contactsData->instagram_link,
                'youtube' => $contactsData->youtube_link
            ]
        ];

        $navBar = $this->headerNavBar();

        $footerNavBar = new stdClass;
        $footerNavBar->navbar = $navBar;
        $footerNavBar->contacts = $contacts;

        return $footerNavBar;
    }
}
```

---

## API Resources

### NewsResource.php

```php
<?php
// app/Http/Resources/NewsResource.php

namespace App\Http\Resources;

use App\Models\NewsDocument;
use App\Models\NewsMeta;
use Illuminate\Http\Resources\Json\JsonResource;
use stdClass;

class NewsResource extends JsonResource
{
    public function toArray($request)
    {
        $lang = in_array($request->lang, ['ru', 'en', 'kz']) ? $request->lang : 'ru';

        // Слайдер
        $slider = $this->getSlider ? $this->getSlider : null;
        if (isset($slider->images)) {
            foreach(json_decode($slider->images) as $item) {
                $sliderImages[] = url($item);
            }
        }

        // Документы
        $documents = NewsDocument::query()->where('parent_id', $this->id)->get();

        // Контент
        $blocks = PageResource::collection($this->getChild);
        $content = new stdClass;
        $content->title = $this->getName ? $this->getName->{$lang} : '';
        $content->date = $this->date;
        $content->slider = isset($sliderImages) ? $sliderImages : null;
        $content->blocks = $blocks;
        $content->document = DocumentResource::collection($documents);

        return [
            'id' => $this->id,
            'name' => $this->getName ? $this->getName->{$lang} : '',
            'date' => $this->date,
            'image' => $this->background_image ? url($this->background_image) : '',
            'meta' => NewsMeta::where('page_id', $this->id)->first(),
            'child' => $this->getChild ? $content : [],
        ];
    }
}
```

---

## API Routes

```php
<?php
// routes/api.php

use App\Http\Controllers\ApiController;
use Illuminate\Support\Facades\Route;

// Навигация
Route::get('/headerNavBar', [ApiController::class, 'headerNavBar']);
Route::get('/footerNavBar', [ApiController::class, 'footerNavBar']);

// Контакты
Route::get('/contacts', [ApiController::class, 'contacts']);

// Новости
Route::get('/newsPage', [ApiController::class, 'newsPage']);
Route::get('/news', [ApiController::class, 'news']);

// Главная
Route::get('/mainPage', [ApiController::class, 'mainPage']);

// О нас
Route::get('/aboutUs', [ApiController::class, 'aboutUs']);
Route::get('/authority', [ApiController::class, 'authority']);
Route::get('/accreditation', [ApiController::class, 'accreditation']);
Route::get('/partnersPage', [ApiController::class, 'partnersPage']);
Route::get('/careerPage', [ApiController::class, 'careerPage']);
Route::get('/rectorsBlogPage', [ApiController::class, 'rectorsBlogPage']);
Route::get('/academicCouncilPage', [ApiController::class, 'academicCouncilPage']);

// Наука
Route::get('/scienceInnovationPage', [ApiController::class, 'scienceInnovationPage']);
Route::get('/studentScience', [ApiController::class, 'studentScience']);
Route::get('/scientificPublicationPage', [ApiController::class, 'scientificPublicationPage']);

// Поступление
Route::get('/admissionsCommitteePage', [ApiController::class, 'admissionsCommitteePage']);
Route::get('/masterPage', [ApiController::class, 'masterPage']);
Route::get('/internationalStudentsPage', [ApiController::class, 'internationalStudentsPage']);

// Студентам
Route::get('/academicPolicyPage', [ApiController::class, 'academicPolicyPage']);
Route::get('/libraryPage', [ApiController::class, 'libraryPage']);
Route::get('/studentClubPage', [ApiController::class, 'studentClubPage']);
Route::get('/studentHousePage', [ApiController::class, 'studentHousePage']);

// Школы
Route::get('/bachelorSchool', [ApiController::class, 'bachelorSchool']);

// SEO
Route::get('/metaData', [ApiController::class, 'metaData']);

// Инфраструктура
Route::get('/infrastructurePage', [ApiController::class, 'infrastructurePage']);

// Летняя школа
Route::get('/summerSchoolPage', [ApiController::class, 'summerSchoolPage']);
```

---

## CORS Configuration

```php
<?php
// config/cors.php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'],  // На production указать конкретный домен
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

---

## Запуск

```bash
# Генерация ключа
php artisan key:generate

# Миграции
php artisan migrate

# Линк storage
php artisan storage:link

# Запуск сервера
php artisan serve
# API доступно на http://localhost:8000/api
```

---

## Проверка API

```bash
# Главная страница
curl http://localhost:8000/api/mainPage

# Новости
curl http://localhost:8000/api/news

# Новости 2024 года
curl "http://localhost:8000/api/news?year=2024"

# Контакты
curl http://localhost:8000/api/contacts
```

---

## Чек-лист главы

- [ ] Создал проект Laravel
- [ ] Настроил .env
- [ ] Создал миграции (translates, news, contacts)
- [ ] Создал модели с relationships
- [ ] Написал ApiController
- [ ] Создал API Resources
- [ ] Настроил routes/api.php
- [ ] Настроил CORS
- [ ] Проверил API через curl

---

**Следующая глава:** [Frontend Nuxt →](../03-Frontend-Nuxt/README.md)
