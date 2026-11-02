import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const MARKER = "/* ===== Ваши стили — ниже этой строки ===== */";

const BASE_BLOCK = `/* ===== Базовые стили: этот блок не меняем ===== */

* {
  box-sizing: border-box; /* разберём на следующем занятии */
}

#main {
  margin: 0;
  padding: 42px;
  font-family: Arial, sans-serif;
  background-color: #f9f9f9;
}

button {
  font-family: Arial, sans-serif;
  border: none;
  background-color: #cccccc;
  color: #000000;
}`;

const readText = (file) => readFileSync(file, "utf8").replace(/\r\n/g, "\n");

const css = readText("src/styles.css");
const userCss = css.includes(MARKER)
  ? css.slice(css.indexOf(MARKER) + MARKER.length)
  : "";

const pageUrl = pathToFileURL(resolve("src/index.html")).href;

test.beforeEach(async ({ page }) => {
  await page.goto(pageUrl);
});

test("1. Стили подключены внешним файлом styles.css в <head>", async ({
  page,
}) => {
  await expect(
    page.locator('head link[rel="stylesheet"][href$="styles.css"]'),
    "В <head> нет тега <link>, который подключает styles.css",
  ).toHaveCount(1);
  await expect(
    page.locator("body"),
    "styles.css не применился: проверьте путь в атрибуте href",
  ).toHaveCSS("background-color", "rgb(249, 249, 249)");
});

test("2. В index.html нет атрибутов style и тега <style>", async ({ page }) => {
  await expect(
    page.locator("[style]"),
    "Уберите атрибуты style из разметки",
  ).toHaveCount(0);
  await expect(
    page.locator("style"),
    "Уберите тег <style> из разметки",
  ).toHaveCount(0);
});

test("3. В styles.css нет !important", () => {
  expect(
    css.includes("!important"),
    "Найден !important — перебейте правило специфичностью",
  ).toBe(false);
});

test("4. Базовый блок в начале styles.css не изменён", () => {
  expect(
    css.startsWith(BASE_BLOCK),
    "Базовый блок изменён — верните его как было",
  ).toBe(true);
  expect(
    css.includes(MARKER),
    "Не найдена строка «Ваши стили — ниже этой строки»",
  ).toBe(true);
});

test("5. Карточка .card", async ({ page }) => {
  const card = page.locator("article.card");
  await expect(card, "Ширина карточки — 280px").toHaveCSS("width", "280px");
  await expect(card, "Внутренний отступ карточки — 20px").toHaveCSS(
    "padding",
    "20px",
  );
  await expect(card, "Фон карточки — #FFCC00").toHaveCSS(
    "background-color",
    "rgb(255, 204, 0)",
  );
  await expect(card, "Скругление карточки — 10px").toHaveCSS(
    "border-radius",
    "10px",
  );
});

test("6. Блок изображения .card-image", async ({ page }) => {
  const image = page.locator("article.card > div.card-image");
  await expect(
    image,
    'Нужен <div class="card-image"> внутри карточки',
  ).toHaveCount(1);
  await expect(image, "Высота блока изображения — 170px").toHaveCSS(
    "height",
    "170px",
  );
  await expect(image, "Фон блока изображения — #FFF").toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(image, "Скругление блока изображения — 10px").toHaveCSS(
    "border-radius",
    "10px",
  );
});

test("7. Заголовок .card-title", async ({ page }) => {
  const title = page.locator("article.card > h2.card-title");
  await expect(
    title,
    'Заголовок карточки должен быть <h2 class="card-title">',
  ).toHaveCount(1);
  await expect(title, "Размер заголовка — 20px").toHaveCSS("font-size", "20px");
  await expect(title, "Заголовок — жирный").toHaveCSS("font-weight", "700");
  await expect(title, "Цвет заголовка — #000").toHaveCSS(
    "color",
    "rgb(0, 0, 0)",
  );
});

test("8. Описание .card-subtitle", async ({ page }) => {
  const subtitle = page.locator("article.card > p.card-subtitle");
  await expect(
    subtitle,
    'Описание должно быть <p class="card-subtitle">',
  ).toHaveCount(1);
  await expect(subtitle, "Размер описания — 12px").toHaveCSS(
    "font-size",
    "12px",
  );
  await expect(subtitle, "Цвет описания — #000").toHaveCSS(
    "color",
    "rgb(0, 0, 0)",
  );
});

test("9. Кнопка .card-button", async ({ page }) => {
  const button = page.locator("article.card > button.card-button");
  await expect(button, "Кнопке нужен класс card-button").toHaveCount(1);
  await expect(
    button,
    "Кнопка — на всю ширину карточки (240px внутри отступов)",
  ).toHaveCSS("width", "240px");
  await expect(button, "Высота кнопки — 40px").toHaveCSS("height", "40px");
  await expect(button, "Фон кнопки — #000").toHaveCSS(
    "background-color",
    "rgb(0, 0, 0)",
  );
  await expect(button, "Цвет текста кнопки — белый").toHaveCSS(
    "color",
    "rgb(255, 255, 255)",
  );
  await expect(button, "Размер текста кнопки — 16px").toHaveCSS(
    "font-size",
    "16px",
  );
  await expect(button, "Скругление кнопки — 10px").toHaveCSS(
    "border-radius",
    "10px",
  );
});

test("10. Стили кнопки заданы через класс .card-button", () => {
  const selectors = [
    ...userCss.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{/g),
  ]
    .flatMap((match) => match[1].split(","))
    .map((selector) => selector.trim());

  expect(selectors, "Нет правила с селектором .card-button").toContain(
    ".card-button",
  );
  expect(
    selectors.filter((selector) => /^button\b/.test(selector)),
    "Не стилизуйте кнопку через тег button — используйте класс",
  ).toEqual([]);
  expect(
    selectors.filter((selector) => selector.includes("#")),
    "Не используйте селекторы по id",
  ).toEqual([]);
});
