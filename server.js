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
  var interval = moment.utc() + ',' + moment.utc().add(3,'days');
  request('https://api.meetup.com/2/open_events?&sign=true&photo-host=public&zip=60657&time=' + interval + '&radius=10&key=' + process.env.meetupKey, async function(error, response, body) {
    var data = JSON.parse(body)
    var events = [];
    var location, travelTime, url;

    for (var i = 0; i < data.meta.count; i++) {
      if (data.results[i].venue === undefined || data.results[i].waitlist_count > 0) {
        continue;
      }
      location = data.results[i].venue.lat + ',' + data.results[i].venue.lon;
      travelTime = await getTime(location);
      if(travelTime > 20 || travelTime == -1){
        continue;
      }

      events.push({
        groupName: data.results[i].group.name,
        eventName: data.results[i].name,
        location: location,
        url: data.results[i].event_url,
        startTime: moment(data.results[i].time).format('h:mm a').replace(/ /g, '\u00a0'),
        description: data.results[i].description
      });
    }

    var context = {};
    context.events = events;
    res.render('home', context);
  });
});

function getTime(location) {
  return new Promise(function(resolve, reject) {
    request('https://maps.googleapis.com/maps/api/directions/json?origin=' + location + '&destination=' + process.env.destination + '&mode=transit&key=' + process.env.googleKey, function(error, response, body) {
      if (JSON.parse(body).status == 'OK') {
        resolve(JSON.parse(body).routes[0].legs[0].duration.text.replace(/\D/g, ''));
      } else {
        resolve(-1);
      }
    });
  });
}


app.listen(app.get('port'), function() {
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
