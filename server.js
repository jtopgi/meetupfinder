require('dotenv').config()

let express = require('express');
let moment = require('moment');
let app = express();
let handlebars = require('express-handlebars').create({
  defaultLayout: 'main',
  helpers: {
    timeFormat: function(epoch) { return moment.unix(epoch).format('h:mm a');}
  }
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);
app.use(express.static('public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

app.get("/", function(request, response) {
  let requestMeetup = require("./modules/requestMeetup.js");

  if (request.query.date) {
    requestMeetup(request.query.date, 60614, function(events){
      response.render('home', {events: events});
    });
  } else {
    response.render('home');
  }
});

app.listen(app.get('port'), function() {
  console.log(
    'Express started on http://localhost:' +
    app.get('port') +
    '; press Ctrl-C to terminate.'
  );
});
