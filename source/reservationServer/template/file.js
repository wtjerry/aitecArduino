var monthname = ["Januar", "Februar", "Maerz", "April", "Mai",
        "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function getMonthPage(month, year){
    var monthPageSize = 35; //size of month page = 7 * 5
    var date = new Date(year, month, 1, 2);
    date.setDate(date.getDate()-getDay(date, 1));
    var monthPage = {day:[],month:[],year:[]};
	for(var i=0;i<monthPageSize;i++){
    	monthPage.day.push(date.getDate());
        monthPage.month.push(date.getMonth());
        monthPage.year.push(date.getFullYear());
        date.setDate(date.getDate()+1);
    }
    return monthPage;
}
function getDay(date, startingDay=1){
	var day = date.getDay();
	while(startingDay>0){
    	day = (day==0)?(6):(--day);
        startingDay--;
    }
    return day;
}
function updateMonth(month, year){
    var output ="";
    var page = getMonthPage(month, year);
    for(var a=0;a<page.day.length;a++){
        output=output+"<li "+((page.month[a]==month)?"":"class='othermonth'")+">"+page.day[a]+"</li>";
    }
    $("#input").html(output.toString());
    $("#month_name").html(monthname[month]+"<br><span style='font-size:18px'>"+year+"</span>");
}
$(document).ready(function() {
    var month=10;
    var year = 2016;
    updateMonth(month, year)

    $("#prev").click(function(){
        if(month<=0){
            month=11;
            year--;
        }else
            month--;
        updateMonth(month, year);
    });
    $("#next").click(function(){
        if(month>=11){
            month=0;
            year++;
        }else
            month++;
        updateMonth(month, year);
    });
});
