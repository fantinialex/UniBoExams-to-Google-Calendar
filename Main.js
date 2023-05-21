function main(){
	let calendar = CalendarApp.getCalendarsByName('Università appelli esami')[0];

	let courses = [
		new Course("Corso 1", ["Scritto"], 3),
		new Course("Corso 2", ["*"], 2)
	];

	courses.forEach(c => c.createExams(calendar));
}

function manual(){
	let calendar = CalendarApp.getCalendarsByName('Università appelli esami')[0];

	new Course("Corso 1", ["*"], 1).addManual(calendar, [new Date(2023, 1, 1, 14, 0)])
}