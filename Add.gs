EM = {};
/**
` Добавление департамента с формы в таблицу "Отдел" (Создание отдела)
  -------------------------------------------------------------------
*/
function createDepartment(depForm) { 
  EM.department = EM.department || openDocument(FILEID.department, depForm.mode);

  var sheet = EM.department,
      value = sheet.getDataRange().getValues();
  
  depForm.name = cleanStr(depForm.name);
  depForm.id = value[0][6]+1;
  
  if(checkOverlap(depForm.name, value)) {
    return MESSAGE.overlap_dep;
  } 
  else if(depForm.name == '') {
    return MESSAGE.empty_dep;
  } 
  else { 
    sheet.getRange(sheet.getLastRow()+1, 1, 1, 3).setValues([[depForm.id, depForm.name, true]]);
    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('@');
    sheet.getRange(1, 7).setValue(depForm.id);
    return MESSAGE.success;
  }
}

/**
`Добавление департамента с формы в таблицу "Отдел" (Создание отдела)
*/
function addEmployee(employeeForm) {
  try{
    var ss = SpreadsheetApp.openById(FILEID.employee);
  } catch (e){
    return e.name;
  }
  var employees = ss.getSheetByName(employeeForm.mode);
  var value = employees.getDataRange().getValues();

  var employeeInfo = {
    id: value[0][8] + 1,
    name: cleanStr(employeeForm.name),
    phone: cleanStr(employeeForm.phone),
    department: employeeForm.department,
  }; 
  
  if(employeeInfo.name == '') {
    return MESSAGE.empty_empl;
  } 
  else if(employeeInfo.phone == '' || !checkPhone(employeeInfo.phone)) {
    return MESSAGE.wrong_phone;
  } 
  else if(employeeInfo.department == 'opt') {
    return MESSAGE.choose_dep;
  } 
  else {
    
    employees.getRange(employees.getLastRow()+1, 1, 1, 5).setValues(
      [[employeeInfo.id, employeeInfo.name, employeeInfo.phone, employeeInfo.department, true]]
    );
    employees.getRange(employees.getLastRow(), 2).setNumberFormat('@');
    employees.getRange(1,9).setValue(employeeInfo.id);
    
    return MESSAGE.success;
  }
}

/**
 Добавление записи о ЗП
*/
function addPayment(paymentInfo) {
  var ss = SpreadsheetApp.openById(FILEID.payment),
      paymentSheet = ss.getSheetByName(paymentInfo.mode);

  
  if(paymentInfo.employee == 'opt') {
    return MESSAGE.choose_empl;
  } 
  else if(!paymentInfo.whitePay) {
    return MESSAGE.empty_wpay;
  } 
  else if(!paymentInfo.grayPay) {
    return MESSAGE.empty_gpay;
  }
  else if(checkExistence(paymentInfo.employee, paymentSheet, paymentInfo.whitePay, paymentInfo.grayPay)){
    return 'ЗП сотрудника изменена!';
  } 
  else {
    
    paymentSheet.getRange(paymentSheet.getLastRow()+1, 1, 1, 4).setValues(
      [[paymentInfo.employee, paymentInfo.whitePay, paymentInfo.grayPay, true]]
    );
    paymentSheet.getRange(paymentSheet.getLastRow(), 2, 1, 2).setNumberFormats(FORMAT);
    
    return MESSAGE.success;
  }

}

function checkExistence(id, sheet, wPay, gPay){
  var value = sheet.getDataRange().getValues(),
      i = 0;
  
  for(i = 0; i < value.length; i++){
    Logger.log(value[i][0]);
    if(value[i][0] == id) {
      sheet.getRange(i + 1, 2, 1, 2).setValues(
        [[wPay, gPay]]
      );
      sheet.getRange(i + 1, 2, 1, 2).setNumberFormats(FORMAT);
      return true;
    }
  }

  return false;
}

/**
 Добавление записи о трудозатратах по проекту
*/
function addWorkTime(workTimeInfo) {
  var workTime = openDocument(FILEID.workTime, workTimeInfo.mode);
  var value = workTime.getDataRange().getValues();
  
  workTimeInfo.id = value[0][9] + 1;
  
  if(workTimeInfo.project == 'opt') {
    return MESSAGE.choose_prj;
  } 
  else if(!checkDate(workTimeInfo.dateFrom)) {
    return MESSAGE.wrong_dfrom;
  } 
  else if(!checkDate(workTimeInfo.dateTo)) {
    return MESSAGE.wrong_dto;
  } 
  else if(!compareDatesWtime(workTimeInfo.dateFrom, workTimeInfo.dateTo)) {
    return MESSAGE.overlap_date;
  } 
  else if(workTimeInfo.department == 'opt') {
    return MESSAGE.choose_dep;
  } 
  else if(workTimeInfo.employee == 'opt') {
    return MESSAGE.choose_empl;
  } 
  else if(!workTimeInfo.spendTime) {
    return MESSAGE.empty_time;
  } 
  else {
    
    workTime.getRange(workTime.getLastRow()+1, 1, 1, 7).setValues(
      [[workTimeInfo.id, workTimeInfo.project, workTimeInfo.dateFrom, workTimeInfo.dateTo, workTimeInfo.department, workTimeInfo.employee, workTimeInfo.spendTime]]
    );
    workTime.getRange(workTime.getLastRow(), 7).setNumberFormat('0.0');
    workTime.getRange(1, 10).setValue(workTimeInfo.id);
    workTime.getRange(workTime.getLastRow(), 8).setValue(true);
    return MESSAGE.success;
  }
}

function addProject(projectInfo) {
  var sheet = openDocument(FILEID.project, projectInfo.mode),
      value = sheet.getDataRange().getValues();
      
  projectInfo.name = cleanStr(projectInfo.name);
  projectInfo.id = value[0][8] + 1;
  
  if(projectInfo.name == '') {
    return MESSAGE.empty_prj;
  }
  else if(checkOverlap(projectInfo.name, value)) {
    return MESSAGE.overlap_prj;
  }
  else if(!projectInfo.dateFrom) {
    return MESSAGE.empty_dfrom;
  }
  else if(projectInfo.dateTo && !compareDates(projectInfo.dateFrom, projectInfo.dateTo)) {
    return MESSAGE.overlap_date;
  }
  else {
    sheet.getRange(sheet.getLastRow()+1, 1, 1, 5).setValues(
      [[projectInfo.id, projectInfo.name, projectInfo.dateFrom, projectInfo.dateTo, true]]
    );
    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('@');
    sheet.getRange(1, 9).setValue(projectInfo.id);
    
    return MESSAGE.success;
  }  
}

/*
  Добавление контракта
*/
function addContract(contractInfo){
  var ss = SpreadsheetApp.openById(FILEID.contract);
  var sheet = ss.getSheetByName(contractInfo.mode);
  var value = sheet.getDataRange().getValues(),
      cellsFormat = [
        ['##0', '@', '@', '@', '0.0', '0.00', 'dd.mm.yyyy', 'dd.mm.yyyy', '@']
      ];

  contractInfo.ncontract = cleanStr(contractInfo.ncontract);
  contractInfo.id = value[0][11]+1;
  
  if(contractInfo.ncontract == '' ) {
    return MESSAGE.empty_contr;
  } 
  else if(checkOverlap(contractInfo.ncontract, value)) {
    return  MESSAGE.overlap_contr;
  } 
  else if(contractInfo.type == 'opt') {
    return  MESSAGE.choose_type;
  } 
  else if(contractInfo.status == 'opt') {
    return  MESSAGE.choose_status;
  } 
  else if(!contractInfo.planTime) {
    return MESSAGE.empty_planTime;
  } 
  else if(!contractInfo.fullCost) {
    return MESSAGE.empty_fullCost;
  } 
  else if(!contractInfo.dateFrom) {
    return MESSAGE.wrong_dfrom;
  } 
  else if(!contractInfo.dateTo) {
    return MESSAGE.wrong_dto;
  } 
  else if(compareDates(contractInfo.dateFrom, contractInfo.dateTo)) {
    return MESSAGE.overlap_date;
  } 
  else {
    
    sheet.getRange(sheet.getLastRow()+1, 1, 1, 9).setValues(
      [[
        contractInfo.id,
        contractInfo.ncontract, 
        contractInfo.organization, 
        contractInfo.status, 
        contractInfo.planTime * 1, 
        contractInfo.fullCost * contractInfo.type, 
        contractInfo.dateFrom, 
        contractInfo.dateTo, 
        contractInfo.document
      ]]
    );
    
    sheet.getRange(sheet.getLastRow(), 1, 1, 9).setNumberFormats(cellsFormat);
    sheet.getRange(1, 12).setValue(contractInfo.id);
    
    return MESSAGE.success;
  } 
}

/*
  Обеспечение контрактов
*/
function addProvision(provisionInfo){
  var ss = SpreadsheetApp.openById(FILEID.provision);
  var sheet = ss.getSheetByName(provisionInfo.mode);
  var value = sheet.getDataRange().getValues(),
      cellsFormat = [
        ['@', '@', '0.0', '0.00']
      ];

//  provisionInfo.ncontract = cleanStr(provisionInfo.ncontract);
//  provisionInfo.contractId = getId(provisionInfo.ncontract, provisionInfo.mode);
  
//  Logger.log(checkExcess(provisionInfo.planTime, provisionInfo.ncontract, value, provisionInfo.mode));
  
  if(provisionInfo.ncontract == ''){
    return MESSAGE.empty_contr;
  } else if(provisionInfo.projectId == 'opt'){
    return MESSAGE.choose_prj;
  } else if(!provisionInfo.planTime){
    return  MESSAGE.empty_planTime;
  } else if(checkExcessTime(provisionInfo.planTime, provisionInfo.ncontract, value, provisionInfo.mode)){
    return  MESSAGE.excess_time;
  } else if(!provisionInfo.projectCost){
    return MESSAGE.empty_projectCost;
  } else if(checkExcessCost(provisionInfo.projectCost, provisionInfo.ncontract, value, provisionInfo.mode)){
    return  MESSAGE.excess_cost;
  } else {
    
     sheet.getRange(sheet.getLastRow()+1, 1, 1, 4).setValues(
      [[
        provisionInfo.ncontract, 
        provisionInfo.projectId, 
        provisionInfo.planTime * 1, 
        provisionInfo.projectCost,
      ]]
    );
    sheet.getRange(sheet.getLastRow(), 1, 1, 4).setNumberFormats(cellsFormat);
    
    return MESSAGE.success;
  } 
}

/*
  Получение id контракта, для последующей работы с контрактами
*/
function getId(n, mode) {
  var ss = SpreadsheetApp.openById(FILEID.contract);
  var sheet = ss.getSheetByName(mode);
  var value = sheet.getDataRange().getValues(),
      i, id = false;
  
  for(i = 1; i < value.length; i++) {
    if(n == value[i][1]){
      id = value[i][0];
    }
  }
  return id;
}

/**
 Проверка на наличие контракта
*/
function checkExistance(ncontract, mode) {
  var ss = SpreadsheetApp.openById(FILEID.contract);
  var sheet = ss.getSheetByName(mode);
  var value = sheet.getDataRange().getValues(),
      i;
  
  for(i = 1; i < value.length; i++) {
    if(ncontract == value[i][1]) return true;
  }
  return false;
}

/*
  Проверка на превышение планируемых трудозатрат
*/
function checkExcessTime(provisionTime, ncontract, provisionValue, mode, row) {
  
  var i, planTime = 0, factTime = 0, diff;
  Logger.log([provisionTime, ncontract, provisionValue, mode]);
  
  planTime = getPlanTime(ncontract, mode);
  factTime = getFactTime(ncontract, provisionValue, row);
  
//  Logger.log(planTime + ' -- ' + factTime);
  diff = (planTime - (factTime + (+provisionTime)));
  Logger.log(diff);
  return (diff < 0);
}

function getPlanTime(contractId, mode) {
  var ss = SpreadsheetApp.openById(FILEID.contract);
  var sheet = ss.getSheetByName(mode);
  var contractValue = sheet.getDataRange().getValues();
  
  var time = 0;
  
  for(i = 1; i < contractValue.length; i++){
    if(contractId == contractValue[i][0]){
      time = contractValue[i][4];
    }
  }
  
  return time;
}

function getFactTime(ncontract, value, row) {
  
  var time = 0;
  
  for(i = 1; i < value.length; i++){
    if(ncontract == value[i][0] && i !== row){
      time += value[i][2];
    }
  }
  
  return time;
}

function checkExcessCost(provisionCost, ncontract, provisionValue, mode, row){
  
  var i, planCost = 0, factCost = 0, diff;
  
  planCost = Math.abs(getPlanCost(ncontract, mode));
  factCost = getFactCost(ncontract, provisionValue, row);
  
  Logger.log(planCost + ' -- ' + factCost);
  return (planCost < (factCost + (+provisionCost)));
}

function getPlanCost(contractId, mode){
  var ss = SpreadsheetApp.openById(FILEID.contract);
  var sheet = ss.getSheetByName(mode);
  var contractValue = sheet.getDataRange().getValues();
  
  var cost = 0;
  
  for(i = 1; i < contractValue.length; i++){
    if(contractId == contractValue[i][0]){
      cost = contractValue[i][5];
    }
  }
  
  return cost;
}

function getFactCost(ncontract, value, row){
    
  var cost = 0;
  
  for(i = 1; i < value.length; i++){
    if(ncontract == value[i][0]  && i !== row){
      cost += value[i][3];
    }
  }
  
  return cost;
}

function getList(mode, type, depID){
  var ss = SpreadsheetApp.openById(FILEID[type]);
  var tableValue = ss.getSheetByName(mode).getDataRange().getValues();
  var list = [];
  
  if(type == 'employee'){
    for(var i = 1; i < tableValue.length; i++) {
      if(tableValue[i][3] == depID){
        list.push({id: tableValue[i][0], name: tableValue[i][1]});
      }
    }
  } else {
    for(var i = 1; i < tableValue.length; i++) {
      if(tableValue[i][4]) {
        list.push({id: tableValue[i][0], name: tableValue[i][1]});
      }
    }
  }

  return list.sort(compareStr);
}


/*
  Добавление и редактирование количества рабочих дней
*/
function addDaysCount(info) {
  Logger.log(info.year);
  if(info.year < 2017 || info.year > 2099 ) {
    return MESSAGE.year;
  }
  
  var ss = SpreadsheetApp.openById(FILEID.workDays),
      sheet = ss.getSheetByName(info.year);
  
  if(info.count > 31 || info.count < 0 ) {
    return MESSAGE.count;
  } 
  else { 
    sheet.getRange(+info.id + 1, 2).setValue(info.count);
    return MESSAGE.success;
  }
}

function getData(year) {
  Logger.log(year);
  if(year < 2017 || year > 2099 ) {
    return 'error';
  }
  var ss = SpreadsheetApp.openById(FILEID.workDays),
    sheet = ss.getSheetByName(year),
    value = sheet.getDataRange().getValues(),
    month = ['','Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
    data = [],
    i = 0;
  
  for(i = 1; i < value.length; i++) {
    data.push([value[i][0], month[i], value[i][1]]);
  }
  
  return data;  
}



