class DegreeProgramme{
	constructor(examsUrl){
		this.examsUrl = examsUrl;
		this.skipExams = () => false;
	}

	/**
	 * Creates a new Course object
	 *
	 * @param {String} name name of the course (es. "Analisi matematica T-1")
	 * @param {String[]} type array of the types of the exam (es. ["Scritto", "Orale"]) or ["*"] for all types
	 * @param {float} duration duration of the exam in hours (es. 1.5)
	 * @return {Course} course object
	 */
	getCourse(name, type, duration){
		return new Course(this, name, type, duration).setSkipExams(this.skipExams);
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

}