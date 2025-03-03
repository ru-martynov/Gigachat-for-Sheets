function GIGACHAT_IMG(prompt, model) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey = getGigaChatToken();
  var temperature = scriptProperties.getProperty('TEMPERATURE');
  var apiEndpoint = 'https://sber.ai-band.ru/api/v1/chat/completions'; // Прокси URL
  var payload = {
    model: model,
    messages: [
      {
        role: "system",
        content: "Ты профессиональный нейро художник. Если тебя просят создать изображение, ты должен сгенерировать специальный блок: text2image(query: str, style: str),\nгде query — " + prompt + ", style — ты пишешь сам на основе запросу пользователя - " + prompt
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: parseFloat(temperature),
    "function_call": "auto"
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: {
      'Authorization': 'Bearer ' + apiKey
    },
    muteHttpExceptions: true
  };

  try {
    // Отправляем запрос на создание изображения
    var response = UrlFetchApp.fetch(apiEndpoint, options);
    var jsonResponse = JSON.parse(response.getContentText());
    Logger.log("Ответ JSON: " + JSON.stringify(jsonResponse)); // Логируем JSON-ответ

    // Проверяем, есть ли сообщение, вместо идентификатора изображения
    var assistantMessage = jsonResponse.choices[0].message.content;
    if (assistantMessage && !assistantMessage.includes('<img src=')) {
      SpreadsheetApp.getUi().alert('Ответ от API: ' + assistantMessage);
      return;
    }

    // Извлекаем идентификатор изображения
    var fileId = getImageIdFromResponse(jsonResponse);
    if (!fileId) {
      throw new Error('Идентификатор изображения не найден. Проверьте структуру ответа API.');
    }

    // Получаем URL для вставки
    var imageUrl = getProxiedImageUrl(fileId); // Обращение к прокси
    if (!imageUrl) {
      throw new Error('Не удалось получить URL изображения через прокси.');
    }

    insertImageIntoActiveCell(imageUrl);
  } catch (error) {
    SpreadsheetApp.getUi().alert('Ошибка при вызове API Сбера: ' + error.toString());
  }
}

function getImageIdFromResponse(jsonResponse) {
  if (jsonResponse && jsonResponse.choices && jsonResponse.choices.length > 0) {
    var imageContent = jsonResponse.choices[0].message.content;
    Logger.log("Ответ API: " + imageContent); // Логируем ответ API
    var matches = imageContent.match(/<img src="([^"]+)"/);
    if (matches && matches.length > 1) {
      Logger.log("Найден идентификатор изображения: " + matches[1]); // Логируем найденный ID
      return matches[1];
    }
  }
  Logger.log("Идентификатор изображения не найден в ответе."); // Логируем ошибку
  return null;
}

function getProxiedImageUrl(fileId) {
  var apiEndpoint = `https://sber.ai-band.ru/api/v1/image/${fileId}`; // Ваш маршрут на прокси
  var apiKey = getGigaChatToken();
  var options = {
    headers: {
      'Authorization': 'Bearer ' + apiKey
    },
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(apiEndpoint, options);
    var jsonResponse = JSON.parse(response.getContentText());
    Logger.log("Ответ от прокси: " + JSON.stringify(jsonResponse)); // Логируем ответ от прокси
    if (jsonResponse && jsonResponse.url) {
      return jsonResponse.url; // Возвращаем URL изображения
    }
  } catch (error) {
    Logger.log("Ошибка при вызове прокси для получения изображения: " + error.toString());
  }
  return null;
}

function insertImageIntoActiveCell(imageBlobUrl) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var cell = sheet.getActiveCell();
  cell.setFormula('=IMAGE("' + imageBlobUrl + '")');
}
