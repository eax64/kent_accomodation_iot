// Mostly taken from: https://eclipse.org/paho/clients/js/


// Create a client instance
client = new Paho.MQTT.Client("ws://" + location.hostname + ":9001/", "clientId");

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({onSuccess:onConnect});


// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
    console.log("onConnect");
    client.subscribe("/door");
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
	console.log("onConnectionLost:"+responseObject.errorMessage);
    }
}

// called when a message arrives
function onMessageArrived(message) {
    try {
	obj = jQuery.parseJSON(message.payloadString);
	parse_mqtt(obj);
    }
    catch(err)
    {
	console.log(err.stack);
	console.log(err);
	return;
    }
    
    // console.log(obj);

}

function lockAuthentication(value)
{
    var data = {"cmd": "accessAuthentication"};

    data.data = value;
    
    msg = new Paho.MQTT.Message(JSON.stringify(data));
    msg.destinationName = "/door";
    client.send(msg);
    
}

function parse_mqtt(obj)
{
    if (obj.cmd == "hl")
	hlMeshByTag(obj.data.join("&&"));
    else if (obj.cmd == "rawdata")
    {
	processRawData(obj);
    }
    else if (obj.cmd == "ping")
    {
	g_iot_devices.ping(obj.uuid);
    }
}
