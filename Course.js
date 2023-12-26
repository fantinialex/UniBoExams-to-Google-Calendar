class Course{

	constructor(degreeProgramme, name, type, duration){
		this.degreeProgramme = degreeProgramme;
		this.name = name;
		this.type = type;
		this.duration = duration;
		this.skipExams = () => false;
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

			switch(foundInCalendar.length){ //check on found events number
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

		exC
			.filter(exam => exam.description !== "NON presente su AlmaEsami") //not manually added
			.filter(exam => exW.filter(examW => exam.equals(examW, false)).length === 0) //not found in website
			.forEach(exam => {
				try{
					exam.delete(calendar);
					report.delete(exam);
				}
				catch(e){
					report.error(exam);
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
	 * Set the expression to skip exams
	 *
	 * @param {Function} expression function that takes an exam and returns true if the exam has to be skipped
	 * @return {Course} object itself
	 */
	setSkipExams(expression){
		this.skipExams = expression;
		return this;
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
		const url = this.degreeProgramme.examsUrl+"?appelli="+this.name.replaceAll(" ","+").toUpperCase();
		const str = UrlFetchApp.fetch(url).getContentText();
		const tableRegex = /<table class="single-item">([\s\S]*?)<\/table>/g;
		const examsTable = str.match(tableRegex);
		const exams = [];

    if(examsTable!==null){
		const dateRegex = /(?<=<td class="text-secondary">)(.*)(?=<\/td>)/g;
		const infoRegex = /(?<=<td>)([\s\S]*?)(?=<\/td>)/g;
		examsTable.forEach(ex => {
			const start = Course.createDate_(ex.match(dateRegex)[0]);
			const info = ex.match(infoRegex);
			const type = info[1].trim();

			//filter future exams and filter by type
			if(start.valueOf() >= new Date().setHours(0,0,0,0) && (this.type[0] === "*" || this.type.includes(type))){
			const end = new Date(start.getTime() + this.duration*60*60*1000);

			const enrollment = info[0].replace(/(<\/span>)*\s+(<span>)*/g, " ").trim();
			const classroom = info[2].trim();
			const note = info.length > 3 ? info[3].trim() : "";

			exams.push(new Exam(this, start, end, "").createDescription(enrollment, type, classroom, note));
			}
		});
    }
		return exams.filter(ex => !this.skipExams(ex));
	}

	getExamsCalendar_(calendar){
		const start = new Date(new Date().setHours(0,0,0,0));
		const end = new Date(start.getTime() + 1.5*365*24*60*60*1000); // 1.5 years
		const events = calendar.getEvents(start, end, {search: this.name});

		return events
			.filter(event => (this.type[0] === "*" || event.getDescription() == "NON presente su AlmaEsami" || this.type.some(type => event.getDescription().includes(type)))) //filter by type + manually added
			.map(event => new Exam(this, event.getStartTime(), event.getEndTime(), event.getDescription()));
	}

	static createDate_(dateString) {
		//format ex.: 17 luglio 2023 ore 14:30
		const dateSplitted = dateString.split(/[\s:]+/g);

		const day = dateSplitted[0];
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
		];
		const month = allMonths.indexOf(dateSplitted[1]);
		const year = dateSplitted[2];

		const hour = dateSplitted[4];
		const minutes = dateSplitted[5];

		return new Date(year, month, day, hour, minutes);
	}
}