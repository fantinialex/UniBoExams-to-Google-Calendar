class Course{

	constructor(degreeProgramme, name, type, duration){
		this.degreeProgramme = degreeProgramme;
		this.name = name;
		this.type = type;
		this.duration = duration;
	}

	/**
	 * Insert exams into the passed calendar, or update it, and send a report to the passed mail
	 *
	 * @param {Calendar} calendar calendar object where to insert the exams
	 * @param {String} mail mail where to send the report
	 */
	createExams(calendar, mail){
		const exW = this.getExamsWeb_();
		const exC = this.getExamsCalendar_(calendar);
		const report = new Report(this, mail);

		exW.forEach(examW => {
			const foundInCalendar = exC.filter(examC => examC.equals(examW, false));

			switch(foundInCalendar.length){ //controllo quanti ne ho trovati
				case 0:
					report.add(examW);
					examW.create(calendar);
					break;
				case 1:
					if(!examW.equals(foundInCalendar[0], true)){
						report.update(foundInCalendar[0], examW);
						examW.update(calendar);
					}
					break;
				default:
					report.error(examW);
					break;
			}
		});

		exC.forEach(examC => {
			if(examC.description === "NON presente su AlmaEsami") return; //non elimino gli esami inseriti manualmente (non presenti su AlmaEsami)

			const foundInWeb = exW.filter(examW => examC.equals(examW, false)).length > 0

			if(!foundInWeb){
				try{
					examC.delete(calendar);
					report.delete(examC);
				}
				catch(e){
					report.error(examC);
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
		const report = new Report(this, "");
		dates.forEach(start => {
			const end = new Date(start.getTime() + this.duration*60*60*1000);
			const ex = new Exam(this, start, end, "NON presente su AlmaEsami");
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
		const events = this.getExamsCalendar_(calendar);
		const report = new Report(this, "");
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
		const url = this.degreeProgramme.examsUrl+"?appelli="+this.name.replace(" ","+").toUpperCase();
		const str = UrlFetchApp.fetch(url).getContentText();
		const tableRegex = /<table class=\"single-item\">([\s\S]*?)<\/table>/gi;
		const examsTable = str.match(tableRegex);
		const exams = [];

		const dateRegex = /(?<=<td class=\"text-secondary\">)(.*)(?=<\/td>)/gi;
		const infoRegex = /(?<=<td>)([\s\S]*?)(?=<\/td>)/gi;
		examsTable.forEach(ex => {
			const start = Course.createDate_(ex.match(dateRegex)[0].replace(" ore",""));
			const info = ex.match(infoRegex);
			const type = info[1].trim();

			//solo esami futuri e del tipo spefificato (o tutti)
			if(start.valueOf() >= new Date().setHours(0,0,0,0) && (this.type[0] === "*" || this.type.includes(type))){
				const end = new Date(start.getTime() + this.duration*60*60*1000);

				const enrollment = info[0].replace(/(<\/span>)*\s+(<span>)*/gi, " ").trim();
				const classroom = info[2].trim();
				const note = info.length > 3 ? info[3].trim() : "";
				
				exams.push(new Exam(this, start, end, "").createDescription(enrollment, type, classroom, note));
			}
		});
		return exams;
	}

	getExamsCalendar_(calendar){
		const exams = [];

		const start = new Date(new Date().setHours(0,0,0,0));
		const end = new Date(start.getTime() + 1.5*365*24*60*60*1000); // 1.5 years
		const events = calendar.getEvents(start, end, {search: this.name});

		events.forEach(event => {
			exams.push(new Exam(this, event.getStartTime(), event.getEndTime(), event.getDescription()));
		})

		return exams;
	}

	static createDate_(dateString) {
		const day = dateString.substring(0, 2);
		const monthTxt = dateString.match(/\s([a-z]*)\s/gi)[0].trim();
		const allMonths = [
			"gennaio",
			"febbraio",
			"marzo",
			"aprile",
			"maggio",
			"giugno",
			"luglio",
			"agosto",
			"settembre",
			"ottobre",
			"novembre",
			"dicembre"
		]

		const year = dateString.match(/\d\d\d\d/gi)[0];
		const month = allMonths.indexOf(monthTxt)
		const hour = dateString.substring(dateString.length - 5, dateString.length - 3);
		const minutes = dateString.substring(dateString.length - 2, dateString.length);
		return new Date(year, month, day, hour, minutes);
	}
}