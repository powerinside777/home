/**
 * Created by JoshHodgetts on 16/12/2016.
 */
var mqtt    = require('mqtt');
var MQTT_HOST = "mqtt://10.0.0.61:1883";
var settings = {
    username:'',
    password:''
}
var mqtt_client  = mqtt.connect(MQTT_HOST,settings);
mqtt_client.on('connect', function () {
    mqtt_client.subscribe('home');
    console.log('MQTT:','connected');

});
mqtt_client.on('message', function (topic, message) {
    console.log('MQTT:'+topic+':'+message.toString());

});