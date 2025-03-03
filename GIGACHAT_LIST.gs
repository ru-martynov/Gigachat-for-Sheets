function GIGACHAT_LIST(prompt) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey = getGigaChatToken();
  var model = scriptProperties.getProperty('MODEL');
  var temperature = scriptProperties.getProperty('TEMPERATURE');
  var apiEndpoint = 'https://sber.ai-band.ru/api/v1/chat/completions';
  

  // Определение пользовательской функции
  const customFunctionDefinition = {
    name: 'generate_list',
    description: 'Генерирует список элементов на основе запроса',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'string',
            description: 'Элемент списка'
          }
        }
      }
    }
  };

var payload = JSON.stringify({
    "model": model,
    "temperature": parseFloat(temperature),
    "messages": [
      {
        "role": "system",
        "content": "Ты универсальный ассистент по созданию списков."
      },
      {
        "role": "user",
        "content": "Запрос пользователя - " + prompt
      }
    ],
       "functions": [customFunctionDefinition],
        "function_call": "auto"
  });
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': payload,
    'headers': {
      'Authorization': 'Bearer ' + apiKey
    },
    'muteHttpExceptions': true
  };

  try {
  var response = UrlFetchApp.fetch(apiEndpoint, options);
  var jsonResponse = JSON.parse(response.getContentText());
  Logger.log(jsonResponse)
  var functionArgs = jsonResponse.choices[0].message.function_call.arguments;
  Logger.log(functionArgs)
  var content = JSON.parse(functionArgs).items;

  return content.map(function(item) {
      return [item.trim()];
  });
}  catch (error) {
  Logger.log('Ошибка при вызове API GigaChat: ' + error.toString());
  return "Ошибка при получении ответа: " + error.toString();
}
}

function test() {
return GIGACHAT_LIST("Топ 10 ключевых запросов для продвижения курса по нейросетям")
}
