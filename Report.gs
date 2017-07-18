'use strict';
var MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    TABLES = {};

function getDataForReport(data){
  TABLES.department = openDocument(FILEID.department, 'Разработка').getDataRange().getValues();
  TABLES.employee = openDocument(FILEID.employee, 'Разработка').getDataRange().getValues();
  TABLES.project = openDocument(FILEID.project, 'Разработка').getDataRange().getValues();
  TABLES.workTime = openDocument(FILEID.workTime, 'Разработка').getDataRange().getValues();
  TABLES.payment = openDocument(FILEID.payment, 'Разработка').getDataRange().getValues();
  TABLES.premium = openDocument(FILEID.premium, 'Разработка').getDataRange().getValues();
  TABLES.workDays = SpreadsheetApp.openById(FILEID.workDays);

  var report_info = JSON.parse(data);

  if(!report_info.monthFrom){
    return {
      status: 'error',
      value: MESSAGE.empty_dfrom
    };
  } else if(!report_info.monthTo){
    return {
      status: 'error',
      value: MESSAGE.empty_dto
    };
  } else if(compareDates(report_info.monthFrom, report_info.monthTo)){
//    Logger.log(!)
    return {
      status: 'error',
      value: MESSAGE.overlap_date
    };
  }

  var allDepartments = getDepartments(),
      allEmployees = getEmployees(allDepartments),
      allProjects = getProjects(TABLES.project),
      workTimeValue = TABLES.workTime,
      
      empl_sum = {},
      dep_sum = {},
      total_sum = {},
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
        prjs: [['@', '0.0', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00']]
      };
  
  Logger.log(allProjects);
  
  if(report_info.depId == 'opt') {
     departments = allDepartments.sort(compareStr);
  } else {
    departments[0] = {
      id: report_info.depId,
      name: getNameRep(report_info.depId, allDepartments)
    };
  }
  
  total_sum = {
    hours: 0,
    wpay: 0,
    gpay: 0,
    wpay_fact: 0,
    gpay_fact: 0,
    premium: 0,
    outlay: 0
  };

  var ssNew = SpreadsheetApp.create("Report"),
      sheet = ssNew.getSheets()[0];

  range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,8);
  range.setValues([['Отчет по сотрудникам и отделам ', 'За период: ', report_info.fromTxt, ' - ',report_info.toTxt, '', '', '']]);

  for(var i = 0; i < departments.length; i++) {
  
    range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,8);
    range.setValues([[departments[i].name, '', '', '', '', '', '', '']]);
    range.setBackground('#C0C0C0');
    range.merge();
    range.setFontWeight("bold");

    dep_sum = {
      hours: 0,
      wpay: 0,
      gpay: 0,
      wpay_fact: 0,
      gpay_fact: 0,
      premium: 0,
      outlay: 0
    };
    
    if(report_info.emplId == 'opt') {
      employees = getEmployeesByDep(departments[i].id, allEmployees);
      employees = employees.sort(compareStr);
    } 
    else {
      employees[0] = {
        id: report_info.emplId,
        name: getNameRep(report_info.emplId, allEmployees)
      };
    }

    for(var j = 0; j < employees.length; j++) {

      range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,8);
      range.setValues([[employees[j].name, '', '', '', '', '', '', '']]);
      range.setBackground('#B0E0E6');
      range.merge();
      range.setHorizontalAlignment("center");
      range.setFontWeight("bold");


      empl_sum = {
        hours: 0,
        wpay: 0,
        gpay: 0,
        wpay_fact: 0,
        gpay_fact: 0,
        premium: 0,
        outlay: 0
      };

      for(var k = 0; k < periods.length; k++){
        range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,8);
        range.setValues([[periods[k].name, '', '', '', '', '', '', '']]);
        range.setBackground('#FFF8DC');
        range.merge();
        range.setHorizontalAlignment("center");
        range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,8);
        range.setValues([['', 'Трудозатраты (часы)', 'ЗП белая (руб)',
          'ЗП серая (руб)', 'ЗП белая(факт руб)', 
          'ЗП серая(факт руб)', 'Премия (руб)', 'Налоги (руб)']]);

        total_projects = getProjectsByEmployee(employees[j].id, departments[i].id,  periods[k].date, workTimeValue, allProjects);
        Logger.log(total_projects);
        sorted_total_projects = total_projects.length > 0 ? total_projects.sort(compareStr) : [];


        for(var n = 0; n < sorted_total_projects.length; n++){
          range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,8);
          range.setValues([[
            sorted_total_projects[n].name, 
            sorted_total_projects[n].hours, 
            sorted_total_projects[n].wpay, 
            sorted_total_projects[n].gpay,
            sorted_total_projects[n].wpay_fact,
            sorted_total_projects[n].gpay_fact,
            sorted_total_projects[n].premium,
            sorted_total_projects[n].outlay
          ]]);
          range.setNumberFormats(format.prjs);
          
          empl_sum.hours += sorted_total_projects[n].hours;
          empl_sum.wpay += sorted_total_projects[n].wpay;
          empl_sum.gpay += sorted_total_projects[n].gpay;
          empl_sum.wpay_fact += sorted_total_projects[n].wpay_fact;
          empl_sum.gpay_fact += sorted_total_projects[n].gpay_fact;
          empl_sum.premium += sorted_total_projects[n].premium;
          empl_sum.outlay += sorted_total_projects[n].outlay;
        }

      }
      range = sheet.getRange(sheet.getLastRow() + 1, 1, 1,8);
      range.setValues([[
        'Итого по сотруднику',
        empl_sum.hours, 
        empl_sum.wpay, 
        empl_sum.gpay, 
        empl_sum.wpay_fact, 
        empl_sum.gpay_fact, 
        empl_sum.premium, 
        empl_sum.outlay
      ]]);
      
      range.setNumberFormats(format.prjs);
      range.setBackground('#FFFACD');
      total_hours += sum_hours;
      total_pay += sum_pay;
      total_outlay += sum_outlay;
      
      dep_sum.hours += empl_sum.hours;
      dep_sum.wpay += empl_sum.wpay;
      dep_sum.gpay += empl_sum.gpay;
      dep_sum.wpay_fact += empl_sum.wpay_fact;
      dep_sum.gpay_fact += empl_sum.gpay_fact;
      dep_sum.premium += empl_sum.premium;
      dep_sum.outlay += empl_sum.outlay;
    }
    
    total_sum.hours += dep_sum.hours;
    total_sum.wpay += dep_sum.wpay;
    total_sum.gpay += dep_sum.gpay;
    total_sum.wpay_fact += dep_sum.wpay_fact;
    total_sum.gpay_fact += dep_sum.gpay_fact;
    total_sum.premium += dep_sum.premium;
    total_sum.outlay += dep_sum.outlay;
    
    range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, 8);
    range.setValues([[
      'Итого по отделу',
      dep_sum.hours, 
      dep_sum.wpay, 
      dep_sum.gpay, 
      dep_sum.wpay_fact, 
      dep_sum.gpay_fact, 
      dep_sum.premium, 
      dep_sum.outlay
    ]]);
    range.setNumberFormats(format.prjs);
    range.setBackground('#F0E68C');
  }
  range = sheet.getRange(sheet.getLastRow() + 1, 1, 1 ,8);
  range.setValues([[
    'Итого',
    total_sum.hours, 
    total_sum.wpay, 
    total_sum.gpay, 
    total_sum.wpay_fact, 
    total_sum.gpay_fact, 
    total_sum.premium, 
    total_sum.outlay
  ]]);
  range.setNumberFormats(format.prjs);
  range.setBackground('#FFFF00');
  range = sheet.getDataRange();
  range.setBorder(true, true, true, true, true, true);
  range.setWrap(true);

  return {
    status: 'link',
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
        wTime_value[i][2].getFullYear() == month.getFullYear())
    {      
      flag = true;

      for(var j = 0; j < projects.length; j++) {
        if(projects[j].id == wTime_value[i][1]) {
          cost = getPay(e_id);
          projects[j].hours += wTime_value[i][6];
          projects[j].wpay = cost.wpay;
          projects[j].gpay = cost.gpay;
          projects[j].wpay_fact += (cost.wpay/(getWorkDays(month.getMonth(), month.getFullYear()) * 8)) * wTime_value[i][6] || 0;
          projects[j].gpay_fact +=(cost.gpay/(getWorkDays(month.getMonth(), month.getFullYear()) * 8)) * wTime_value[i][6] || 0;
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
          wpay: cost.wpay,
          gpay: cost.gpay,
          wpay_fact: (cost.wpay/(getWorkDays(month.getMonth(), month.getFullYear()) * 8)) * wTime_value[i][6] || 0,
          gpay_fact: (cost.gpay/(getWorkDays(month.getMonth(), month.getFullYear()) * 8)) * wTime_value[i][6] || 0,
          premium: getPremiumForReport(d_id, e_id, wTime_value[i][1], month),
          outlay: (cost.outlay/(getWorkDays(month.getMonth(), month.getFullYear()) * 8)) * wTime_value[i][6] || 0
        })
      }
    }
  }

  return projects;
}

function getPremiumForReport(d_id, e_id, p_id, month) {
  var value = TABLES.premium,
      i = 0,
      premium = 0;
      
  for(i = 1; i < value.length; i++) {
//    Logger.log(value[i][1] + '--' + value[i][2] + '--' + value[i][3] + '--' + value[i][4]);
//    Logger.log(d_id + '**' + e_id + '**' + p_id + '**' + month);
//    Logger.log(value[i][1] === d_id && value[i][2] === e_id && 
//       value[i][3] === p_id && value[i][4].getMonth() === month.getMonth() &&
//       value[i][4].getFullYear() === month.getFullYear());
    if(value[i][1] === d_id && value[i][2] === e_id && 
       value[i][3] === p_id && value[i][4].getMonth() === month.getMonth() &&
       value[i][4].getFullYear() === month.getFullYear()){
      return value[i][5];
    }
  }
  return 0;
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
  var name = 'empty';
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
  var value = TABLES.department,
      depsList = [],
      i = 0;

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
  var value = TABLES.employee,
      list = [],
      i = 0,
      j = 0;

  for(var i = 0; i < deps.length; i++) {
    for(var j = 1; j < value.length; j++) {
//      Logger.log(value[j][3] + ' S-O ' + deps[i].id);
      if(value[j][3] == deps[i].id && value[j][4] !== 'Уволен') {

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
    projects.push({
      id: value[i][0],
      name: value[i][1],
      dateFrom: new Date(value[i][2])
    })
  }

  return projects;
}


function getPay(e_id, table){
  var value = TABLES.payment,
      days = 0,
      i = 0,
      cost = {};

  for(i = 0; i < value.length; i++){
     if(value[i][0] == e_id && value[i][3]){
//     Logger.log(value[i][1] + ' - ' + value[0][5] + ' - ' + value[i][2] + ' - ' + value[0][7]);
       cost.wpay = value[i][1];
       cost.gpay = value[i][2];
       cost.outlay = (value[i][1]*value[0][5] + value[i][2]*value[0][7]) - (value[i][1] + value[i][2]);

       return cost;
     }
  }
}

function getWorkDays(month, year){
  var workDays = TABLES.workDays,
      value = workDays.getSheetByName(year).getDataRange().getValues();
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
      projectsInPeriod,
      projects,
      contracts,
      employeesPayment,
      range,
      i, j, k,
      totalReport = 0,
      totalProject = 0,
      format = [['@', '0.00', '@']];

  value = getSsValue(FILEID.project);
  allProjects = getProjects(value).sort(compareStr);
  projectsInPeriod = getProjectsInPeriod(allProjects, params.dateFrom, params.dateTo);
  value = getSsValue(FILEID.contract);
  allContracts = getContracts(value);
  provision = getSsValue(FILEID.provision);
  projects = getProjectsInProvision(projectsInPeriod, provision);
  workTime = getSsValue(FILEID.workTime);
//  Logger.log(allProjects);
//  Logger.log(projects);
//  Logger.log(provision);
  
  range = report.getRange(report.getLastRow() + 1, 1, 2,3);
  range.setValues([['Отчет по организации','', ''], ['За период:', params.monthFrom, params.monthTo]]);
//  report.getRange(2,1,1,3).merge();
//  Формируем данные и сразу пишем в отчет reportSs на страницу report
  for(i = 0; i < projects.length; i++){
    range = report.getRange(report.getLastRow() + 1, 1, 1,3);
    range.setValues([[projects[i].name,'','']]);
    range.setBackground('#C0C0C0');
    range.merge();
    range.setFontWeight("bold");
    range.setHorizontalAlignment("center");

//  Получаем контракты по проекту и периоду отчета
    contracts = getContractsForProject(provision, allContracts, projects[i].id, params.dateFrom, params.dateTo, params.type);
    totalProject = 0;
//    Logger.log(allContracts);
//    Logger.log(contracts);
    for(j = 0; j < contracts.length; j++){
      range = report.getRange(report.getLastRow() + 1, 1, 1,3);
      range.setValues([[contracts[j].name, Math.abs(contracts[j].cost), (contracts[j].type == 1 ? 'Приход' : 'Расход')]]);
      range.setNumberFormats(format);
      totalProject += contracts[j].cost;
    }

//  Получаем выплаты по сотрудникам
    employeesPayment = getTotalPayment(projects[i].id, params.dateFrom, params.dateTo, employeesPayment, workTime, workDays) * (-1);
    totalProject += employeesPayment;
    totalReport += totalProject;

    range = report.getRange(report.getLastRow() + 1, 1, 1,3);
    range.setValues([['Выплаты сотрудникам', Math.abs(employeesPayment),'']]);
    range.setNumberFormats(format);
    range.setBackground('#E6E6FA');

    range = report.getRange(report.getLastRow() + 1, 1, 1,3);
    range.setValues([['Итого по проекту', totalProject, '']]);
    range.setNumberFormats(format);
    range.setBackground('#FFF273');
  }

  range = report.getRange(report.getLastRow() + 1, 1, 1,3);
  range.setValues([['Итого по организации', totalReport, '']]);
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

function getProjectsInProvision(projects, provisions) {
  var result = [],
      i = 0,
      j = 0;
  
  Logger.log(provisions);
  for(i = 0; i < projects.length; i++) {
    Logger.log(i);
    for(j = 1; j < provisions.length; j++) {
      if(projects[i].id == provisions[j][1]){
        Logger.log(projects[i].id + '==' + provisions[j][1])
        result.push(projects[i]);
        break;
      }
    }
  }
  Logger.log(projects);
  Logger.log(result);
  return result;
}

/**
  * Получение данных из таблицы "Проекты"
  * @param {Array} value - двумерный массив из полученный из документа "Проекты"
*/
//function getProjects(value){
//  var i = 0,
//      result = [];
//  Logger.log(value);
//  for(i = 1; i < value.length; i++){
//    if(value[i][4]) {
//      result.push({
//        id: value[i][0],
//        name: value[i][1],
//        dateFrom: new Date(value[i][2])
//      })
//    }
////    result[i-1] = {};
////    result[i-1].id = value[i][0];
////    result[i-1].name = value[i][1];
////    result[i-1].dateFrom = new Date(value[i][2]);
//  }
//
//  return result.sort(compareStr);
//}

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
    result[i-1].type = value[i][4];
    result[i-1].name = value[i][1] + ' - ' + value[i][2];
    result[i-1].dateFrom = new Date(value[i][8]);
    result[i-1].cost = value[i][7];
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
//  Logger.log(result);
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
function getContractsForProject(provision, allContracts, projectId, from, to, type){
  var projContracts = [],
      result,
      i = 0;

  for(i = 0; i < provision.length; i++){
    if(provision[i][1] == projectId){
      projContracts.push(provision[i][0]);
    }
  }
  
//  Logger.log(allContracts);
  result = contractsForPeriod(projContracts, allContracts, from, to).sort(compareStr);

//  Logger.log(result);

  if(type != 'opt'){
    result = getContractsByType(result, type);
  } 

  return getContractsCost(result, projectId, provision);
}

function getContractsByType(value, type){
  var array = value,
      result = [];
  
  array.forEach(function(item, i){
    if(item.type == type){
      result.push(item);
    }
  });
  
  return result;
}

function getContractsCost(value, projectId, provision){
  var i = 0,
      j = 0,
      result;
  
  for(i = 0; i < value.length; i++){
    for(j = 0; j < provision.length; j++){
      if(provision[j][0] == value[i].id &&  provision[j][1] == projectId){
        value[i].cost = provision[j][3]*value[i].type;
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
//      Logger.log(projContracts[i] + ' -- ' + allContracts[j].id + ' / ' +
//                 allContracts[j].dateFrom + ' -- ' + from + ' / ' +
//                 allContracts[j].dateFrom + ' -- ' + to);
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
