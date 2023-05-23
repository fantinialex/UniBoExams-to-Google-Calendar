class Report{
	constructor(course, mail){
		this.course = course;
		this.mail = mail;
		this.report = "";
	}

	reset(){
		this.report = "";
	}

	add(exam){
		this.report += "<b>Aggiunto esame:</b><br>"
		this.report += exam.toString()+"<br><br>";
		console.log("Creato "+this.course.name+" del "+exam.start);
	}

	update(o, n){
		this.report += "<b>Aggiornato esame:</b><br>"
		this.report += "<u>Versione precedente:</u><br>"+o.toString()+"<br>";
		this.report += "<u>Nuova versione:</u><br>"+n.toString()+"<br><br>";
		console.log("Aggiornato "+this.course.name+" del "+o.start);
	}

	delete(exam){
		this.report += "<b>Cancellato esame:</b><br>"
		this.report += exam.toString()+"<br><br>";
		console.log("Eliminato "+this.course.name+" del "+exam.start);
	}

	error(exam){
		this.report += "<b>ERRORE esame:</b><br>"
		this.report += exam.toString()+"<br><br>";
		console.log("Errore "+this.course.name+" del "+exam.start);
	}

	send(){
		if(this.report != "" && this.mail != "")
			MailApp.sendEmail({
				to: this.mail,
				subject: "Report esami "+this.course.name,
				htmlBody: this.report
			});
		this.reset();
	}
}