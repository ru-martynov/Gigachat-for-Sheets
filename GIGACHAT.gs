function GIGACHAT(prompt, prompt1) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey = getGigaChatToken();
  var model = scriptProperties.getProperty('MODEL');
  var temperature = scriptProperties.getProperty('TEMPERATURE');
  var apiEndpoint = 'https://sber.ai-band.ru/api/v1/chat/completions';
  var payload = JSON.stringify({
    "model": model,
    "temperature": parseFloat(temperature),
    "messages": [
      {
        "role": "system",
        "content": "Ты универсальный ассистент. Твоя задача корректно отвечать на запросы пользователя. В ответе не используй markdown разметку."
      },
      {
        "role": "user",
        "content": prompt + "" + prompt1
      }
    ]
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
    if (response.getResponseCode() == 200) {
      var content = jsonResponse.choices[0].message.content;
      // Убираем кавычку в начале и в конце, если они есть
      if (content.charAt(0) === '"' && content.charAt(content.length - 1) === '"') {
        content = content.substring(1, content.length - 1);
      }
      return content;
    } else {
      return "API call failed with response: " + response.getContentText();
    }
  } catch (error) {
    return "Ошибка при получении ответа: " + error.toString();
  }
}
