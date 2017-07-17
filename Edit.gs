var EM = {
  mode: 'Разработка'
}

/*
  Редактирование и удаление отделов
  ----------------------------------
*/
function getDepTable() {
  var value = openDocument(FILEID.department, EM.mode).getDataRange().getValues();
      table_value = createDepModel(value);

  return JSON.stringify(table_value.sort(compareStr));//mode + ' - it\'s mode. It\'s working!';
}


/**
* Создание объекта таблицы для отображения
*/
function createDepModel(data) {
  var i = 0,
      result = [];
      emplValue = openDocument(FILEID.employee, EM.mode).getDataRange().getValues();
      
  data.forEach(function(row, i){
    if(data[i][2] && i != 0) {
      result.push({
          id: data[i][0],
          name: data[i][1],
          row: i + 1,
          people_count: getPeopleCountOfDep(data[i][0], emplValue)
      });
    }
  });
  return result;
}

function saveDepartment(data) {

  var sheet = openDocument(FILEID.department, data.mode);

  sheet.getRange(data.row, 2, 1, 1).setValue(cleanStr(data.name));

  return {
    status: 'Success',
    text: 'Название отдела изменено на "' + data.name + '"!'
  };
}

function deleteDepartment(data){

  var sheetDep = openDocument(FILEID.department, data.mode),
      sheetWTime = openDocument(FILEID.workTime, data.mode),
      tableWTime = sheetWTime.getDataRange().getValues(),
      i = 0;

  sheetDep.getRange(data.row, 2, 1, 3).setValues([[data.name + ' (удалено)', false, data.date]]);

  for(i = 0; i < tableWTime.length; i++){
    if(data.id == tableWTime[i][4]) {
      sheetWTime.getRange(i + 1, 8).setValue(false);
    }
  }

  return {
    status: 'Success',
    text: 'Отдел "' + data.name + '" удален!'
  };
}

function getPeopleCountOfDep(dep_id, emplValue) {
  var total = 0,
      i = 0;

  for(i = 0; i < emplValue.length; i++){
    if(emplValue[i][3] == dep_id && emplValue[i][4]){

      total++;
    }
  }

  return total;
}

/*
  Просмотр и редактирование сотрудников
  -------------------------------------
*/

function getEmplTable(_mode) {

  EM.mode = _mode
  var sheet = openDocument(FILEID.employee, EM.mode),
      value = sheet.getDataRange().getValues(),
      table_value = createEmplModel(value);

  return JSON.stringify(table_value.sort(compareStr));
}


/**
* Создание объекта таблицы для отображения
*/
function createEmplModel(data) {

  var i = 0,
      result = [],
      departments = openDocument(FILEID.department, EM.mode).getDataRange().getValues();

  for(i = 1; i < data.length; i++){
    if(data[i][4] != 'Уволен') {
      result.push({
          id: data[i][0],
          name: data[i][1],
          phone: data[i][2],
          dep_id: data[i][3],
          dep_name: getDepName(data[i][3], departments),
          status: data[i][4],
          row: i + 1
      });
    }
  }

  return result;
}

function getDepName(id, dep_value){

  return dep_value.filter(function(dep_id, i){
    return dep_id[0] == id;
  })[0][1];
}

function saveEmployee(data) {

  var sheet = openDocument(FILEID.employee, data.mode);
  if(data.status == 'Уволен') {
    return deleteEmployee(data);
  } 
  else {
    sheet.getRange(data.row, 2, 1, 4).setValues([[cleanStr(data.name), data.phone, data.department, data.status]]);

    return {
      type: 'Success',
      text: 'Сотрудник "' + data.name + '" изменен!'
    };
  }
  
}

function deleteEmployee(data){

  var sheet = openDocument(FILEID.employee, data.mode),
      payment = openDocument(FILEID.payment, data.mode),
      payment_value = payment.getDataRange().getValues(),
      sheetWTime = openDocument(FILEID.workTime, data.mode),
      tableWTime = sheetWTime.getDataRange().getValues(),
      i = 0;

  if(checkDateInWorkTime(data.id, data.date, data.mode, tableWTime)) {
//    sheet.getRange(data.row, 2).setValue(data.name + ' (уволен)');
    sheet.getRange(data.row, 2, 1, 5).setValues([[data.name, data.phone, data.department, data.status, data.date]]);

    for(i = 0; i < payment_value.length; i++){
      if(payment_value[i][0] == data.id){
        payment.getRange(i+1, 4).setValue(false);
      }
    }


    for(i = 0; i < tableWTime.length; i++){

      if(data.id == tableWTime[i][5]) {
        sheetWTime.getRange(i + 1, 8).setValue(false);
      }
    }

    return {
      type: 'Success',
      text: 'Сотрудник "' + data.name + '" уволен!'
    }
  }
  else {
     return {
      type: 'Error',
      text: 'Дата удаления сотрудника попадает в период трудозатрат!'
    };
  };

}

function checkDateInWorkTime(id, _date, mode, wTime){
  var i = 0,
      dateArr = _date.split('.'),
      date = new Date(dateArr[1] + '/' + dateArr[0] + '/' + dateArr[2]);


  for(i = 0; i < wTime.length; i++){
    if(wTime[i][5] == id){
      if(wTime[i][2] <= date && date <= wTime[i][3]){
        Logger.log(wTime[i][2]);
        return false;
      }
    }
  }
  return true;
}


/*
  Редактирование и удаление проектов
  ----------------------------------
*/

function saveProject(data) {

  EM.mode = data.mode;
  var sheet = openDocument(FILEID.project, data.mode);

  sheet.getRange(data.row, 2, 1, 3).setValues([[cleanStr(data.name), data.date_from, data.date_to]]);

  return {
    status: 'Success',
    text: 'Проект "' + data.name + '" изменен!'
  };
}

function deleteProject(data){

  var sheet = openDocument(FILEID.project, data.mode),
      sheetWTime = openDocument(FILEID.workTime, data.mode),
      tableWTime = sheetWTime.getDataRange().getValues(),
      i = 0;;

  sheet.getRange(data.row, 2).setValue(data.name + ' (удалено)')
  sheet.getRange(data.row, 5, 1, 2).setValues([[false, data.date]]);

  for(i = 0; i < tableWTime.length; i++){
    if(data.id == tableWTime[i][1]) {
      sheetWTime.getRange(i + 1, 8).setValue(false);
    }
  }

  return {
    status: 'Success',
    text: 'Отдел "' + data.name + '" удален!'
  };
}

function getProjectTable(_mode) {

  EM.mode = _mode
  var sheet = openDocument(FILEID.project, EM.mode),
      value = sheet.getDataRange().getValues(),
      table_value = createProjectModel(value);

  addStatus(table_value);
  return JSON.stringify(table_value.sort(compareStr));
}


/**
* Создание объекта таблицы для отображения
*/
function createProjectModel(data) {

  var i = 0,
      result = [];

  for(i = 1; i < data.length; i++){
    if(data[i][4]) {
      result.push({
          id: data[i][0],
          name: data[i][1],
          date_from: data[i][2],
          date_to: data[i][3],
          row: i + 1,
      });
    }
  }

  return result;
}

function addStatus(table_value){

  var i = 0,
      current_date = new Date();
      
  for(i = 0; i < table_value.length; i++){

    if(table_value[i].date_to != '' && current_date >= table_value[i].date_to){

      table_value[i].progress = 'end';
    }
    else {
      table_value[i].progress = 'ongoing';
    }
  }
}

/*
  Редактирование и удаление трудозатрат
  -------------------------------------
*/

function getWTimeTable(_mode){

  EM.mode = _mode;
  var sheet = openDocument(FILEID.workTime, EM.mode),
      value = sheet.getDataRange().getValues(),
      table_value = createWTimeModel(value);

  return JSON.stringify(table_value.sort(compareStr));
}

function saveWTime(data){

  var sheet = openDocument(FILEID.workTime, data.mode);

  sheet.getRange(data.row, 3, 1, 2).setValues([[data.date_from, data.date_to]]);
  sheet.getRange(data.row, 7).setValue(data.time);

  return {
    type: 'Success',
    text: 'Запись успешно изменена'
  }
}

function removeRow(data){
   var sheet = openDocument(FILEID[data.document], data.mode);
       sheet.deleteRow(data.row);

  return {
    status: 'Success',
    text: 'Запись успешно удалена!'
  }
}

/**
* Создание объекта таблицы для отображения
*/
function createWTimeModel(data) {
  var i = 0,
      result = [],
      prjV = openDocument(FILEID.project, EM.mode).getDataRange().getValues(),
      depV = openDocument(FILEID.department, EM.mode).getDataRange().getValues(),
      empV = openDocument(FILEID.employee, EM.mode).getDataRange().getValues();

  data.forEach(function(row, i, value){

    if(row[7] && i != 0) {
      result.push({
          name: getName(row[1], prjV),
          date_from: row[2],
          date_to: row[3],
          dep_name: getName(row[4], depV),
          empl_name: getName(row[5], empV),
          time: row[6],
          row: i + 1
      });
    }
  });

//  for(i = 1; i < data.length; i++){
//    if(data[i][7]) {
//      result.push({
//          name: getName(data[i][1], prjV),
//          date_from: data[i][2],
//          date_to: data[i][3],
//          dep_name: getName(data[i][4], depV),
//          empl_name: getName(data[i][5], empV),
//          time: data[i][6],
//          row: i + 1
//      });
//    }
//  }

  return result;
}

function getName(id, table){
  var i = 0;

  for(i = 0; i < table.length; i++) {
    if(table[i][0] == id){
      return table[i][1];
    }
  }
  return 'empty';
}
//function getName(id, file){
//  var table = openDocument(FILEID[file], mode).getDataRange().getValues(),
//      i = 0;
//
//  for(i = 0; i < table.length; i++) {
//    if(table[i][0] == id){
//      return table[i][1];
//    }
//  }
//  return 'empty';
//}

/*
  Редактирование и просмотр контрактов
  ------------------------------------
*/

function getContractValue(_mode){

  EM.mode = _mode;
  var sheet = openDocument(FILEID.contract, EM.mode),
      value = sheet.getDataRange().getValues(),
      table_value = createContractModel(value);

  return JSON.stringify(table_value.sort(compareStr));
}

/**
* Создание объекта таблицы для отображения контрактов
*/
function createContractModel(data) {
  var i = 0,
      result = [];

  for(i = 1; i < data.length; i++){
    result.push({
      id: data[i][0],
      name: data[i][1],
      code: data[i][2],
      organization: data[i][3],
      type: data[i][4],
      status: data[i][5],
      time: data[i][6],
      cost: data[i][7],
      date_from: data[i][8],
      date_to: data[i][9],
      document: data[i][10],
      row: i + 1
    });
  }

  return result;
}

function saveContract(data){

  var sheet = openDocument(FILEID.contract, 'Разработка'); // TODO


  if(checkProvisionTime(data.id, data.cost)){
    sheet.getRange(data.row, 2, 1, 8).setValues([[
      data.name,
      data.organization,
      data.status,
      data.time,
      data.cost,
      data.date_from,
      data.date_to,
      data.document
    ]]);

    return {
      status: 'Success',
      text: 'Запись успешно изменена!'
    }
  }
  else {
    return {
      status: 'Error',
      text: 'Полная стоимость контракта меньше чем по Обеспечению!'
    }
  }
}

function checkProvisionTime(id, cost){

  var provision = openDocument(FILEID.provision, 'Разработка'),
      tableProvision = provision.getDataRange().getValues(),
      i = 0,
      total_cost = 0,
      total_time = 0;

  for(i = 0; i < tableProvision.length; i++){
    if(id == tableProvision[i][0]) {
      total_cost += tableProvision[i][3];
      total_time += tableProvision[i][2];
    }
  }

  return Math.abs(total_cost) <= Math.abs(cost);
}

/*
  Редактирование и удаление обеспечения контрактов
  ------------------------------------------------
*/

function getProvisionTable(_mode){
  EM.mode = _mode;
  var sheet = openDocument(FILEID.provision, EM.mode),
      value = sheet.getDataRange().getValues(),
      table_value = createProvisionModel(value);

  return JSON.stringify(table_value.sort(compareStr));
}

/**
* Создание объекта таблицы для отображения
*/
function createProvisionModel(data) {
  var i = 0,
      result = [],
      contract = openDocument(FILEID.contract, mode).getDataRange().getValues(),
      project = openDocument(FILEID.project, mode).getDataRange().getValues();
  
  for(i = 1; i < data.length; i++){
    result.push({
      contract_id: data[i][0],
      project_id: data[i][1],
      name: getName(data[i][0], contract),
      project: getName(data[i][1], project),
      time: data[i][2],
      cost: data[i][3],
      row: i + 1
    });
  }

  return result;
}

function saveProvision(data){

  var provision = openDocument(FILEID.provision, EM.mode),
      contract = openDocument(FILEID.contract, EM.mode),
      provision_table = provision.getDataRange().getValues(),
      contract_table = contract.getDataRange().getValues();

  if (checkExcessTime(data.time, data.contract_id, provision_table, EM.mode, data.row-1)) {
    return {
      status: 'Error',
      text: MESSAGE.excessTime
    }
  }
  else if (checkExcessCost(data.cost, data.contract_id, provision_table, EM.mode, data.row-1)) {
    return {
      status: 'Error',
      text: MESSAGE.excessCost
    }
  }
  else {
    provision.getRange(data.row, 1, 1, 4).setValues([[data.contract_id, data.project_id, data.time, data.cost]]);

    return {
      status: 'Success',
      text: 'Запись успешно изменена'
    }
  }
}

//function removeRow(data){
//   var sheet = openDocument(FILEID.provision, EM.mode);
//   sheet.deleteRow(data.row);
//
//  return {
//    status: 'Success',
//    text: 'Запись успешно удалена!'
//  }
//}

//function getName(id, file){
//  var table = openDocument(FILEID[file], mode).getDataRange().getValues(),
//      i = 0;
//
//  for(i = 0; i < table.length; i++) {
//    if(table[i][0] == id){
//      return table[i][1];
//    }
//  }
//  return 'empty';
//}


/*
  Редактирование и просмотр ЗП сотрудников
  ----------------------------------------
*/

function getPaymentTable(_mode) {

  EM.mode = _mode
  var sheet = openDocument(FILEID.payment, EM.mode),
      value = sheet.getDataRange().getValues(),
      table_value = createPaymentModel(value);

  return table_value.sort(compareStr);
}

function savePayment(data) {

  var sheet = openDocument(FILEID.payment, data.mode);

  sheet.getRange(data.row, 2, 1, 2).setValues([[data.white_pay, +data.gray_pay]]);

  return 'Зарплата изменена!';
}

/**
* Создание объекта таблицы для отображения
*/
function createPaymentModel(data) {
  var i = 0,
      result = [],
      curDate = new Date(),
      employees = openDocument(FILEID.employee, EM.mode).getDataRange().getValues(),
      wDaysTable = openDocument(FILEID.workDays, curDate.getFullYear()).getDataRange().getValues();
      
  for(i = 1; i < data.length; i++){
    if(data[i][3]) {
      result.push({
          id: data[i][0],
          name: getEmployeeName(data[i][0], employees),
          white_pay: data[i][1],
          gray_pay: data[i][2],
          ante: getCurrentAnte(data[i][1], data[i][2], wDaysTable),
          row: i + 1,
      });
    }
  }

  return result;
}

function getEmployeeName(id, table) {
  for(var i = 0; i < table.length; i++) {
    if(table[i][0] == id) {
      return table[i][1];
    }
  }
}

function getCurrentAnte(w_pay, g_pay, wDaysTable) {

  var date = new Date(),
      month = date.getMonth(),
      
      w_days = wDaysTable[month + 1][1];

  return (w_pay + g_pay) / (w_days * 8);
}

function getPremiumTable(_mode) {

  EM.mode = _mode;
  var sheet = openDocument(FILEID.premium, EM.mode),
      value = sheet.getDataRange().getValues(),
      table_value = createPremiumModel(value);

  return JSON.stringify(table_value.sort(compareStr));
}

function createPremiumModel(data) {

  var i = 0,
      result = [],
      prjV = openDocument(FILEID.project, EM.mode).getDataRange().getValues(),
      depV = openDocument(FILEID.department, EM.mode).getDataRange().getValues(),
      empV = openDocument(FILEID.employee, EM.mode).getDataRange().getValues();

  data.forEach(function(row, i, value){

    if(row[6] && i != 0) {
      result.push({
          id: row[0],
          name: getName(row[2], empV),
          dep_name: getName(row[1], depV),
          project_name: getName(row[3], prjV),
          project_id: row[3],
          month: row[4],
          premium: row[5],
          row: i + 1
      });
    }
  });

  return result;
}

function savePremium(data){

  var sheet = openDocument(FILEID.premium, data.mode);

  sheet.getRange(data.row, 4, 1, 3).setValues([[data.project_id, data.month,  data.premium]]);

  return {
    type: 'Success',
    text: 'Запись успешно изменена'
  }
}