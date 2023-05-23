class DegreeProgramme{
	constructor(examsUrl){
		this.examsUrl = examsUrl;
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
		return new Course(this, name, type, duration);
	}

}