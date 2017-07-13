function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}


function getScriptUrl() {
 var url = ScriptApp.getService().getUrl();
 Logger.log(url);
 return url;
}

function doGet(e) {
  Logger.log(Utilities.jsonStringify(e));
  if (!e.parameter.page) {
    return HtmlService.createTemplateFromFile('main').evaluate().setTitle('Бюджет');
  }
  
  return HtmlService.createTemplateFromFile(e.parameter.page).evaluate().setTitle(e.parameter.title);
}