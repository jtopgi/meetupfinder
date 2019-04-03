require('dotenv').config()

let express = require('express');
let moment = require('moment');
let app = express();
let handlebars = require('express-handlebars').create({
  defaultLayout: 'main',
  helpers: {
    currentDate: function () { return moment().format('YYYY-MM-DD');}
  }
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 3000);
app.use(express.static('public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

app.get("/", function(request, response) {
  let requestMeetup = require("./modules/requestMeetup.js");

  requestMeetup(request.query.date || moment(), 60657, function(events){
    response.render('home', {events: events});
  });
});

app.listen(app.get('port'), function() {
  console.log(
    'Express started on http://localhost:' +
    app.get('port') +
    '; press Ctrl-C to terminate.'
  );
});
