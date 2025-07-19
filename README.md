# Gigachat-for-Sheets: инструкция с компактными картинками

**Gigachat-for-Sheets** — это решение для интеграции GigaChat в **Google Таблицы** через Google Apps Script.

## 1. Копирование шаблонной таблицы

Перейдите по ссылке и сделайте копию таблицы:  
https://docs.google.com/spreadsheets/d/1t-nuewANiQLMFkUcIAGUv2nHVZ_QjH6WKK3fe6crDxA/copy

<p align="center"><img src="img/1.png" alt="Копирование таблицы" width="400"></p>

## 2. Активация меню GIGACHAT

В новой таблице в меню появится кнопка **GIGACHAT**.  
Выберите **«Настройки API»**, авторизуйтесь, предоставьте доступ.

<p align="center">
  <img src="img/2.png" alt="Меню GIGACHAT" width="200">  
  <img src="img/3.png" alt="Настройки API" width="200">  
  <img src="img/4.png" alt="Авторизация" width="200">
</p>

## 3. Получение API-ключа

Получите API-ключ (Client ID, Client Secret, Scope) на сайте:  
https://developers.sber.ru/studio/workspaces

## 4. Вход в личный кабинет

Зайдите в раздел **«Мой GigaChat»**.

<p align="center"><img src="img/5.png" alt="Мой GigaChat" width="400"></p>

## 5. Настройка API-ключа

Нажмите **«Настроить API»**, создайте новый ключ, скопируйте **Client ID**, **Client Secret** и **Scope**.

<p align="center">
  <img src="img/6.png" alt="Настроить API" width="200">  
  <img src="img/7.png" alt="Создание ключа" width="200">  
  <img src="img/8.png" alt="Данные ключа" width="200">
</p>

## 6. Ввод данных в таблицу

Вернитесь в Google Таблицу, введите значения в настройках GIGACHAT → **«Настройки API»**, сохраните.

## 7. Выбор модели

После сохранения появится возможность выбрать модель GigaChat.

<p align="center">
  <img src="img/9.png" alt="Выбор модели" width="200">  
  <img src="img/10.png" alt="Сохранение модели" width="200">
</p>

## 8. Проверка работы

Введите в ячейку формулу:

=GIGACHAT("Привет")


Если всё настроено верно, вы получите ответ от GigaChat.

---

**Поздравляю!**  
Теперь вы можете использовать GigaChat прямо в Google Таблицах!


