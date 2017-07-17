'use strict';
var MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function getDataForReport(data){

  var report_info = JSON.parse(data);

  if(!report_info.monthFrom){
    return {
      type: 'error',
      value: MESSAGE.empty_dfrom
    };
  } else if(!report_info.monthTo){
    return {
      type: 'error',
      value: MESSAGE.empty_dto
    };
  } else if(!compareDates(report_info.monthFrom, report_info.monthTo)){
    return {
      type: 'error',
      value: MESSAGE.overlap_date
    };
  }

  var workTime = openDocument(FILEID.workTime, 'Разработка'),
      project = openDocument(FILEID.project, 'Разработка'),
      workTimeValue = workTime.getDataRange().getValues(),
      projectValue = project.getDataRange().getValues(),


      allDepartments = getDepartments(),
      allEmployees = getEmployees(allDepartments),
      allProjects = getProjects(projectValue),

      sum_hours = 0,
      sum_pay = 0,
      sum_outlay = 0,
      total_outlay = 0,
      total_hours = 0,
      total_pay = 0,
      dep_hours = 0,
      dep_pay = 0,
      dep_outlay = 0,
      report = [],

      periods = getPeriods(report_info.monthFrom, report_info.monthTo),
      result = [],
      departments = [],
      employees = [],
      projects = [],
      total_projects = {},
      sorted_total_projects = {},
      range,
      format = {
        deps: [],
        emps: [],
        mths: [],
        prjs: [['@', '0.0', '0.00', '0.00']]
      };

//      Logger.log(allProjects);
//      Logger.log(allEmployees);

  if(report_info.depId == 'opt') {
     departments = allDepartments.sort(compareStr);
  } else {
    departments[0] = {
      id: report_info.depId,
      name: getNameRep(report_info.depId, allDepartments)
    };
  }

  var ssNew = SpreadsheetApp.create("Report"),
      sheet = ssNew.getSheets()[0];

  range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,4);
  range.setValues([['Отчет по сотрудникам и отделам', 'За период:', report_info.fromTxt, report_info.toTxt]]);

  for(var i = 0; i < departments.length; i++){
    range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,7);
    range.setValues([[departments[i].name, '', '', '', '', '', '']]);
    range.setBackground('#C0C0C0');
    range.merge();
    range.setFontWeight("bold");

    dep_hours = 0;
    dep_pay = 0;
    dep_outlay = 0;

    if(report_info.emplId == 'opt'){
      employees = getEmployeesByDep(departments[i].id, allEmployees);

      employees = employees.sort(compareStr);
    } else {
      employees[0] = {
        id: report_info.emplId,
        name: getNameRep(report_info.emplId, allEmployees)
      };
    }
    Logger.log(employees);
    for(var j = 0; j < employees.length; j++){

      range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,4);
      range.setValues([[employees[j].name, '', '', '', '', '', '']]);
      range.setBackground('#B0E0E6');
      range.merge();
      range.setHorizontalAlignment("center");
      range.setFontWeight("bold");


      sum_hours = 0;
      sum_pay = 0;
      sum_outlay = 0;

      for(var k = 0; k < periods.length; k++){
        range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,7);
        range.setValues([[periods[k].name, '', '', '', '', '', '']]);
        range.setBackground('#FFF8DC');
        range.merge();
        range.setHorizontalAlignment("center");
        range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,7);
        range.setValues([['', 'Трудозатраты', 'ЗП белая', 'ЗП серая', 'ЗП белая(факт)', 'ЗП серая(факт)', 'Премия', 'Налоги']]);

        total_projects = getProjectsByEmployee(employees[j].id, departments[i].id,  periods[k].date, valueWork, allProjects);
        sorted_total_projects = total_projects.length > 0 ? total_projects.sort(compareStr) : [];


        for(var n = 0; n < sorted_total_projects.length; n++){
          range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,4);
          range.setValues([[sorted_total_projects[n].name, sorted_total_projects[n].hours, sorted_total_projects[n].pay, sorted_total_projects[n].outlay]]);
          range.setNumberFormats(format.prjs);
          sum_hours += sorted_total_projects[n].hours;
          sum_pay += sorted_total_projects[n].pay;
          sum_outlay += sorted_total_projects[n].outlay;

        }

      }
      range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,4);
      range.setValues([['Итого по сотруднику', sum_hours, sum_pay, sum_outlay]]);
      range.setNumberFormats(format.prjs);
      range.setBackground('#FFFACD');
      total_hours += sum_hours;
      total_pay += sum_pay;
      total_outlay += sum_outlay;

      dep_hours += sum_hours;
      dep_pay += sum_pay;
      dep_outlay += sum_outlay;
    }

    range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,4);
    range.setValues([['Итого по отделу', dep_hours, dep_pay, dep_outlay]]);
    range.setNumberFormats(format.prjs);
    range.setBackground('#F0E68C');
  }
  range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,4);
  range.setValues([['Итого', total_hours, total_pay, total_outlay]]);
  range.setNumberFormats(format.prjs);
  range.setBackground('#FFFF00');
  range = sheet.getDataRange();
  range.setBorder(true, true, true, true, true, true);
  range.setWrap(true);

  return {
    type: 'link',
    value: ssNew.getUrl()
  };
}

function getNameRep(id, table){
  for(var i = 0; i < table.length; i++) {
    if(id == table[i].id) {
      return table[i].name;
    }
  }
  return 'none';
}

function getProjectsByEmployee(e_id, d_id, month, wTime_value, allProjects){
  var projects = [],
      flag = true,
      cost = 0;
// TODO: Загрузить документы и их содержимое здесь, или даже в главной функции в глобал.
  for(var i = 0; i < wTime_value.length; i++) {
    if(wTime_value[i][5] == e_id && wTime_value[i][4] == d_id &&
       wTime_value[i][2].getMonth() == month.getMonth() &&
       wTime_value[i][2].getFullYear() == month.getFullYear()) {
      flag = true;

      for(var j = 0; j < projects.length; j++) {
        if(projects[j].id == wTime_value[i][1]) {
          cost = getPay(e_id);
          projects[j].hours += wTime_value[i][6];
          projects[j].pay += (cost.pay/(getWorkDays(month.getMonth(), month.getFullYear()) * 8)) * wTime_value[i][6] || 0;
          projects[j].outlay += (cost.outlay/(getWorkDays(month.getMonth(), month.getFullYear()) * 8)) * wTime_value[i][6] || 0;
          flag = false;
        }
      }
      if(flag){
        cost = getPay(e_id);
        projects.push({
          name: getProjectName(allProjects, wTime_value[i][1]),
          id: wTime_value[i][1],
          hours: wTime_value[i][6],
          pay: (cost.pay/(getWorkDays(month.getMonth(), month.getFullYear()) * 8)) * wTime_value[i][6] || 0,
          outlay: (cost.outlay/(getWorkDays(month.getMonth(), month.getFullYear()) * 8)) * wTime_value[i][6] || 0
        })
      }
    }
  }
  Logger.log(projects);
  return projects;
}

function getEmployeesByDep(dep_id, employees) {
  var result = [];

  for(var i = 0; i < employees.length; i++){
    if(employees[i].dep_id == dep_id ){
      result.push({
        id: employees[i].id,
        name: employees[i].name
      })
    }
  }

  return result;
}

function getProjectName(projects, id){
  var name;
  for(var i = 0; i < projects.length; i++) {
    if(projects[i].id == id) {

      name = projects[i].name;
    }
  }

  return name;
}

function getPeriods(from, to){
  var i = 0,
      periods = [],
      time = new Date(from),
      tmp;
  from = new Date(from);
  to = new Date(to);
  var dif = (to.getMonth() - from.getMonth() + 1) + 12 * (to.getFullYear() - from.getFullYear());

  for(i = 0; i < dif; i++) {
    time.setMonth(from.getMonth() + i);
    tmp = new Date(time);
    periods.push({
      date: new Date(time.getTime()),
      name: MONTHS[time.getMonth()] + ' ' + time.getFullYear()
    });
  }

  return periods;
}



function getDepartments(){
  var department = openDocument(FILEID.department, 'Разработка'),
      value = department.getDataRange().getValues(),
      depsList = [],
      i = 0;

//  Logger.log(value[2][2]);

  for(i = 1; i < value.length; i++){
    if(value[i][2]){
      depsList.push({
        id: value[i][0],
        name: value[i][1]
      });
    }
  }

  return depsList;
}

function getEmployees(deps){
  var employee = openDocument(FILEID.employee, 'Разработка'),
      value = employee.getDataRange().getValues(),
      list = [],
      i = 0,
      j = 0;

  for(var i = 1; i < deps.length; i++) {
    for(var j = 1; j < value.length; j++) {
      if(value[j][3] == deps[i].id && value[j][4]) {

        list.push({
          dep_id: deps[i].id,
          id: value[j][0],
          name: value[j][1]
        })
      }
    }
  }

  return list;
}

function getProjects(value){

  var projects = [];

  for(var i = 1; i < value.length; i++){
//    if(value[i][4]) {
      projects.push({
        id: value[i][0],
        name: value[i][1]
      })
//    }
  }

  return projects;
}


function getPay(e_id){
  var ss = SpreadsheetApp.openById('1E8PyZB61S_V7C0u9yJaVVJrJQdWFvFuvCvyBht1-Dzw'),
      sheet = ss.getSheets()[0],
      value = sheet.getDataRange().getValues(),
      days = 0,
      i = 0,
      cost = {};

  for(i = 0; i < value.length; i++){
     if(value[i][0] == e_id && value[i][3]){
//     Logger.log(value[i][1] + ' - ' + value[0][5] + ' - ' + value[i][2] + ' - ' + value[0][7]);
       cost.pay = value[i][1] + value[i][2];
       cost.outlay = (value[i][1]*value[0][5] + value[i][2]*value[0][7]) - cost.pay;
//       Logger.log(cost);
       return cost;
     }
  }
}

function getWorkDays(month, year){
  var ss = SpreadsheetApp.openById('1JGdMmLlebe4K_qYa-VvaqJ9T_4HA6hhXIyPyvf_NCeQ'),
      sheet = ss.getSheetByName(year),
      value = sheet.getDataRange().getValues(),
      days = 0;

  for(var i = 1; i < value.length; i++){
    if(value[i][0] == (month + 1)){
      return value[i][1];
    }
  }
}

/**
  * Create a report.
  * @param {JSON} x - Параметры для создания отчета (период в текстовом формате и в формате Date).
  * @return {Object} y - Тип сообщения (сообщение об ошибку валидации или ссылка на отчет).
*/
function createReportForOrg(data){
  var params = JSON.parse(data),
      reportName = (params.fileName == '') ? 'Отчет по организации' : params.fileName ;

  params.dateFrom = new Date(params.dateFrom);
  params.dateTo = new Date(params.dateTo);

//  Валидация
  if(params.monthFrom == '') {
    return {
      type: 'error',
      value: MESSAGE.empty_dfrom
    };
  }
  else if(params.monthTo == '') {
    return {
      type: 'error',
      value: MESSAGE.empty_dto
    };
  }
  else if(!isDate(params.dateFrom)) {
    return {
      type: 'error',
      value: MESSAGE.wrong_dfrom
    };
  }
  else if(!isDate(params.dateTo)) {
    return {
      type: 'error',
      value: MESSAGE.wrong_dto
    };
  }

  var reportSs = createSpreadSheet(reportName),
      report = reportSs.getSheets()[0],
      allProjects,
      allContracts,
      provision,
      workTime,
      workDays,
      value,
      projects,
      contracts,
      employeesPayment,
      range,
      i, j, k,
      totalReport = 0,
      totalProject = 0,
      format = [['@','0.00']];

  value = getSsValue(FILEID.project);
  allProjects = getProjects(value).sort(compareStr);
  value = getSsValue(FILEID.contract);
  allContracts = getContracts(value);
  provision = getSsValue(FILEID.provision)
  workTime = getSsValue(FILEID.workTime);

  range = report.getRange(report.getLastRow() + 1, 1, 2,2);
  range.setValues([['Отчет по организации',''], ['За период:', params.monthFrom + ' - ' + params.monthTo]]);

//  Формируем данные и сразу пишем в отчет reportSs на страницу report
  for(i = 0; i < allProjects.length; i++){
    range = report.getRange(report.getLastRow() + 1, 1, 1,2);
    range.setValues([[allProjects[i].name,'']]);
    range.setBackground('#C0C0C0');
    range.merge();
    range.setFontWeight("bold");
    range.setHorizontalAlignment("center");

//  Получаем контракты по проекту и периоду отчета
    contracts = getContractsForProject(provision, allContracts, allProjects[i].id, params.dateFrom, params.dateTo);
    totalProject = 0;

    for(j = 0; j < contracts.length; j++){
      range = report.getRange(report.getLastRow() + 1, 1, 1,2);
      range.setValues([[contracts[j].name, contracts[j].cost]]);
      range.setNumberFormats(format);
      totalProject += contracts[j].cost;
    }

//  Получаем выплаты по сотрудникам
    employeesPayment = getTotalPayment(allProjects[i].id, params.dateFrom, params.dateTo, employeesPayment, workTime, workDays) * (-1);
    totalProject += employeesPayment;
    totalReport += totalProject;

    range = report.getRange(report.getLastRow() + 1, 1, 1,2);
    range.setValues([['Выплаты сотрудникам', employeesPayment]]);
    range.setNumberFormats(format);
    range.setBackground('#E6E6FA');

    range = report.getRange(report.getLastRow() + 1, 1, 1,2);
    range.setValues([['Итого по проекту', totalProject]]);
    range.setNumberFormats(format);
    range.setBackground('#FFF273');
  }

  range = report.getRange(report.getLastRow() + 1, 1, 1,2);
  range.setValues([['Итого по организации', totalReport]]);
  range.setNumberFormats(format);
  range.setBackground('#FFCF73');

  range = report.getDataRange();
  range.setBorder(true, true, true, true, true, true);
  range.setWrap(true);
  report.autoResizeColumn(1);

  return {type: 'link', value: reportSs.getUrl()};
}

/**
  * Создание файла SpreadSheet
  * @param {string} name - название файла TODO: сдлать название файла из input
*/
function createSpreadSheet(name){
  return SpreadsheetApp.create(name);
}


/**
  * Получение содержимого таблицы по id
*/
function getSsValue(id){
  return SpreadsheetApp.openById(id).getSheets()[0].getDataRange().getValues();
}

function isDate(date){
  return (date instanceof Date);
}

function getNameId(value){
  var i = 0,
      result = [];

  for(i = 1; i < value.length; i++){
    result[i-1] = {};
    result[i-1].id = value[i][0];
    result[i-1].name = value[i][1]
  }

  return result.sort(compareStr);
}

/**
  * Получение данных из таблицы "Проекты"
  * @param {Array} value - двумерный массив из полученный из документа "Проекты"
*/
function getProjects(value){
  var i = 0,
      result = [];
  Logger.log(value);
  for(i = 1; i < value.length; i++){
    if(value[i][4]) {
      result.push({
        id: value[i][0],
        name: value[i][1],
        dateFrom: new Date(value[i][2])
      })
    }
//    result[i-1] = {};
//    result[i-1].id = value[i][0];
//    result[i-1].name = value[i][1];
//    result[i-1].dateFrom = new Date(value[i][2]);
  }

  return result.sort(compareStr);
}

/**
  * Получение данных из таблицы "Контракты"
  * @param {Array} value - двумерный массив из полученный из документа "Контракты"
*/
function getContracts(value){
  var i = 0,
      result = [];

  for(i = 1; i < value.length; i++){
    result[i-1] = {};
    result[i-1].id = value[i][0];
    result[i-1].name = value[i][1];
    result[i-1].dateFrom = new Date(value[i][6]);
    result[i-1].cost = value[i][5];
  }

  return result.sort(compareStr);
}

/**
  * Проекты входящие в период from - to
  * @param {date} from - дата начала
  * @param {date} to - дата окончания
*/
function getProjectsInPeriod(projects, from, to){
  var result = [],
      i = 0;

  for(i = 0; i < projects.length; i++){
    if(projects[i].dateFrom >= from && projects[i].dateFrom <= to){
      result.push(projects[i]);
    }
  }

  return result;
}

/**
  * Контракты по проекту
  * @param {Array} provision - обеспечение контрактов
  * @param {Array} allContracts - все контракты организации
  * @param {string} projectId - id проекта
  * @param {date} from - дата начала
  * @param {date} to - дата окончания
*/
function getContractsForProject(provision, allContracts, projectId, from, to){
  var projContracts = [],
      result,
      i = 0;

  for(i = 0; i < provision.length; i++){
    if(provision[i][1] == projectId){
      projContracts.push(provision[i][0]);
    }
  }

  result = contractsForPeriod(projContracts, allContracts, from, to).sort(compareStr);



  Logger.log(result);

  return getContractsCost(result, projectId, provision);
}


function getContractsCost(value, projectId, provision){
  var i = 0,
      j = 0,
      result;

  for(i = 0; i < value.length; i++){
    for(j = 0; j < provision.length; j++){
      if(provision[j][0] == value[i].id &&  provision[j][1] == projectId){
        value[i].cost = provision[j][3];
      }
    }
  }
  return value;
}

/**
  * Контракты удовлетворяющие периоду
  * @param {Array} projContracts - контракты по проекту
  * @param {Array} allContracts - все контракты организации
  * @param {date} from - дата начала
  * @param {date} to - дата окончания
*/
function contractsForPeriod(projContracts, allContracts, from, to){
  var result = [],
      i = 0, j;

  for(i = 0; i < projContracts.length; i++){
    for(j = 0; j < allContracts.length; j++){
      if(projContracts[i] == allContracts[j].id && allContracts[j].dateFrom >= from && allContracts[j].dateFrom <= to){
        result.push(allContracts[j]);
      }
    }
  }

  return result;
}

/**
  * Контракты удовлетворяющие периоду
  * @param {string} prj_id - id проекта
  * @param {date} from - дата начала
  * @param {date} to - дата окончания
  * @param {Array} payment - ЗП сотрудников
  * @param {Array} workTime - трудозатраты по проектам
  * @param {Array} workDays - рабочие дни по месяцам
*/
function getTotalPayment(prj_id, from, to, payment, workTime, workDays){
  var i = 0, total = 0, pay;

  for(i = 0; i < workTime.length; i++){
    if(workTime[i][1] == prj_id && workTime[i][2] >= from && workTime[i][2] <= to){
      total += (getPayOrg(workTime[i][5])/(getWorkDays(workTime[i][2].getMonth(), workTime[i][2].getFullYear()) * 8)) * workTime[i][6] || 0;
    }
  }

  return total;
}

/**
  * ЗП для сотрудника (ЗП серая + ЗП белая)
*/
function getPayOrg(e_id){
  var ss = SpreadsheetApp.openById(FILEID.payment),
      sheet = ss.getSheets()[0],
      value = sheet.getDataRange().getValues(),
      days = 0,
      i = 0;
//  Logger.log(value[1][5] )
  for(i = 0; i < value.length; i++){
     if(value[i][0] == e_id){
      return value[i][1]*value[0][5] + value[i][2]*value[0][7];
    }
  }
}

/**
  * Рабочие дни по месяцам за год
*/
function getWorkDays(month, year){
  var ss = SpreadsheetApp.openById(FILEID.workDays),
      sheet = ss.getSheetByName(year),
      value = sheet.getDataRange().getValues(),
      days = 0;

  for(var i = 1; i < value.length; i++){
    if(value[i][0] == (month + 1)){
      return value[i][1];
    }
  }
}
