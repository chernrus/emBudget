var MESSAGE = {
  overlap_dep: 'Отдел с таким именем уже добавлен!',  //-dep
  empty_dep: 'Введите название отдела!',
  empty_empl: 'Введите имя сотрудника!', //-empl
  wrong_phone: 'Неверный формат телефона!',
  choose_dep: 'Выберите отдел!',
  choose_empl: 'Выберите сотрудника!', //-pay
  empty_wpay: 'Введите "ЗП белая"!',
  empty_gpay: 'Введите "ЗП серая"!',
  choose_prj: 'Выберите проект!', //-wt
  wrong_dfrom: 'Неверный формат даты начала!',
  wrong_dto: 'Неверный формат даты окончания!',
  overlap_date: 'Дата начала должна быть позднее даты окончания!',
  empty_time: 'Веедите затраченное время в часах!',
  empty_prj: 'Введите название проекта!',  //-prj
  overlap_prj: 'Указааный проект уже существует',
  empty_dfrom: 'Укажите дату начала!',
  empty_dto: 'Укажите дату окончания!',
  empty_contr: 'Введите номер договора!', //-contr 
  overlap_contr: 'Договор с таким именем уже существет!',
  choose_type: 'Выберите тип договора!',
  choose_status: 'Выберите статус договора!',
  empty_planTime: 'Укажите планируемые трудозатраты!',
  empty_fullCost: 'Укажите полную стоимость!',
  excess_time: 'Общая сумма часов по всем проектам данного договора превышает значение поля «Планируемые трудозатраты(часов)', //-provision
  excess_cost:'Общая сумма руб. по всем проектам данного договора превышает значение поля «Полная цена (рублей)',
  empty_projectCost: 'Укажите сумму по проектам!',
  count: 'Значение превышает количество дней в месяце!',
  year: 'Год является недопустимым значением!',
  choose_month: 'Выберите месяц!',
  empty_premium: 'Укажите размер пермии в руб.',
  success: 'Success'
},
    FORMAT = [['0.00','0.00']];

function openDocument(id, page) {
  var ss = SpreadsheetApp.openById(id),
      sheet = ss.getSheetByName(page);
  return sheet;
}

/*
  Получаем список
*/
function getEmployeeList(mode, type, depID){
  var ss = SpreadsheetApp.openById(FILEID[type]);
  var tableValue = ss.getSheetByName(mode).getDataRange().getValues(),
      list = [];
  
  for(var i = 1; i < tableValue.length; i++) {
    if(tableValue[i][4]){
      list.push({id: tableValue[i][0], name: tableValue[i][1]});
    }
  }
 
  return list.sort(compareStr);
}


function getDepartmentList(mode, type, depID){
  var ss = openDocument(FILEID[type], mode);
  var tableValue = ss.getDataRange().getValues();
  
  var list = [];
  
  for(var i = 1; i < tableValue.length; i++) {
    if(tableValue[i][2]){
      list.push({id: tableValue[i][0], name: tableValue[i][1]});
    }
  }
  
  Logger.log(list);
  return list.sort(compareStr);
}

function getList(mode, type, depID){
  Logger.log(mode);
  Logger.log(type);
  Logger.log(depID);
  var ss = SpreadsheetApp.openById(FILEID[type]);
  var tableValue = ss.getSheetByName(mode).getDataRange().getValues();
  var list = [];
  
  if(depID && type == 'employee') {
    for(var i = 1; i < tableValue.length; i++) {
      if(tableValue[i][3] == depID && tableValue[i][4] != 'Уволен'){
        list.push({id: tableValue[i][0], name: tableValue[i][1]});
      }
    }
  } 
  else if(type == 'employee') {
    for(var i = 1; i < tableValue.length; i++) {
      if(tableValue[i][4] != 'Уволен') {
        list.push({id: tableValue[i][0], name: tableValue[i][1]});
      }
    }
  } 
  else if(type == 'project') {
    for(var i = 1; i < tableValue.length; i++) {
      if(tableValue[i][4]) {
        list.push({id: tableValue[i][0], name: tableValue[i][1]});
      }
    }
  }
  else {
    for(var i = 1; i < tableValue.length; i++) {
      if(tableValue[i][2]) {
        list.push({id: tableValue[i][0], name: tableValue[i][1]});
      }
    }
  }
  
  return list.sort(compareStr);
}

function compareStr(a, b){
  var x = a.name.toLowerCase(),
    y = b.name.toLowerCase();
  if(x > y) return 1;
  if(x < y) return -1;
  if(x == y) return 0;
}

/*
  Удаление лишних пробелов
*/
function cleanStr(str) {
  var re = /\s+/, 
      i = 0,
      rawArr, 
      clearArr = [];
  
  rawArr = str.split(re);
  
  for(i; i < rawArr.length; i++){
    if(rawArr[i]) clearArr.push(rawArr[i]);
  }  
  
  return clearArr.join(' ');
}

function checkPhone(phone) {
  return phone.replace(/\D+/g,"").length === 11;
}

/*
  Приводим в нужный формат дату
*/
function formatDate(date){
  return date.getDate() + '.' + date.getMonth() + '.' + date.getFullYear();
}

/**
 Проверка на уже существующую сущность
*/
function checkOverlap(name, value) {
  for(var i = 0; i < value.length; i++) {
    if(name.toLowerCase() == value[i][1].toLowerCase()) {
      return true;
    }
  }
  return false;
}

function checkDate(date) {
  var re = /\d{2}.\d{2}.\d{4}/;
  
  return re.exec(date);
}

function compareDatesWtime(firstDate, secondDate){ // TODO: подумать, переделать
  var firstArr = firstDate.split('.'),
      secondArr = secondDate.split('.');
  return (firstArr[0] < secondArr[0] && firstArr[1]+firstArr[2] == secondArr[1]+secondArr[2]);
}

/*
  Сравнение дат
*/
function compareDates(firstDate, secondDate){
  var firstArr = firstDate.split('.'),
      secondArr = secondDate.split('.');
  return firstArr[2]+firstArr[1]+firstArr[0] >= secondArr[2]+secondArr[1]+secondArr[0];
}