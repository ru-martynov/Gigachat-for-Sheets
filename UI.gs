//-----------------------------------
// Интерфейс
//-----------------------------------

// Создание пользовательского меню при открытии документа
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('GIGACHAT')
    .addItem('Значения в текст', 'replaceFormulasWithValues')
    .addItem('Вставить таблицу', 'promptForGPT_TABLE')
    .addItem('Перезапустить функцию', 'restartFunctionInCell')
    .addItem('Вставить изображение', 'promptForImageInsertion')
    .addItem('Описание функций', 'DescriptionFurmuls')
    .addItem('Настройки API', 'showSettingsDialog')
    .addToUi();
}

// Замена всех формул в листе на их значения
function replaceFormulasWithValues() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getDataRange();
  var values = range.getValues();
  range.setValues(values);
}


// Отображение диалогового окна описания
function DescriptionFurmuls() {
  var html = HtmlService.createHtmlOutputFromFile('Desc')
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Описание функций GIGACHAT');
}

// Отображение диалогового окна для запроса к API
function promptForGPT_TABLE() {
  var html = HtmlService.createHtmlOutputFromFile('Prompt')
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Введите запрос для API');
}

// Перезапуск функции в активной ячейке
function restartFunctionInCell() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var cell = sheet.getActiveCell();
  var formula = cell.getFormula();
  
  if (formula) {
    if (/ "\)$/.test(formula)) {
      formula = formula.replace(/ "\)$/, '")');
    } else {
      formula = formula.replace(/"\)$/, ' ")');
    }
    cell.setFormula(''); // Очистка ячейки
    SpreadsheetApp.flush(); // Применение изменений
    cell.setFormula(formula); // Восстановление формулы
    SpreadsheetApp.getUi().alert('Формула в ячейке была перезапущена.');
  } else {
    SpreadsheetApp.getUi().alert('В выбранной ячейке нет формулы.');
  }
}

// Отображение диалога настроек API
function showSettingsDialog() {
  var html = HtmlService.createHtmlOutputFromFile('Settings')
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Настройки API GigaChat');
}

// Отображение диалогового окна для запроса изображения
function promptForImageInsertion() {
  var html = HtmlService.createHtmlOutputFromFile('ImagePrompt')
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Введите запрос для изображения');
}


//-----------------------------------
// API
//-----------------------------------

// Получение настроек из свойств скрипта
function getSettings() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var settings = {
    clientId: scriptProperties.getProperty('CLIENT_ID'),
    clientSecret: scriptProperties.getProperty('CLIENT_SECRET'),
    scope: scriptProperties.getProperty('SCOPE'),
    temperature: scriptProperties.getProperty('TEMPERATURE'),
    currentModel: scriptProperties.getProperty('MODEL')
  };
  settings.models = fetchModelList(); // Получение списка моделей
  return settings;
}

// Сохранение настроек и обновление токена
function saveSettings(clientId, clientSecret, scope, temperature, model) {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'CLIENT_ID': clientId,
    'CLIENT_SECRET': clientSecret,
    'SCOPE': scope,
    'TEMPERATURE': temperature,
    'MODEL': model
  }, true); // true для удаления старых ключей, которые не включены в объект
  
  getGigaChatToken(); // Обновление токена
}

// Получение списка доступных моделей с API
function fetchModelList() {
  var accessToken = getGigaChatToken(); // Проверка и получение токена
  var response = UrlFetchApp.fetch('https://sber.ai-band.ru/api/v1/models', {
    'method': 'get',
    'headers': {
      'Authorization': 'Bearer ' + accessToken
    }
  });
  var jsonResponse = JSON.parse(response.getContentText());
  return jsonResponse.data.map(function(model) {
    return model.id;
  });
}


// Получение или обновление токена доступа
function getGigaChatToken() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var clientId = scriptProperties.getProperty('CLIENT_ID');
  var clientSecret = scriptProperties.getProperty('CLIENT_SECRET');
  var scope = scriptProperties.getProperty('SCOPE');
  var temperature = scriptProperties.getProperty('TEMPERATURE');
  var model = scriptProperties.getProperty('MODEL'); // Сохраняем текущую модель

  var tokenUrl = 'https://sber.ai-band.ru/oauth';
  var credentials = clientId + ':' + clientSecret;
  var base64Credentials = Utilities.base64Encode(credentials);
  
  var headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + base64Credentials,
    'Accept': 'application/json',
    'RqUID': Utilities.getUuid() // Уникальный идентификатор запроса
  };

  var payload = 'scope=' + encodeURIComponent(scope);

  var options = {
    'method': 'post',
    'headers': headers,
    'payload': payload,
    'muteHttpExceptions': true
  };

  try {
    var response = UrlFetchApp.fetch(tokenUrl, options);
    var responseData = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() == 200) {
      var accessToken = responseData.access_token;
      var expiresIn = responseData.expires_at; // Время жизни токена в секундах
      var expirationTime = Date.now() + expiresIn * 1000; // Время истечения токена
      scriptProperties.setProperties({
        'ACCESS_TOKEN': accessToken,
        'TOKEN_EXPIRATION_TIME': expirationTime, // Сохраняем время истечения токена как число
        'MODEL': model, 
        'CLIENT_ID': clientId, 
        'CLIENT_SECRET': clientSecret, 
        'SCOPE': scope,
        'TEMPERATURE': temperature
      }, true); // Обновляем 
      return accessToken;
    } else if (response.getResponseCode() == 401 && responseData.message == "Token has expired") {
      // Если токен истек, генерируем новый
      return getGigaChatToken();
    } else {
      throw new Error('Ошибка получения токена: ' + responseData.message);
    }
  } catch (e) {
    Logger.log('Ошибка SSL или другая ошибка сети: ' + e.toString());
    throw e;
  }
}









