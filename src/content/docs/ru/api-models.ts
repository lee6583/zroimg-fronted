import type { DocsPageContent } from "../types";

export const apiModels: DocsPageContent = {
  navTitle: "Список моделей",
  title: "API списка моделей",
  description:
    "GET /open/v1/models возвращает модели изображений и видео: режимы, соотношения сторон, качество, разрешение, длительность, референсы, значения по умолчанию и цены.",
  body: `
## Список моделей {#list-models}
~~~http
GET /open/v1/models
~~~
Возвращает все модели, доступные для вызова. Модели, параметры и цены меняются вместе с настройками платформы, поэтому **определяйте доступные параметры в программе с помощью этого метода**, а не задавайте их жёстко.
::: example listModels
## Ответ {#response}
~~~json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-image-2",
      "object": "model",
      "name": "GPT Image 2",
      "type": "image",
      "modes": ["text_to_image", "image_to_image", "inpaint"],
      "ratios": ["1:1", "16:9", "9:16", "4:3", "3:4"],
      "qualities": ["low", "medium", "high", "auto"],
      "counts": [1, 2, 3, 4],
      "maxReferenceImages": 1,
      "defaults": { "mode": "text_to_image", "ratio": "1:1", "quality": "low", "count": 1 },
      "pricing": {
        "unit": "image",
        "items": [
          { "mode": "text_to_image", "quality": "low", "points": 10 },
          { "mode": "text_to_image", "quality": "medium", "points": 15 }
        ]
      },
      "description": "Модель генерации изображений по умолчанию"
    },
    {
      "id": "YOUR_VIDEO_MODEL_ID",
      "object": "model",
      "name": "Example Video",
      "type": "video",
      "modes": ["text_to_video", "image_to_video"],
      "ratios": ["16:9", "9:16"],
      "resolutions": ["720p"],
      "durations": [4, 6, 8],
      "maxReferenceImages": 9,
      "defaults": { "mode": "text_to_video", "ratio": "16:9", "resolution": "720p", "duration": 6 },
      "pricing": {
        "unit": "request",
        "items": [
          { "mode": "text_to_video", "resolution": "720p", "points": 40, "unit": "request" },
          { "mode": "image_to_video", "resolution": "720p", "points": 40, "unit": "request", "reference_image_points": 0 }
        ]
      }
    }
  ]
}
~~~
Цены в примере приведены только для иллюстрации формата; актуальные значения возвращает сам метод.
## Объект модели {#model-object}
| Поле | Тип | Описание |
| --- | --- | --- |
| \`id\` | string | ID модели (тот же, что на сайте); передаётся как параметр \`model\` при отправке задачи |
| \`object\` | string | Всегда \`model\` |
| \`name\` | string | Отображаемое название |
| \`type\` | string | \`image\` или \`video\` |
| \`modes\` | string[] | Поддерживаемые режимы генерации, см. таблицу ниже |
| \`ratios\` | string[] | Поддерживаемые соотношения сторон, например \`16:9\` |
| \`qualities\` | string[] | Только для моделей изображений: поддерживаемые уровни качества |
| \`counts\` | number[] | Только для моделей изображений: сколько изображений можно создать за раз |
| \`resolutions\` | string[] | Только для моделей видео: поддерживаемые разрешения |
| \`durations\` | number[] | Только для моделей видео: поддерживаемая длительность (в секундах) |
| \`maxReferenceImages\` | number | Максимальное количество референсных изображений; 0 — референсы не поддерживаются |
| \`defaults\` | object | Значения по умолчанию для параметров, не указанных при отправке |
| \`pricing\` | object | Способ тарификации и цены, см. ниже |
| \`description\` | string | Необязательное описание модели |
## Режимы генерации {#modes}
| Режим | Тип | Описание |
| --- | --- | --- |
| \`text_to_image\` | Изображение | Генерация изображения только по промпту |
| \`image_to_image\` | Изображение | Генерация на основе 1 референсного изображения |
| \`inpaint\` | Изображение | Перерисовка области: 1 исходное изображение и маска \`mask_url\` |
| \`text_to_video\` | Видео | Генерация видео только по промпту |
| \`image_to_video\` | Видео | Генерация видео на основе референсных изображений |
Уровни качества изображений \`low\`, \`medium\` и \`high\` соответствуют выходному разрешению примерно 1K, 2K и 4K; \`auto\` тарифицируется как \`medium\`.
## Поля тарификации {#pricing}
\`pricing.unit\` определяет, как считаются баллы:
- \`image\`: баллы за одно изображение × количество изображений \`n\`.
- \`second\`: баллы за секунду × длительность видео \`duration\`.
- \`request\`: фиксированное количество баллов за одно видео.
\`pricing.items\` содержит цены \`points\` в разрезе режима и качества (для изображений) или режима и разрешения (для видео). Позиции для генерации видео по изображению могут содержать \`reference_image_points\` — дополнительные баллы за каждое референсное изображение.
Итоговая сумма списания — это \`cost_points\` из ответа метода отправки; правила те же, что и на сайте, см. [Баллы и оплата](/docs/billing#pricing-units).
`,
};
