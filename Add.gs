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
    return {
      status: 'error',
      field: 'name',
      text: MESSAGE.overlap_dep
    };
  } 
  else if(depForm.name == '') {
    return {
      status: 'error',
      field: 'name',
      text: MESSAGE.empty_dep
    };
  } 
  else { 
    sheet.getRange(sheet.getLastRow()+1, 1, 1, 3).setValues([[depForm.id, depForm.name, true]]);
    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('@');
    sheet.getRange(1, 7).setValue(depForm.id);
    return {
      status: 'Success',
      text: MESSAGE.success
    }
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
    return {
      status: 'error',
      text: MESSAGE.empty_empl,
      field: 'name'
    }; 
  } 
  else if(employeeInfo.phone == '' || !checkPhone(employeeInfo.phone)) {
    return {
      status: 'error',
      text: MESSAGE.wrong_phone,
      field: 'phone'
    };
  } 
  else if(employeeInfo.department == 'opt') {
    return {
      status: 'error',
      text: MESSAGE.choose_dep,
      field: 'department'
    };
  } 
  else {
    
    employees.getRange(employees.getLastRow()+1, 1, 1, 5).setValues(
      [[employeeInfo.id, employeeInfo.name, employeeInfo.phone, employeeInfo.department, 'Работает']]
    );
    employees.getRange(employees.getLastRow(), 2).setNumberFormat('@');
    employees.getRange(1,9).setValue(employeeInfo.id);
    
    return {
      status: 'Success',
      text: MESSAGE.success,
    };
  }
}

/**
 Добавление записи о ЗП
*/
function addPayment(paymentInfo) {
  var ss = SpreadsheetApp.openById(FILEID.payment),
      paymentSheet = ss.getSheetByName(paymentInfo.mode);

  
  if(paymentInfo.employee == 'opt') {
    return {
      status: 'error',
      text: MESSAGE.choose_empl,
      field: 'employee'
    };
  } 
  else if(!paymentInfo.whitePay) {
    return {
      status: 'error',
      text: MESSAGE.empty_wpay,
      field: 'whitePay'
    };
  } 
  else if(!paymentInfo.grayPay) {
    return {
      status: 'error',
      text: MESSAGE.empty_gpay,
      field: 'grayPay'
    };
  }
  else if(checkExistence(paymentInfo.employee, paymentSheet, paymentInfo.whitePay, paymentInfo.grayPay)){
    return {
      status: 'Success',
      text: 'ЗП сотрудника изменена!'
    };
  } 
  else {
    
    paymentSheet.getRange(paymentSheet.getLastRow()+1, 1, 1, 4).setValues(
      [[paymentInfo.employee, paymentInfo.whitePay, paymentInfo.grayPay, true]]
    );
    paymentSheet.getRange(paymentSheet.getLastRow(), 2, 1, 2).setNumberFormats(FORMAT);
    
    return {
      status: 'Success',
      text: 'Запись успешно добавлена!'
    };
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
    return {
      status: 'error',
      text: MESSAGE.choose_prj,
      field: 'project'
    };
  } 
  else if(!checkDate(workTimeInfo.dateFrom)) {
    return {
      status: 'error',
      text: MESSAGE.wrong_dfrom,
      field: 'dateFrom'
    };
  } 
  else if(!checkDate(workTimeInfo.dateTo)) {
    return {
      status: 'error',
      text: MESSAGE.wrong_dto,
      field: 'dateTo'
    }
  } 
  else if(!compareDatesWtime(workTimeInfo.dateFrom, workTimeInfo.dateTo)) {
    return {
      status: 'error',
      text: MESSAGE.overlap_date,
      field: 'dateTo'
    };
  } 
  else if(workTimeInfo.department == 'opt') {
    return {
      status: 'error',
      text: MESSAGE.choose_dep,
      field: 'department'
    };
  } 
  else if(workTimeInfo.employee == 'opt') {
    return {
      status: 'error',
      text: MESSAGE.choose_empl,
      field: 'employee'
    };
  } 
  else if(!workTimeInfo.spendTime) {
    return {
      status: 'error',
      text: MESSAGE.empty_time,
      field: 'spendTime'
    };
  } 
  else {
    
    workTime.getRange(workTime.getLastRow()+1, 1, 1, 7).setValues(
      [[workTimeInfo.id, workTimeInfo.project, workTimeInfo.dateFrom, workTimeInfo.dateTo, workTimeInfo.department, workTimeInfo.employee, workTimeInfo.spendTime]]
    );
    workTime.getRange(workTime.getLastRow(), 7).setNumberFormat('0.0');
    workTime.getRange(1, 10).setValue(workTimeInfo.id);
    workTime.getRange(workTime.getLastRow(), 8).setValue(true);
    
    return {
      status: 'Success',
      text: 'Запись успешно добавлена'
    }
  }
}

function addProject(projectInfo) {
  var sheet = openDocument(FILEID.project, projectInfo.mode),
      value = sheet.getDataRange().getValues();
      
  projectInfo.name = cleanStr(projectInfo.name);
  projectInfo.id = value[0][8] + 1;
  
  if(projectInfo.name == '') {
    return {
      status: 'error',
      text: MESSAGE.empty_prj,
      field: 'name'
    };
  }
  else if(checkOverlap(projectInfo.name, value)) {
    return {
      status: 'error',
      field: 'name',
      text: MESSAGE.overlap_prj
    };
  }
  else if(!projectInfo.dateFrom) {
    return {
      status: 'error',
      field: 'dateFrom',
      text: MESSAGE.empty_dfrom
    };
  }
  else if(projectInfo.dateTo && !compareDates(projectInfo.dateFrom, projectInfo.dateTo)) {
    return {
      status: 'error',
      field: 'dateTo',
      text: MESSAGE.overlap_date
    };
  }
  else {
    sheet.getRange(sheet.getLastRow()+1, 1, 1, 5).setValues(
      [[projectInfo.id, projectInfo.name, projectInfo.dateFrom, projectInfo.dateTo, true]]
    );
    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('@');
    sheet.getRange(1, 9).setValue(projectInfo.id);
    
    return {
      status: 'Success',
      text: 'Запись успешно добавлена'
    };
  }  
}

/*
  Добавление договора
*/
function addContract(contractInfo){
  var ss = SpreadsheetApp.openById(FILEID.contract);
  var sheet = ss.getSheetByName(contractInfo.mode);
  var value = sheet.getDataRange().getValues(),
      cellsFormat = [
        ['##0', '@', '@', '@', '##0', '@', '0.0', '0.00', 'dd.mm.yyyy', 'dd.mm.yyyy', '@']
      ];

  contractInfo.ncontract = cleanStr(contractInfo.ncontract);
  contractInfo.id = value[0][13]+1;
  
  
  if(contractInfo.name == '' ) {
    return {
      status: 'error',
      text: 'Введите название договора',
      field: 'name'
    };
  }
  else if(contractInfo.ncontract == '' ) {
    return {
      status: 'error',
      text:  MESSAGE.empty_contr,
      field: 'ncontract'
    };
  } 
  else if(checkOverlap(contractInfo.name, value)) {
    return {
      status: 'error',
      text:  MESSAGE.overlap_contr,
      field: 'name'
    }; 
  } 
  else if(contractInfo.type == 'opt') {
    return {
      status: 'error',
      text: MESSAGE.choose_type,
      field: 'type'
    };  
  } 
  else if(contractInfo.status == 'opt') {
    return {
      status: 'error',
      text: MESSAGE.choose_status,
      field: 'status'
    };  
  } 
  else if(!contractInfo.planTime) {
    return {
      status: 'error',
      text: MESSAGE.empty_planTime,
      field: 'planTime'
    }; 
  } 
  else if(!contractInfo.fullCost) {
    return {
      status: 'error',
      text: MESSAGE.empty_fullCost,
      field: 'fullCost'
    }; 
  } 
  else if(!contractInfo.dateFrom) {
    return {
      status: 'error',
      text: MESSAGE.wrong_dfrom,
      field: 'dateFrom'
    };
  } 
  else if(!contractInfo.dateTo) {
    return {
      status: 'error',
      text: MESSAGE.wrong_dto,
      field: 'dateTo'
    };
  } 
  else if(compareDates(contractInfo.dateFrom, contractInfo.dateTo)) {
    return {
      status: 'error',
      text: MESSAGE.overlap_date,
      field: 'dateTo'
    };
  } 
  else {
    Logger.log(contractInfo.project);
    
    sheet.getRange(sheet.getLastRow()+1, 1, 1, 11).setValues(
      [[
        contractInfo.id,
        contractInfo.name,
        contractInfo.ncontract, 
        contractInfo.organization, 
        contractInfo.type,
        contractInfo.status, 
        contractInfo.planTime * 1, 
        contractInfo.fullCost,
        contractInfo.dateFrom, 
        contractInfo.dateTo, 
        contractInfo.document
      ]]
    );
    
    sheet.getRange(sheet.getLastRow(), 1, 1, 11).setNumberFormats(cellsFormat);
    sheet.getRange(1, 14).setValue(contractInfo.id);
    if(contractInfo.project != 'opt') {
      Logger.log('2');

      addProvision({
        mode: contractInfo.mode,
        ncontract: contractInfo.id, 
        projectId: contractInfo.project, 
        planTime: contractInfo.planTime * 1, 
        projectCost: contractInfo.fullCost,
      });
    }
    
    return {
      status: 'Success',
      text: 'Запись успешно добавлена'
    }
  } 
}

function checkOverlapConract(name, value) {
  for(var i = 0; i < value.length; i++) {
    if(name.toLowerCase() == value[i][2].toLowerCase()) {
      return true;
    }
  }
  return false;
}

/*
  Обеспечение договоров
*/
function addProvision(provisionInfo){
  Logger.log(provisionInfo);
  var ss = SpreadsheetApp.openById(FILEID.provision);
  var sheet = ss.getSheetByName(provisionInfo.mode);
  var value = sheet.getDataRange().getValues(),
      cellsFormat = [
        ['@', '@', '0.0', '0.00']
      ];

//  provisionInfo.ncontract = cleanStr(provisionInfo.ncontract);
//  provisionInfo.contractId = getId(provisionInfo.ncontract, provisionInfo.mode);
  
//  Logger.log(checkExcess(provisionInfo.planTime, provisionInfo.ncontract, value, provisionInfo.mode));
  
  if(provisionInfo.ncontract == 'opt'){
    return {
      status: 'error',
      text: MESSAGE.empty_contr,
      field: 'ncontract'
    };
  } 
  else if(provisionInfo.projectId == 'opt'){
    return {
      status: 'error',
      text: MESSAGE.choose_prj,
      field: 'project'
    };
  } 
  else if(!provisionInfo.planTime){
    return {
      status: 'error',
      text: MESSAGE.empty_planTime,
      field: 'planTime'
    };
  } 
  else if(checkExcessTime(provisionInfo.planTime, provisionInfo.ncontract, value, provisionInfo.mode)){
    return {
      status: 'error',
      text: MESSAGE.excess_time,
      field: 'planTime'
    };
  } 
  else if(!provisionInfo.projectCost){
    return {
      status: 'error',
      text: MESSAGE.empty_projectCost,
      field: 'projectCost'
    };
  } 
  else if(checkExcessCost(provisionInfo.projectCost, provisionInfo.ncontract, value, provisionInfo.mode)){
    return {
      status: 'error',
      text: MESSAGE.excess_cost,
      field: 'projectCost'
    };
  } 
  else {
    
     sheet.getRange(sheet.getLastRow()+1, 1, 1, 4).setValues(
      [[
        provisionInfo.ncontract, 
        provisionInfo.projectId, 
        provisionInfo.planTime * 1, 
        provisionInfo.projectCost,
      ]]
    );
    sheet.getRange(sheet.getLastRow(), 1, 1, 4).setNumberFormats(cellsFormat);
    
    return {
      status: 'Success',
      text: 'Запись успешно добавлена!'
    };
  } 
}

/*
  Получение id договора, для последующей работы с договорами
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
 Проверка на наличие договора
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
  
  Logger.log(planTime + ' -- ' + factTime + ' + ' + provisionTime);
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
      Logger.log(contractValue[i]);
      time = contractValue[i][6];
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
  
  var i = 0, 
      planCost = 0, 
      factCost = 0, 
      diff;
  
  planCost = Math.abs(getPlanCost(ncontract, mode));
  factCost = getFactCost(ncontract, provisionValue, row);
  
//  Logger.log(planCost + ' -- ' + factCost);
  return (planCost < (factCost + (+provisionCost)));
}

function getPlanCost(contractId, mode){
  var ss = SpreadsheetApp.openById(FILEID.contract),
      sheet = ss.getSheetByName(mode),
      contractValue = sheet.getDataRange().getValues(),
      cost = 0;
  
  for(i = 1; i < contractValue.length; i++){
    if(contractId == contractValue[i][0]){
      cost = contractValue[i][7];
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

//function getList(mode, type, depID){
//  var ss = SpreadsheetApp.openById(FILEID[type]),
//      tableValue = ss.getSheetByName(mode).getDataRange().getValues(),
//      list = [];
//  
//  if(type == 'employee'){
//    for(var i = 1; i < tableValue.length; i++) {
//      if(tableValue[i][3] == depID){
//        list.push({id: tableValue[i][0], name: tableValue[i][1]});
//      }
//    }
//  } else {
//    for(var i = 1; i < tableValue.length; i++) {
//      if(tableValue[i][4]) {
//        list.push({id: tableValue[i][0], name: tableValue[i][1]});
//      }
//    }
//  }
//
//  return list.sort(compareStr);
//}


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

function addPremium(data) {
  Logger.log(data);
  
  var premiumInfo = JSON.parse(data),
      premium = openDocument(FILEID.premium, premiumInfo.mode),
      value = premium.getDataRange().getValues(),
      defOption = 'opt';
      
  premiumInfo.id = value[0][8] + 1;
  
  if(premiumInfo.department == defOption) {
    return {
      status: 'error',
      text: MESSAGE.choose_dep,
      field: 'department'
    };
  }
  else if(premiumInfo.employee == defOption) {
    return {
      status: 'error',
      text: MESSAGE.choose_empl,
      field: 'employee'
    };
  }
  else if(premiumInfo.project == defOption) {
    return {
      status: 'error',
      text: MESSAGE.choose_prj,
      field: 'project'
    }; 
  }
  else if(!premiumInfo.monthDate) {
    return {
      status: 'error',
      text: MESSAGE.choose_month,
      field: 'month'
    };
  }
  else if(!premiumInfo.premium || Object.prototype.toString.call(+premiumInfo.premium) !== '[object Number]') {
    return {
      status: 'error',
      text: MESSAGE.empty_premium,
      field: 'premium'
    }; 
  }
  else {
//    Logger.log(formatDate(premiumInfo.monthDate));  
//    premiumInfo.month = new Date(premiumInfo.month);
//    Logger.log(premiumInfo.month);
    premium.getRange(premium.getLastRow()+1, 1, 1, 6).setValues(
      [[
        premiumInfo.id, 
        premiumInfo.department, 
        premiumInfo.employee, 
        premiumInfo.project, 
        premiumInfo.monthText,
        premiumInfo.premium
      ]]
    );
    premium.getRange(premium.getLastRow(), 5, 1, 2).setNumberFormats([['dd.mm.yyyy', '0.00']]);
    premium.getRange(1, 9).setValue(premiumInfo.id);
    premium.getRange(premium.getLastRow(), 7).setValue(true);
    
    return {
      status: 'Success',
      text: 'Запись успешно добавлена!'
    }
  }
}
