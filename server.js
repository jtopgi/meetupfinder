require('dotenv').config()

var express = require('express');
var request = require('request');
var moment = require('moment');
var app = express();
var handlebars = require('express-handlebars').create({
  defaultLayout: 'main'
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 3000);
app.use(express.static('public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

function restrictTransitTime(events, index, callback) {
  const destination = process.env.destination; //TODO: query client for destination

  if (index >= events.length) {
    callback(events);
    return;
  }

  let resource =
    'https://maps.googleapis.com/maps/api/directions/json' +
    `?origin=${events[index].venue.lat},${events[index].venue.lon}` +
    `&destination=${destination}` +
    //      `&departure_time=${item.end_time}` +
    '&mode=transit' +
    `&key=${process.env.googleKey}`;

  request(resource, function(error, response, body) {
    if (error) throw error;

    value = JSON.parse(body).routes[0].legs[0].duration.value;
    if (value > 900) {
      events.splice(index, 1);
    } else {
      index++;
    }

    restrictTransitTime(events, index, callback);
  });
}

function requestMeetup(date, zip, callback) {
  let startTime = moment(date).valueOf();
  let endTime = moment(date).endOf('day').valueOf();

  let resource =
    'https://api.meetup.com/2/open_events?&sign=true&photo-host=public' +
    `&zip=${zip}` +
    `&time=${startTime},${endTime}` +
    '&radius=2' +
    `&key=${process.env.meetupKey}`;

  request(resource, function(error, response, body) {
    if (error) throw error;

    let events = [];

    for (let item of JSON.parse(body).results) {
      if (
        item.yes_rsvp_count == 0 ||
        item.waitlist_count > 0 ||
        item.venue == undefined
      ) {continue;}

      events.push({
        venue: {
          lon: item.venue.lon,
          lat: item.venue.lat
        },
        description: item.description,
        event_url: item.event_url,
        name: item.name,
        start_time: item.time,
        end_time: item.time + item.duration
      });
    }

    restrictTransitTime(events, 0, callback);
  });
}

//TODO: query for zip
app.get("/", function(request, response) {
  requestMeetup(moment().startOf('day').add(1, 'day'), 60657, function(events){
    console.log(events);
  });
});


//app.get('/', function(req, res) {
//  let today = moment().format("YYYYMMDD");
//  let firstDate = moment(req.query.startDate || today, "YYYYMMDD").startOf('d').utc();
//  let lastDate = moment(req.query.endDate || today, "YYYYMMDD").endOf('d').utc();
//
//  request('https://api.meetup.com/2/open_events?&sign=true&photo-host=public&zip=60657&time=' + firstDate + ',' + lastDate + '&radius=2&key=' + process.env.meetupKey, async function(error, response, body) {
//    if (error) throw error;
//    let parsedBody = JSON.parse(body);
//    let results = parsedBody.results;
//    let location, travelTime, url;
//    let dates = [];
//    let dayMsec = moment.duration(1, 'd');
//
//    for (let i = 0; i < (lastDate - firstDate) / dayMsec; i++) {
//      dates.push({
//        day: firstDate + (dayMsec * i),
//        events: []
//      })
//    }
//
//    for (let i = 0; i < parsedBody.meta.count; i++) {
//      if (results[i].venue === undefined || results[i].waitlist_count > 0 || results[i].time < moment()) continue;
//
//      let location = results[i].venue.lat + ',' + results[i].venue.lon;
//      let endTimeSecs = (results[i].time + results[i].duration || results[i].time + moment.duration(3, 'h')) / 1000;
//      let travelTime = await getTime(location, endTimeSecs);
//      if (travelTime > 30 || travelTime == -1) continue;
//
//      let resultObj = {
//        groupName: results[i].group.name,
//        eventName: results[i].name,
//        url: results[i].event_url,
//        startTime: moment(results[i].time).format('h:mm&#160;a'),
//        description: results[i].description
//      };
//
//      for (let j = 0; j < dates.length; j++) {
//        if (results[i].time >= dates[dates.length - 1].day) {
//          dates[dates.length - 1].events.push(resultObj);
//          break;
//        } else if (results[i].time <= dates[j + 1].day) {
//          dates[j].events.push(resultObj);
//          break;
//        }
//      }
//    }
//
//    let context = {};
//    context.dates = dates;
//    res.render('home', context);
//  });
//});

function getTime(location, departure) {
  return new Promise(function(resolve, reject) {
    request('https://maps.googleapis.com/maps/api/directions/json?origin=' + location + '&destination=' + process.env.destination + '&departure_time=' + departure + '&mode=transit&key=' + process.env.googleKey, function(error, response, body) {
      if (error) throw error;
      let parsedBody = JSON.parse(body);
      if (parsedBody.status == 'OK') {
        resolve(parsedBody.routes[0].legs[0].duration.text.replace(/\D/g, ''));
      } else {
        resolve(-1);
      }
    });
  });
}


app.listen(app.get('port'), function() {
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
