class Course{

	constructor(degreeProgramme, name, tipe, duration){
		this.degreeProgramme = degreeProgramme;
		this.name = name;
		this.tipe = tipe;
		this.duration = duration;
	}

	/**
	 * Insert exams into the passed calendar, or update it, and send a report to the passed mail
	 *
	 * @param {Calendar} calendar calendar object where to insert the exams
	 * @param {String} mail mail where to send the report
	 */
	createExams(calendar, mail){
		let exW = this.getExamsWeb_();
		let exC = this.getExamsCalendar_(calendar);

		let report = new Report(this, mail);

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
					report.add(ex);
					ex.create(calendar);
					break;
				case 1:
					if(update){
						report.update(exC[c], ex);
						ex.update(calendar);
					}
					break;
				default:
					report.error(ex);
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
					report.delete(ex);
				}
				catch(e){
					report.error(ex);
				}
				
			}
		});

		report.send();
	}

	/**
	 * Manually insert an exam into the passed calendar
	 *
	 * @param {Calendar} calendar calendar object where to insert the exam
	 * @param {Date[]} dates array of dates of the exam
	 * @return {Course} course object itself
	 */
	addManual(calendar, dates){
		let report = new Report(this, "");
		dates.forEach(start => {
			let end = new Date(start.getTime() + this.duration*60*60*1000);
			let ex = new Exam(this, start, end, "NON presente su AlmaEsami");
			ex.create(calendar);
			report.add(ex);
		});
		return this;
		//TODO add check if exam already exists
	}

	/**
	 * Delete all future exams of the course from the passed calendar
	 *
	 * @param {Calendar} calendar calendar object where to delete the exams
	 */
	deleteAllFuture(calendar){
		let events = this.getExamsCalendar_(calendar);
		let report = new Report(this, "");
		events.forEach(ex => {
			try{
				ex.delete(calendar);
				report.delete(ex);
			}
			catch(e){
				report.error(ex);
			}
		});
	}

	getExamsWeb_(){
		let url = this.degreeProgramme.examsUrl+"?appelli="+this.name.replace(" ","+").toUpperCase();
		let str = UrlFetchApp.fetch(url).getContentText();
		const tableRegex = /<table class=\"single-item\">([\s\S]*?)<\/table>/gi;
		let examsTable = str.match(tableRegex);
		let exams = [];

		const dateRegex = /(?<=<td class=\"text-secondary\">)(.*)(?=<\/td>)/gi;
		const infoRegex = /(?<=<td>)([\s\S]*?)(?=<\/td>)/gi;
		examsTable.forEach(ex => {
			let start = Course.createDate_(ex.match(dateRegex)[0].replace(" ore",""));
			let info = ex.match(infoRegex);
			let tipe = info[1].trim();

			//solo esami futuri e del tipo spefificato (o tutti)
			if(start.valueOf() >= new Date().setHours(0,0,0,0) && (this.tipe[0] == "*" || this.tipe.includes(tipe))){
				let end = new Date(start.getTime() + this.duration*60*60*1000);

				let enrollment = info[0].replace(/(<\/span>)*\s+(<span>)*/gi, " ").trim();
				let classroom = info[2].trim();
				let note = info.length > 3 ? info[3].trim() : "";
				
				exams.push(new Exam(this, start, end, "").createDescription(enrollment, tipe, classroom, note));
			}
		});
		return exams;
	}

	getExamsCalendar_(calendar){
		let exams = [];

		let start = new Date(new Date().setHours(0,0,0,0));
		let end = new Date(start.getTime() + 1.5*365*24*60*60*1000); // 1.5 years
		let events = calendar.getEvents(start, end, {search: this.name});
		
		for(let i=0; i<events.length; i++){
			exams.push(new Exam(this, events[i].getStartTime(), events[i].getEndTime(), events[i].getDescription()));
		}
		return exams;
	}

	static createDate_(string) {
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