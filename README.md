# UniBo Exams to Google Calendar

**DISCLAIMER:** The project is in beta, it has been made public only to facilitate the dissemination of these instructions among betatesters.

## What to do
1. Create a project on [Google Scripts](https://developers.google.com/apps-script/guides/projects#create_a_project_from)
2. Add the following Script ID as [library](https://developers.google.com/apps-script/guides/libraries#add_a_library_to_your_script_project) ```1FWgHdsxStnyBOgVnQprysvsfFrBg7GPu8MyNxxyhePZtEkb27ktlCVou```
3. Write your own code, following the examples below
4. Optionally, set the triggers to run the script automatically

## Example code

```js
function checkExams(){
	let calendar = CalendarApp.getCalendarsByName('University Exams')[0];
	let mail = "my.mail@example.com";

	let dp = UniBoExams.getDegreeProgramme("https://corsi.unibo.it/laurea/IngegneriaInformatica/appelli");
  
	let courses = [
		dp.getCourse("Analisi matematica T-1", ["Scritto"], 2.5)
	];

	courses.forEach(c => c.createExams(calendar, mail));
}
```
```UniBoExams``` is the identifier of the library 

## Main methods available
**DegreeProgramme**
- getCourse(name, type, duration)

**Course**
- createExams(calendar, mail)
- addManual(calendar, dates)
- deleteAllFuture(calendar)