/* boilerplate code */
var express = require('express');
var request = require('request');

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
  request('https://api.meetup.com/2/open_events?&sign=true&photo-host=public&zip=60657&radius=5&page=20&key=' + meetupKey, async function(error, response, body) {
    var data = JSON.parse(body)
    var events = [];
    var location, time, url;

    


    for (var i = 11; i < data.meta.count; i++) {
      console.log(data.results[i]);
      location = data.results[i]['venue']['lat'] + ',' + data.results[i]['venue']['lon'];
      time = await getTime(location);
      events.push({
        name: data.results[i]['name'],
        location: location,
        time: time
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
      resolve(5);
    });
  });
}

app.listen(app.get('port'), function() {
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
