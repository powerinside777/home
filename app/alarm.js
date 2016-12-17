var _ = require('underscore');
var modem = require('simcom').modem('/dev/ttyAMA0');
var User       		= require('./models/user.js');
var nodemailer = require("nodemailer");
var net = require('net');
var HOST = '127.0.0.1';
var PORT = 6969;
var pirs = [];
var outputs = [];
var rollingcode = [];
var ntimeout=5000;
var delayTime=35000;
var phonenumbers = [];
var alarmcode = ''
var alarmistripper = false
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "powerinside777@gmail.com",
        pass: "myjesus0101"
    }
});
var rpi433    = require('rpi-433'),
rfSniffer = rpi433.sniffer({
    pin: 1,                     //Snif on GPIO 2 (or Physical PIN 13)
    debounceDelay: 500          //Wait 500ms before reading another code
}),
rfEmitter = rpi433.emitter({
    pin: 0,                     //Send through GPIO 0 (or Physical PIN 11)
    pulseLength: 350            //Send the code with a 350 pulse length
});

function sendEmail(message) {

    var mailOptions={
        to : "powerinside777@gmail.com",
        subject : 'House Alarm',
        text :message
    }
    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
            res.end("error");
        }else{
            console.log("Message sent: " + response.message);
            res.end("sent");
        }
    });
}


function sendsms(message) {
    simcom.on('open', function () {
        var promise = null;


        _.forEach(phonenumbers, function (value, key) {

            promise = this.sendSMS(value, message);


            promise.then(function (res) {
                console.log(res);
            }).catch(function (error) {
                console.log('ERR', error);
            });


            promise.done(function () {
                simcom.close();
            });
        });

    })
}
function sendamx(message) {

    socket = net.connect("8090", "10.0.0.100");
    socket.on('connect', function() {
        socket.write(message);
        console.log('conected')
        socket.destroy()
    });
    socket.on('error', function() {
        console.log('conected')

    });
    console.log('yip')
}
module.exports = function(mqtt_client,User,Alarmstate) {

    var Goalarm = function(state){
        if(state == true){
            _.forEach(outputs, function(value, key) {

                rfEmitter.sendCode(outputs[key]+'on', function (error, stdout) {   //Send 1234
                    if (!error) console.log(stdout); //Should display 1234
                });
            });
            sendsms("Alarm has beeen trigger please attended now")

            sendamx('alarmon')

        }
        if(state == false) {
            Alarmstate = false;
            _.forEach(outputs, function(value, key) {

                rfEmitter.sendCode(outputs[key]+'off', function (error, stdout) {   //Send 1234
                    if (!error) console.log(stdout); //Should display 1234
                });
            });
            sendamx('alarmoff')

        }
    }

    // Receive (data is like {code: xxx, pulseLength: xxx})
    rfSniffer.on('data', function (data) {
      console.log(data.code);
            _.forEach(pirs, function(value, key) {
                if (value[key] == data.code) {
                    if(Alarmstate === true && alarmistripper ==false){
                        alarmistripper = true;
                        sendamx('alarmTripped');
                        setTimeout(function () {
                            if(Alarmstate === true)
                            {
                                Goalarm(true);
                                sendEmail('Zone ' +key.toString() +' has tripped alarm is active')
                              var timer1 = setTimeout(function () {
                                Goalarm(false);
                                Alarmstate = true;
                                alarmistripper = false;

                              },500000)
                            }
                        }, ntimeout)
                    }


                }

            });

         });
    mqtt_client.on('message', function (topic, message) {
        console.log('MQTT:'+topic+':'+message.toString());
        if(topic == 'house/alarm/'){
          if(message.toString() == 'ARM') {

              setTimeout(function(){
                Alarmstate = true;
                sendamx('Alarm state On')
          },delayTime)
          }
            if(message.toString() == 'Code='){

                    var arr = message.toString().split("=");
                    if(arr[1] == alarmcode)
                    {
                        Goalarm(false)
                      clearTimeout(timer1);
                    }

            }

        }
    });

    net.createServer(function(sock) {

        // We have a connection - a socket object is assigned to the connection automatically
        console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);

        // Add a 'data' event handler to this instance of socket
        sock.on('data', function(data) {
            console.log(data)
            _.forEach(rollingcode, function(value, key) {
                if (value == data) {
                    Goalarm(false)

                }
            });

        });

        // Add a 'close' event handler to this instance of socket
        sock.on('close', function(data) {
            console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
        });

    }).listen(PORT, HOST);
};

setInterval(function(){
    User.findOne({ 'local.email' :  "josh" }, function(err, data) {
        if (err) {
            console.log(err);
            return;
        }

        // if no user is found, return the message
        if (!data)
            return;

        _.forEach(data.local.inputdevices, function(value, key) {
            pirs[key] = value
        });
        _.forEach(data.local.outputdevices, function(value, key) {
            outputs[key] = value
        });
        _.forEach(data.local.codes, function(value, key) {
            rollingcode[key] = value

        });
        _.forEach(data.local.phonenumbers, function(value, key) {
            phonenumbers[key] = value

        });

        alarmcode = data.local.code;
        ntimeout = data.local.timeout;
      delayTime = data.local.delaytime

    });

},100000)

User.findOne({ 'local.email' :  "josh" }, function(err, data) {
  if (err) {
    console.log(err);
    return;
  }

  // if no user is found, return the message
  if (!data)
    return;

  _.forEach(data.local.inputdevices, function(value, key) {
    pirs[key] = value
  });
  _.forEach(data.local.outputdevices, function(value, key) {
    outputs[key] = value
  });
  _.forEach(data.local.codes, function(value, key) {
    rollingcode[key] = value

  });
  _.forEach(data.local.phonenumbers, function(value, key) {
    phonenumbers[key] = value

  });

  alarmcode = data.local.code;
  ntimeout = data.local.timeout;
  delayTime = data.local.delaytime

});

