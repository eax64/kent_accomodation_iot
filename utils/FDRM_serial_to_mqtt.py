#!/bin/python

import paho.mqtt.client as mqtt
import serial

mqttc = mqtt.Client("python_pub")
mqttc.connect("127.0.0.1", 1883)

mqttc.loop_start()


ser = serial.Serial('/dev/ttyACM0', 9600, timeout=50)
while 1:
    s = ser.readline()
    data = s.decode("utf8").replace("\r\n", "")
    print(data)
    mqttc.publish("/door", data)

