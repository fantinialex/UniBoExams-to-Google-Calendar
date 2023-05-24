class Exam{
	constructor(course, start, end, description){
		this.course = course;
		this.start = start;
		this.end = end;
		this.description = description;
	}

	createDescription(enrollment, tipe, classroom, note){
		this.description = "Iscrizioni: "+enrollment+"\nTipo: "+tipe+"\nAula: "+classroom;
		if(note !== "")
			this.description += "\nNote:\n"+note;
		return this;
	}

	create(calendar){
		calendar.createEvent(this.course.name, this.start, this.end, {description: this.description});
	}

	update(calendar){
		this.delete(calendar);
		this.create(calendar);
	}

	delete(calendar){
		//cecrco tutti gli eventi con lo stesso nome e data
		const events = calendar.getEvents(this.start, this.end, {search: this.course.name});
		if(events.length === 1) //se è univoco lo cancello
			events[0].deleteEvent();
		else{ //se non è univoco cerco quello con la descrizione uguale
			const filteredEvents = events.filter(event => event.getDescription() === this.description);
			if(filteredEvents.length === 1)
				filteredEvents[0].deleteEvent();
			else //altrimenti non lo cancello
				throw new Error("Non è stato possibile cancellare "+this.course.name+" del "+this.start+" perché non è univoco");
		}
	}

	toString(){
		return this.course.name+"<br>Start: "+this.start+"<br>End: "+this.end+"<br>"+this.description.replaceAll("\n", "<br>");
	}

	equals(exam, deep){
		const deepChecks = this.end.valueOf() === exam.end.valueOf() && this.description === exam.description;
		return this.course.name === exam.course.name && this.start.valueOf() === exam.start.valueOf() && (deep ? deepChecks : true);
	}
}