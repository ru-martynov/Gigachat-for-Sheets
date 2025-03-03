function GIGACHAT_TABLE(prompt, model) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey = getGigaChatToken();
  var temperature = scriptProperties.getProperty('TEMPERATURE');
  var apiEndpoint = 'https://sber.ai-band.ru/api/v1/chat/completions';
 
  var payload = {
    "model": model,
    "temperature": parseFloat(temperature),
    "messages": [
      {
        "role": "system",
        "content": `Ты универсальный ассистент по созданию и наполнению таблиц.
        Твоя задача - по запросу пользователя создавать и наполнять таблицы нужными данными. Данные ты пишешь сам!
        Всегда возвращай данные строго в формате таблицы, используя следующие правила:
        1. Первая строка должна содержать только заголовки столбцов.
        2. Следующие строки - данные, согласно заголовкам.
        3. Каждая строка данных разделена символом ';' (точка с запятой), а данные внутри строки разделены символом '::' (двойное двоеточие).
        4. Убедись, что в ответах нет лишних строк, пробелов или символов до и после таблицы.
        5. Не добавляй примеры или дополнительные комментарии, возвращай только таблицу.`
      },
      {
        "role": "user",
        "content": `Создай таблицу по запросу пользователя. Ниже примеры правильного формата. Примеры в ответе не используй.
        Примеры данных (правильная структура данных):
        
        Пример 1:
        Заголовки: Имя::Возраст::Город;
        Данные: Иван::25::Москва; Анна::30::Санкт-Петербург; Петр::40::Новосибирск; Ольга::35::Казань; Сергей::28::Екатеринбург; Наталья::22::Нижний Новгород;
        
        Пример 2:
        Заголовки: Продукт::Цена::Количество;
        Данные: Яблоко::50::100; Банан::30::150; Апельсин::70::80; Груша::60::90; Виноград::120::60; Ананас::200::30;

        Верни в формате таблицы. Никаких лишних символов, строго по формату! Начни ответ с заголовков и следом данные.
        Обязательно пиши все необходимые данные, твоя задача в этом и состоит, что бы генерировать готовые таблицы.
        Не допускай пустых строк и лишних ячеек, все как в примере должно быть.
        Вот запрос пользователя по которому ты создаешь и наполняешь таблицу: ` + prompt
      }
    ]
  };

  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'headers': {
      'Authorization': 'Bearer ' + apiKey
    }
  };

  try {
    var response = UrlFetchApp.fetch(apiEndpoint, options);
    var jsonResponse = JSON.parse(response.getContentText());
    var data = jsonResponse.choices[0].message.content;

    Logger.log(data)

    // Разделим данные на строки по разделителям ';' и '\n'
    var lines = data.trim().split(/;|\n/);

    // Удалим пустые строки
    lines = lines.filter(function(line) {
      return line.trim() !== '';
    });

    var headers;
    var rows = [];

    // Проверим, содержат ли строки ключевые слова "Заголовки:" и "Данные:"
    var headersIndex = lines.findIndex(line => line.includes('Заголовки:'));
    var dataIndex = lines.findIndex(line => line.includes('Данные:'));

    // Если строки содержат ключевые слова "Заголовки:" и "Данные:", то получим заголовки и данные
    if (headersIndex !== -1 && dataIndex !== -1) {
      headers = lines[headersIndex].split('Заголовки:')[1].trim().split('::');
      rows = lines.slice(dataIndex).map(function(row) {
        return row.replace('Данные: ', '').trim().split('::');
      });
    } else {
      var headersLine = lines[0];
      var dataLines = lines.slice(1);

      // Проверяем, присутствует ли ключевое слово "Заголовки:" в строке заголовков
      if (headersLine.includes('Заголовки:')) {
        headers = headersLine.split('Заголовки:')[1].trim().split('::');
      } else {
        headers = headersLine.trim().split('::');
      }

      // Проверяем, присутствует ли ключевое слово "Данные:" в строках данных
      dataLines = dataLines.map(function(row) {
        if (row.includes('Данные:')) {
          return row.replace('Данные:', '').trim().split('::');
        } else {
          return row.trim().split('::');
        }
      });

      rows = dataLines;
    }

    var sheet = SpreadsheetApp.getActiveSheet();
    var activeRange = sheet.getActiveRange();
    var startRow = activeRange.getRow();
    var startColumn = activeRange.getColumn();

    // Запишем заголовки, если они были найдены и если они определены
    if (headers && headers.length > 0) {
      var headerRange = sheet.getRange(startRow, startColumn, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setBackground('#cccccc'); // Установка серого цвета для заголовков
      startRow++; // Переходим к следующей строке для данных
    }

    // Запишем данные, если они были найдены
    if (rows.length > 0) {
      rows.forEach(function(row, index) {
        if (row.length === headers.length) {
          var rowRange = sheet.getRange(startRow + index, startColumn, 1, row.length);
          rowRange.setValues([row]);
        }
      });
    }

    return "Таблица успешно создана";
  } catch (error) {
    Logger.log('Ошибка при вызове API GigaChat: ' + error.toString());
    return "Ошибка при получении ответа";
  }
}
