/*
TODO controllo se variate date, ovvero se ci sono esami nel calendario non presenti sul sito (da oggi in poi)
TODO sistemare parsing data
*/

function clearCalendar(){
  var calendar = CalendarApp.getCalendarsByName('Università appelli esami')[0];
  calendar.getEvents(new Date(2022, 12-1, 22), new Date(2023, 09-1, 30)).forEach(e => e.deleteEvent());
}

function createExamNotPresent(){
  var calendar = CalendarApp.getCalendarsByName('Università appelli esami')[0];
  //createExam(calendar, corso, date, description)
  const esami = [
    {
      corso: "Corso 1",
      durata: 1,
      esami: [
        new Date(2023, 1, 1, 14, 0),
        new Date(2023, 2, 1, 14, 0)
      ]
    },
    {
      corso: "Corso 2",
      durata: 2,
      esami: [
        new Date(2023, 1, 1, 14, 0),
        new Date(2023, 2, 1, 14, 0)
      ],
      descrizione: "Dati di esempio"
    }
  ]

  esami.forEach(c => c.esami.forEach(esame => {
    examCalendar = calendar.getEvents(esame, calcEndDate(esame, c.durata), {search: c.corso})
    switch(examCalendar.length){
      case 0:
        createExam(calendar, c.corso, esame, c.durata, c.descrizione ? c.descrizione : "");
        break;
      case 1:
        c.descrizione = c.descrizione ? c.descrizione : "";
        if(!examIsEqualExam(examCalendar[0], c.corso, esame, c.durata, c.descrizione)){
          examCalendar[0].deleteEvent();
          console.log("Eliminato...");
          createExam(calendar, c.corso, esame, c.durata, c.descrizione);
        }
        break;
      default:
        console.log("Errore, ci sono troppi esami");
        break;
    }
  }));
  
}

function main() {
  var calendar = CalendarApp.getCalendarsByName('Università appelli esami')[0];

  const corsi = [
    {
      nome: "Corso 1",
      tipo: ["Scritto"],
      durata: 3
    },{
      nome: "Corso 2",
      tipo: ["*"]
    }
  ];

  const timeRegex = /(?<=<td class=\"text-secondary\">)(.*)(?=<\/td>)/gi;
  const infoRegex = /(?<=<td>)([\s\S]*?)(?=<\/td>)/gi;

  corsi.forEach(corso => {
    var sometingNew = false;
    var exams = getExams(corso.nome);
    if(exams != null){
      exams.forEach(exam => {
        var time = createDate(exam.match(timeRegex)[0].replace(" ore", ""));
        var info = exam.match(infoRegex);
        var iscrizioni = info[0].replace(/(<\/span>)*\s+(<span>)*/gi, " ").trim();
        var tipo = info[1].trim();
        var aula = info[2].trim();

        if(corso.tipo[0] == "*" || corso.tipo.includes(tipo)){

          var note = "";
          if(info.length>3)
            note = info[3].trim();

          //aggiornare date sessione
          var isInSession = isInRange(time, new Date(2023,06-1,12), new Date(2023,09-1,15)) || isInRange(time, new Date(2023,12-1,21), new Date(2024,02-1,16));
          
          //forse migliorabile
          if(isInSession){
            description = generateDescription(iscrizioni, tipo, aula, note);
            var durata = corso.durata ? corso.durata : 2
            calendarExams = calendar.getEvents(time, calcEndDate(time, durata), {search: corso.nome})
            switch(calendarExams.length){
              case 0:
                createExam(calendar,corso.nome,time,durata,description);
                sometingNew = true;
                break;
              case 1:
                if(!examIsEqualExam(calendarExams[0], corso.nome, time, durata, description)){
                  MailApp.sendEmail({
                    to: "mail@example.com",
                    subject: "Modificati esami",
                    htmlBody: "Modificato l'esame di "+corso.nome+ " del "+time+"<br><br><b>Versione precedente:</b><br>"+calendarExams[0].getTitle()+"<br>"+calendarExams[0].getStartTime()+" - "+calendarExams[0].getEndTime()+"<br>"+calendarExams[0].getDescription().replace(/\n/gi,"<br>")+"<br><br><b>Nuova versione:</b><br>"+corso.nome+"<br>"+time+" - "+calcEndDate(time, durata)+"<br>"+description.replace(/\n/gi,"<br>")
                  });
                  calendarExams[0].deleteEvent();
                  console.log("Eliminato "+corso.nome+" del "+time);
                  createExam(calendar,corso.nome,time,durata,description);
                }
                break;
              default:
                console.log("Errore "+corso.nome+" del "+time);
                MailApp.sendEmail({
                  to: "mail@example.com",
                  subject: "Errore esami",
                  htmlBody: "Controllare l'esame di "+corso.nome+ " del "+time
                });
                createExam(calendar,corso.nome,time,durata,description);
                sometingNew = true;
                break;
            }
          }
        }
      })
    }
    if(sometingNew){
      MailApp.sendEmail({
        to: "mail@example.com",
        subject: "Nuovi esami disponibili",
        htmlBody: "Sono stati aggiunti nuovi esami di "+corso.nome
      });
    }
  })
}

function getExams(name){
  var url = "https://corsi.unibo.it/laurea/IngegneriaInformatica/appelli?appelli="+name.replace(" ","+").toUpperCase();
  
  var str = UrlFetchApp.fetch(url).getContentText();

  const mainRegex = /<table class=\"single-item\">([\s\S]*?)<\/table>/gi;

  return str.match(mainRegex);
}

function generateDescription(iscrizioni, tipo, aula, note){
  var description = "Iscrizioni: "+iscrizioni+"\nTipo: "+tipo+"\nAula: "+aula;
  if(note!="") description += "\nNote:\n"+note;
  return description;
}

function createExam(calendar, corso, date, durata, description){
  calendar.createEvent(corso, date, calcEndDate(date, durata), {description: description});
  console.log("Creato "+corso+" del "+date);
}

function createDate(string){
  var day = string.substring(0,2);
  var monthTxt = string.match(/\s([a-z]*)\s/gi)[0].trim();
  var month;
  switch(monthTxt){
    case "gennaio":
      month = 1;
      break;
    case "febbraio":
      month = 2;
      break;
    case "marzo":
      month = 3;
      break;
    case "aprile":
      month = 4;
      break;
    case "maggio":
      month = 5;
      break;
    case "giugno":
      month = 6;
      break;
    case "luglio":
      month = 7;
      break;
    case "agosto":
      month = 8;
      break;
    case "settembre":
      month = 9;
      break;
    case "ottobre":
      month = 10;
      break;
    case "novembre":
      month = 11;
      break;
    case "dicembre":
      month = 12;
      break;
  }
  var year = string.match(/\d\d\d\d/gi)[0];
  var hour = string.substring(string.length-5,string.length-3);
  var minutes = string.substring(string.length-2,string.length);
  return new Date(year, month-1, day, hour, minutes);
}

function isInRange(date, start, end){
  return date >= start && date <= end;
}

function examIsEqualExam(a, title, start, durata, description){
  return a.getTitle() == title
          && a.getStartTime().valueOf() == start.valueOf()
          && a.getEndTime().valueOf() == calcEndDate(start, durata).valueOf()
          && a.getDescription() == description;
}

function calcEndDate(start, durata){
  return new Date(start.getTime() + 1000 * 60 * 60 * durata);
}
