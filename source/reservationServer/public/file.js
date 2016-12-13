var monthname = ["Januar", "Februar", "Maerz", "April", "Mai",
        "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
var selectedDay = new Date();
var today = new Date();
var time = 30000;
function getMonthPage(month, year){
    var monthPageSize = 42; //size of month page = 7 * 5
    var date = new Date(year, month, 1, 2);
    date.setDate(date.getDate()-getDay(date, 1));
    var monthPage = {day:[],month:[],year:[],dateString:[], classes:[], clickable:[]};
	for(var i=0;i<monthPageSize;i++){
        classes = [];
        if(date.getMonth() != month)
            classes.push("othermonth");
        if(getDateString(date) == getDateString(selectedDay))
            classes.push("selected");
        if (parseInt(getDateString(date)) < parseInt(getDateString(today))){
            classes.push("olddate");
            monthPage.clickable.push(false);
        }else
            monthPage.clickable.push(true);
        monthPage.classes.push(classes.join(" "))
        monthPage.dateString.push(getDateString(date));
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
function changeCurrentDate(dat){
    date = dat + "";
    selectedDay = new Date(date.substring(0,4), date.substring(4, 6), date.substring(6,8));
    updateMonth(selectedDay.getMonth(), selectedDay.getFullYear());
    updateTimetable();
}
function updateMonth(month, year){
    var output ="";
    var page = getMonthPage(month, year);
    for(var a=0;a<page.day.length;a++){
        output=output+"<li class='"+page.classes[a]+"' "+
        (((page.clickable[a]))?("onclick='changeCurrentDate("+page.dateString[a]+")'"):"")+
        ">"+page.day[a]+"</li>";
    }
    $("#input").html(output.toString());
    $("#month_name").html(monthname[month]+"<br><span style='font-size:18px'>"+year+"</span>");
}
function getDBString(date){
    return ("" + date.getFullYear() + "-" + ("0" + date.getMonth()).slice(-2) + "-" + ("0" + date.getDate()).slice(-2));
}
function getDateString(date){
    return ("" + date.getFullYear() + ("0" + date.getMonth()).slice(-2) + ("0" + date.getDate()).slice(-2));
    
}
$(document).ready(function() {
    var month=selectedDay.getMonth();
    var year = selectedDay.getFullYear();
    updateMonth(month, year);
    updateTimetable();

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
    $('#occupied').click(function(){
        $.post('sensordata',{sensor1:1, sensor2:2, isoccupied:true},function(data){
            console.log(JSON.stringify(data));
        });
    });
    updateOccupied();
    window.setInterval(updateOccupied, time);
});



$.parkPOST = function(action,data,callback){
    data.action = action;
	$.post('request?action='+action,data,callback,'json');
};

$.parkGET = function(action,data,callback){
	$.get('request?action='+action,data,callback,'json');
};

function updateOccupied(){
        $.parkPOST("getOccupied", {}, function(data){
            if(data.occupied)
                $('#occupied').css("background-color", "red");
            else
                $('#occupied').css("background-color", "green");
                
        });
    
}

function generateTimetable(information){
    var timeTable = {time:[], clas:[], content:[], onclick:[]};
    for(var i=0;i<24;i++){
        timeTable.time.push(("0"+i).slice(-2));
        var index = getIndex(information, ("0"+i).slice(-2));
        if(index >= 0){
            timeTable.clas.push("reserved");
            timeTable.content.push(information[index].comment);
            timeTable.onclick.push(false);
            
        }else{
            timeTable.clas.push("freetime");
            timeTable.content.push("");
            timeTable.onclick.push(true);
            
        }
    }
    return timeTable;
}

function updateTimetable(){
    $.parkPOST("getreservation",{month:getDBString(selectedDay), datestart: new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), 1).toISOString(), dateend:  new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), 24, 59).toISOString()},function(data){
        var output = "";
        var timeTable = generateTimetable(data);
        for(var i=0;i<24;i++){
            output += "<tr><th>"+timeTable.time[i]+":00</th><td "+(timeTable.onclick[i]?("onclick='reservateThisTime(" + timeTable.time[i] + ")'"):"") +" class='" + timeTable.clas[i] + "'>"+timeTable.content[i]+"</td></th>";
        }
        $('#timetable_table').html(output.toString());
    });
    
}
function getIndex(array, comparer){
    for(var i=0; i<array.length; i++){
        if((((new Date(array[i].date)).getHours())) == comparer){
            return i;
        }
    }
    return -1;
}

function reservateThisTime(time){
    $.parkPOST("reservate", {datetime:  selectedDay.getFullYear()+"-"+(selectedDay.getMonth()+1)+"-"+selectedDay.getDate()+" "+time+":00:00", comment:"auto generated comment"}, function(data){
        if(data.success){
            
        }else{
            alert("something went wrong");
        }
    });
    updateTimetable();
}


