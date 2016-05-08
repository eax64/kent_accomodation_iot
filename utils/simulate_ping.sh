#!/bin/sh

if [  $# -lt 1 ] 
then 
    echo "Usage: $0 MQTT_HOST" 
    exit 1
fi

while true;
do
    mosquitto_pub -h $1 -t /door -m '{"cmd": "ping","uuid":"deadbeefbadc0ffe"}';
    sleep 2;
done
