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
		//get from calendar all events with same name and date
		const events = calendar.getEvents(this.start, this.end, {search: this.course.name});
		if(events.length === 1) //delete if unique
			events[0].deleteEvent();
		else{ //if not unique, filter by description
			const filteredEvents = events.filter(event => event.getDescription() === this.description);
			if(filteredEvents.length === 1)
				filteredEvents[0].deleteEvent();
			else //don't delete any event
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