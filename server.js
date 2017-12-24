/* boilerplate code */
var express = require('express');
var request = require('request');
var moment = require('moment');

var meetupKey = '407514572207356a7a291a1d324f9'
var googleKey = 'AIzaSyDJmNlBAaUW46Wi36wS1MONYb2I9hsTKs4';
var app = express();
var handlebars = require('express-handlebars').create({
  defaultLayout: 'main'
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 3000);
app.use(express.static('public'));

app.get('/', function(req, res) {
  var interval = moment.utc().startOf('day') + ',' + moment.utc().endOf('day');
  console.log(interval);
  request('https://api.meetup.com/2/open_events?&sign=true&photo-host=public&zip=60657&time='+ interval +'&radius=5&&key=' + meetupKey, async function(error, response, body) {
    var data = JSON.parse(body)
    var events = [];
    var location, travelTime, url;

    for (var i = 0; i < data.meta.count; i++) {
      if (data.results[i].venue === undefined || data.results[i].waitlist_count > 0) {
        continue;
      }
      console.log(data.results[i]);
      location = data.results[i].venue.lat + ',' + data.results[i].venue.lon;
      travelTime = await getTime(location);
      events.push({
        groupName: data.results[i].group.name,
        eventName: data.results[i].name,
        location: location,
        travelTime: travelTime,
        url: data.results[i].event_url,
        startTime: moment(data.results[i].time).format('h:mm a')
      });
    }

    var context = {};
    context.events = events;
    res.render('home', context);
  });
});

function getTime(location) {
  return new Promise(function(resolve, reject) {
    request('https://maps.googleapis.com/maps/api/directions/json?origin=' + location + '&destination=41.939917,-87.652890&mode=transit&key=' + googleKey, function(error, response, body) {
      if (JSON.parse(body).status == 'OK') {
        resolve(JSON.parse(body).routes[0].legs[0].duration.text.replace(/\D/g,''));
      }
    });
  });
}


app.listen(app.get('port'), function() {
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
