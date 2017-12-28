var express = require('express');
var request = require('request');
var moment = require('moment');

var app = express();
var handlebars = require('express-handlebars').create({
  defaultLayout: 'main'
});
require('dotenv').load();

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 3000);
app.use(express.static('public'));

app.get('/', function(req, res) {
  var firstDate = moment(req.query.startDate || moment().format("YYYYMMDD"), "YYYYMMDD").startOf('day').utc();
  var lastDate = moment(req.query.endDate || moment().format("YYYYMMDD"), "YYYYMMDD").endOf('day').utc();
  request('https://api.meetup.com/2/open_events?&sign=true&photo-host=public&zip=60657&time=' + firstDate + ',' + lastDate + '&radius=5&key=' + process.env.meetupKey, async function(error, response, body) {
    var data = JSON.parse(body)
    var location, travelTime, url;
    var dates = [];

    for(var i = 0; i < (lastDate - firstDate)/86400000; i++){
      dates.push({
        day: firstDate + (86400000 * i),
        events: []
      })
    }

    for (var i = 0; i < data.meta.count; i++) {
      if (data.results[i].venue === undefined || data.results[i].waitlist_count > 0) {
        continue;
      }

      location = data.results[i].venue.lat + ',' + data.results[i].venue.lon;
      travelTime = await getTime(location);
      if(travelTime > 20 || travelTime == -1){
        continue;
      }

      for(var j = 0; j < dates.length; j++){
        if(data.results[i].time >= dates[dates.length - 1].day){
          dates[dates.length - 1].events.push({
            groupName: data.results[i].group.name,
            eventName: data.results[i].name,
            location: location,
            url: data.results[i].event_url,
            date: moment(data.results[i].time).format("L"),
            startTime: moment(data.results[i].time).format('h:mm a').replace(/ /g, '\u00a0'),
            description: data.results[i].description
          });
          break;
        }
        else if(data.results[i].time <= dates[j + 1].day){
          dates[j].events.push({
            groupName: data.results[i].group.name,
            eventName: data.results[i].name,
            location: location,
            url: data.results[i].event_url,
            date: moment(data.results[i].time).format("L"),
            startTime: moment(data.results[i].time).format('h:mm a').replace(/ /g, '\u00a0'),
            description: data.results[i].description
          });
          break;
        }
      }
    }

    var context = {};
    context.dates = dates;
    res.render('home', context);
  });
});

function getTime(location) {
  return new Promise(function(resolve, reject) {
    request('https://maps.googleapis.com/maps/api/directions/json?origin=' + location + '&destination=' + process.env.destination + '&mode=transit&key=' + process.env.googleKey, function(error, response, body) {
      if (JSON.parse(body).status == 'OK') {
        resolve(JSON.parse(body).routes[0].legs[0].duration.text.replace(/\D/g, ''));
      } else {
        resolve("N/A");
      }
    });
  });
}


app.listen(app.get('port'), function() {
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
