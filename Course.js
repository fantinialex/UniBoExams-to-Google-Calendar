class Course{

	constructor(name, tipe, duration){
		this.name = name;
		this.tipe = tipe;
		this.duration = duration;
		this.report = "";
	}

	createExams(calendar){
		let exW = this.getExamsWeb();
		let exC = this.getExamsCalendar(calendar);

		exW.forEach(ex => {
			let found = 0, update = false, c = -1;
			for(let i=0; i<exC.length; i++){
				if(ex.equals(exC[i], false)){
					found++;
					update = !ex.equals(exC[i], true);
					if(update) c = i; //c variabile appoggio per stampare il vecchio esame
				}
			}
			switch(found){ //controllo quanti ne ho trovati
				case 0:
					this.reportAdd(ex);
					ex.create(calendar);
					break;
				case 1:
					if(update){
						this.reportUpdate(exC[c], ex);
						ex.update(calendar);
					}
					break;
				default:
					this.reportError(ex);
					break;
			}
		});

		exC.forEach(ex => {
			if(ex.description == "NON presente su AlmaEsami") return; //non elimino gli esami inseriti manualmente (non presenti su AlmaEsami)
			let found = false;
			for(let i=0; i<exW.length; i++){
				if(ex.equals(exW[i], false)) //non deep altrimenti elimina gli esami precedentemente aggiornati
					found = true;
			}
			if(!found){
				try{
					ex.delete(calendar);
					this.reportDelete(ex);
				}
				catch(e){
					this.reportError(ex);
				}
				
			}
		});

		this.sendReportMail();
	}

	addManual(calendar, dates){
		dates.forEach(start => {
			let end = new Date(start.getTime() + this.duration*60*60*1000);
			new Exam(this.name, start, end, "NON presente su AlmaEsami").create(calendar);
		});
	}

	reportAdd(exam){
		this.report += "<b>Aggiunto esame:</b><br>"
		this.report += exam.toString()+"<br><br>";
		console.log("Creato "+exam.name+" del "+exam.start);
	}

	reportUpdate(o, n){
		this.report += "<b>Aggiornato esame:</b><br>"
		this.report += "<b>Versione precedente:</b><br>"+o.toString()+"<br>";
		this.report += "<b>Nuova versione:</b><br>"+n.toString()+"<br><br>";
		console.log("Aggiornato "+o.name+" del "+o.start);
	}

	reportDelete(exam){
		this.report += "<b>Cancellato esame:</b><br>"
		this.report += exam.toString()+"<br><br>";
		console.log("Eliminato "+exam.name+" del "+exam.start);
	}

	reportError(exam){
		this.report += "<b>ERRORE esame:</b><br>"
		this.report += exam.toString()+"<br><br>";
		console.log("Errore "+exam.name+" del "+exam.start);
	}

	sendReportMail(){
		if(this.report != ""){
			MailApp.sendEmail({
				to: "mail@example.com",
				subject: "Report esami "+this.name,
				htmlBody: this.report
			});
		}
	}

	getExamsWeb(){
		let url = "https://corsi.unibo.it/laurea/IngegneriaInformatica/appelli?appelli="+this.name.replace(" ","+").toUpperCase();
		let str = UrlFetchApp.fetch(url).getContentText();
		const tableRegex = /<table class=\"single-item\">([\s\S]*?)<\/table>/gi;
		let examsTable = str.match(tableRegex);
		let exams = [];

		const dateRegex = /(?<=<td class=\"text-secondary\">)(.*)(?=<\/td>)/gi;
		const infoRegex = /(?<=<td>)([\s\S]*?)(?=<\/td>)/gi;
		examsTable.forEach(ex => {
			let start = Course.createDate(ex.match(dateRegex)[0].replace(" ore",""));
			let info = ex.match(infoRegex);
			let tipe = info[1].trim();

			//solo esami futuri e del tipo spefificato (o tutti)
			if(start.valueOf() >= new Date().setHours(0,0,0,0) && (this.tipe[0] == "*" || this.tipe.includes(tipe))){
				let enrollment = info[0].replace(/(<\/span>)*\s+(<span>)*/gi, " ").trim();
				let classroom = info[2].trim();
				let note = "";
				if(info.length > 3) note = info[3].trim();
				
				let description = "Iscrizioni: "+enrollment+"\nTipo: "+tipe+"\nAula: "+classroom;
				if(note!="") description += "\nNote:\n"+note;
				let end = new Date(start.getTime() + this.duration*60*60*1000);

				exams.push(new Exam(this.name, start, end, description));
			}
		});
		return exams;
	}

	getExamsCalendar(calendar){
		let exams = [];

		let start = new Date(new Date().setHours(0,0,0,0));
		let end = new Date(start.getTime() + 1.5*365*24*60*60*1000); // 1.5 years
		let events = calendar.getEvents(start, end, {search: this.name});
		
		for(let i=0; i<events.length; i++){
			exams.push(new Exam(events[i].getTitle(), events[i].getStartTime(), events[i].getEndTime(), events[i].getDescription()));
		}
		return exams;
	}

	static createDate(string) {
		let day = string.substring(0, 2);
		let monthTxt = string.match(/\s([a-z]*)\s/gi)[0].trim();
		let month;
		switch (monthTxt) {
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
		var hour = string.substring(string.length - 5, string.length - 3);
		var minutes = string.substring(string.length - 2, string.length);
		return new Date(year, month - 1, day, hour, minutes);
	}
}