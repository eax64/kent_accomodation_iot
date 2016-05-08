// Create a client instance
client = new Paho.MQTT.Client("ws://127.0.0.1:9001/", "clientId");

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
    // message = new Paho.MQTT.Message("Hello");
    // message.destinationName = "/door";
    // client.send(message);
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
	console.log("onConnectionLost:"+responseObject.errorMessage);
    }
}

// called when a message arrives
function onMessageArrived(message) {
    // console.log(message);
    //console.log("onMessageArrived:"+message.payloadString);
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

function parse_mqtt(obj)
{
    if (obj.cmd == "hl")
	hlMeshByTag(obj.data.join("&&"));
    else if (obj.cmd == "rawdata")
    {
	//tag = rawDataToTagStr(obj.data.key);
	processRawData(obj);
	//hlMeshByTag(tag);
    }
    else if (obj.cmd == "ping")
    {
	g_iot_devices.ping(obj.uuid);
    }
}
