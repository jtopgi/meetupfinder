let request = require('request');
let moment = require('moment');

module.exports = function requestMeetup(date, zip, callback) {
  let startTime = moment(date);

  if (moment().startOf('day') != startTime.startOf('day')) {
    startTime = startTime.startOf('day');
  }
  startTime = startTime.valueOf();
  let endTime = moment(date).endOf('day').valueOf();

  let resource =
    'https://api.meetup.com/2/open_events?&sign=true&photo-host=public' +
    `&zip=${zip}` +
    `&time=${startTime},${endTime}` +
    '&radius=3' +
    `&key=${process.env.meetupKey}`;

  request(resource, function(error, response, body) {
    if (error) throw error;

    let events = [];

    for (let item of JSON.parse(body).results) {
      if (
        item.yes_rsvp_count == 0 ||
        item.waitlist_count > 0 ||
        item.venue == undefined ||
        item.duration == undefined
      ) {continue;}

      events.push({
        venue: {
          lon: item.venue.lon,
          lat: item.venue.lat
        },
        description: item.description,
        event_url: item.event_url,
        name: item.name,
        start_time: item.time / 1000,
        end_time: (item.time + item.duration) / 1000,
        group: {
          name: item.group.name
        }
      });
    }

    restrictTransitTime(events, 0, callback);
  });
}

function restrictTransitTime(events, index, callback) {
  const destination = process.env.destination; //TODO: query client for destination
  const MAXTRANSITTIME = 20 * 60; //20 minutes

  if (index >= events.length) {
    callback(events);
    return;
  }

  let resource =
    'https://maps.googleapis.com/maps/api/directions/json' +
    `?origin=${events[index].venue.lat},${events[index].venue.lon}` +
    `&destination=${destination}` +
    `&departure_time=${events[index].end_time}` +
    '&mode=transit' +
    `&key=${process.env.googleKey}`;

  request(resource, function(error, response, body) {
    if (error) throw error;

    duration = JSON.parse(body).routes[0].legs[0].duration.value;
    if (duration > MAXTRANSITTIME) {
      events.splice(index, 1);
    } else {
      events[index].transit_time = Math.ceil(duration / 60);
      index++;
    }

    restrictTransitTime(events, index, callback);
  });
}
