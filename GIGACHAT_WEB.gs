function GIGACHAT_WEB(pageURL, prompt) {
  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey = getGigaChatToken();
  var model = scriptProperties.getProperty('MODEL');
  var temperature = scriptProperties.getProperty('TEMPERATURE');
  var pageContent = importBodyContent(pageURL)
  var apiEndpoint = 'https://sber.ai-band.ru/api/v1/chat/completions';
  var payload = JSON.stringify({
    "model": model,
    "temperature": parseFloat(temperature),
    "messages": [
      {
        "role": "system",
        "content": "Ты универсальный ассистент. Давать ответ поьзователю на основе контента web страницы. Всегда учитывай контент страницы и отвечай только на основе него. В ответе не используй markdown разметку."
      },
      {
        "role": "user",
        "content": "На основе текста страницы подготовь ответ, от себя ничего не пиши, только ответ по теме. Текст страницы - " + pageContent + "Сообщения пользователя - " + prompt
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
    Logger.log('Ошибка при вызове API Сбера: ' + error.toString());
    return "Ошибка при получении ответа: " + error.toString();
  }
}

function importBodyContent(url) {
var output = '';
var fetchedUrl = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
if (fetchedUrl) {
var html = fetchedUrl.getContentText();
var bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (bodyContent && bodyContent.length > 1) {
// Удаляем скрипты и стили
output = bodyContent[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
// Удаляем HTML-теги
output = output.replace(/<[^>]*>/g, '');
// Удаляем избыточные пробелы, переносы строк и табуляции
output = output.replace(/\s+/g, ' ').trim();
}
}
// Обрезаем текст до 50 000 символов, если он длиннее
if (output.length > 50000) {
output = output.substring(0, 50000);
}
// Grace period to not overload
Utilities.sleep(1000);
return unescapeHTML(output);
}
function unescapeHTML(str) {
var htmlEntities = {
nbsp: ' ',
cent: '¢',
pound: '£',
yen: '¥',
euro: '€',
copy: '©',
reg: '®',
lt: '<',
gt: '>',
mdash: '–',
ndash: '-',
quot: '"',
amp: '&',
apos: '\''
};
return str.replace(/\&([^;]+);/g, function (entity, entityCode) {
var match;
if (entityCode in htmlEntities) {
return htmlEntities[entityCode];
} else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
return String.fromCharCode(parseInt(match[1], 16));
} else if (match = entityCode.match(/^#(\d+)$/)) {
return String.fromCharCode(~~match[1]);
} else {
return entity;
} }); };
