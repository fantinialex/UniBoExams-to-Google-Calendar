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
		this.report += Report.highlightDifferences(o.toString(), n.toString())+"<br><br>";
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
				subject: "Report esami "+this.course.name + Report.printTypes(this.course.type),
				htmlBody: this.report
			});
		this.reset();
	}

	/**
	 * Highlight differences between two strings
	 *
	 * @param {String} o old string
	 * @param {String} n new string
	 * @return {String} html string with differences highlighted
	 */
	static highlightDifferences(o, n){
		let dmp = new diff_match_patch();
		const diffs = dmp.diff_main(o, n);
		dmp.diff_cleanupSemantic(diffs);

		//custom html for diffs: highlight diffs for lines
		let result = "";
		for(let i=0; i<diffs.length; i++){
			switch(diffs[i][0]){
				case 0:{
					const tmp = diffs[i][1].split("<br>");
					const from = i-1>=0 && !diffs[i-1][1].endsWith("<br>") ? 1 : 0;
					const to = i+1 < diffs.length && !diffs[i+1][1].startsWith("<br>") ? tmp.length-1 : tmp.length;
					for(let c=from; c<to; c++)
						result += tmp[c]+"<br>";
					}break;
				case -1:
				case 1:{
					const color = diffs[i][0] == -1 ? "#ffe6e6" : "#e6ffe6";
					result += "<span style='background-color:"+color+"'>";

					//find previous
					let previous = "";
					if(!diffs[i][1].startsWith("<br>")){
						for(let j=i-1; j>=0; j--)
							if(diffs[j][0] == 0){
								let tmp = diffs[j][1].split("<br>");
								previous = tmp[tmp.length-1];
								break;
							}
						result += previous;
					}

					//diff
					result += "<b>"+diffs[i][1]+"</b>";

					//find next
					let next = "";
					if(!diffs[i][1].endsWith("<br>")){
						for(let j=i+1; j<diffs.length; j++)
							if(diffs[j][0] == 0){
								next = diffs[j][1].split("<br>")[0];
								break;
							}
						result += next;
					}

					result += "</span>" + ((previous != "" || next != "") ? "<br>" : "");

					//if there is only one diff and it isn't a line change, report the whole line
					if(!((i-1>=0 && diffs[i-1][0]!=0) || (i+1<diffs.length && diffs[i+1][0]!=0)) && (previous != "" || next != "")){
						const color = diffs[i][0] == 1 ? "#ffe6e6" : "#e6ffe6";
						result += "<span style='background-color:"+color+"'>";
						result += previous;
						result += next;
						result += "</span><br>";
					}

					}break;
			}
		}
		return result;
	}

	/**
	 * Print types of an exam
	 * 
	 * @param {String[]} types array of types
	 * @return {String} string with types
	 */
	static printTypes(types){
		if(types[0] === "*")
			return "";
		else{
			let result = " [";
			types.forEach(t => {
				result += t+", ";
			});
			result = result.substring(0, result.length-2);
			result += "]";
			return result;
		}
	}
}