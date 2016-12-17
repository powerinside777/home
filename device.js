var mqtt    = require('mqtt');
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8083;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var User      = require('./app/models/user');
var MQTT_HOST = "10.0.0.57:8443";
var MQTT_BROKER_USER = "admin";
var MQTT_BROKER_PASS = "Isabella2030";
var alamrzones = {};
var Alarmstate = false;
var alarmcode = require('./app/alarm.js');
var settings = {
    username:MQTT_BROKER_USER,
    password:MQTT_BROKER_PASS
}


var mqtt_client  = mqtt.connect(MQTT_HOST,settings);
mqtt_client.on('connect', function () {
    mqtt_client.subscribe('house/alarm/');
    console.log('MQTT:','connected');
});


var db = mongoose.connection;

var configDB = require('./config/database.js');

// configuration ===============================================================

mongoose.connect(configDB.url,{server:{auto_reconnect:true}},function(err) {
    if (err)
        return console.error(err);

}); // connect to our database
db.on('error', function(error) {
    console.error('Error in MongoDb connection: ' + error);
    mongoose.disconnect();
});
db.on('disconnected', function() {
    console.log('MongoDB disconnected!');
    var now = new Date().getTime();
    // check if the last reconnection attempt was too early
    if (lastReconnectAttempt && now-lastReconnectAttempt<5000) {
        // if it does, delay the next attempt
        var delay = 5000-(now-lastReconnectAttempt);
        console.log('reconnecting to MongoDB in ' + delay + "mills");
        setTimeout(function() {
            console.log('reconnecting to MongoDB');
            lastReconnectAttempt=new Date().getTime();
            mongoose.connect(configDB.url, {server:{auto_reconnect:true}});
        },delay);
    }
    else {
        console.log('reconnecting to MongoDB');
        lastReconnectAttempt=now;
        mongoose.connect(configDB.url, {server:{auto_reconnect:true}});
    }

});
db.on('connected', function() {
    console.log('conected');

});
require('./config/passport')(passport); // pass passport for configuration

app.configure(function() {

    // set up our express application
    app.use(express.logger('dev')); // log every request to the console
    app.use(express.cookieParser()); // read cookies (needed for auth)
    app.use(express.bodyParser()); // get information from html forms
    app.use("/css", express.static(__dirname + '/web/css'));
    app.use("/js", express.static(__dirname + '/web/js'));
    app.use("/assets", express.static(__dirname + '/web/assets'));
    app.use("/bower_components", express.static(__dirname + '/web/bower_components'));
    app.use("/img", express.static(__dirname + '/web/img'));
    app.set('view engine', 'ejs'); // set up ejs for templating

    // required for passport
    app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // use connect-flash for flash messages stored in session

});

// routes ======================================================================
require('./app/routes.js')(app, passport,Alarmstate); // load our routes and pass in our app and fully configured passport
require('./app/alarm.js')(mqtt_client,User,Alarmstate); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
