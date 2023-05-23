/**
 * Creates a new DegreeProgramme object
 *
 * @param {String} examsUrl url of the exams page of the degree programme (es. "https://corsi.unibo.it/laurea/IngegneriaInformatica/appelli")
 * @return {DegreeProgramme} degree programme object
 */
function getDegreeProgramme(examsUrl){
	return new DegreeProgramme(examsUrl);
}