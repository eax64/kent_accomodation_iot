#!/bin/python

import paho.mqtt.client as mqtt
import argparse
import serial

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', required=True, help="MQTT host")
    args = parser.parse_args()
    return args


if __name__ == "__main__":
    args = parse_args()
    
    mqttc = mqtt.Client("python_pub")
    mqttc.connect(args.host, 1883)
    mqttc.loop_start()

    ser = serial.Serial('/dev/ttyACM0', 9600, timeout=50)
    while 1:
        s = ser.readline()
        data = s.decode("utf8").replace("\r\n", "")
        print(data)
        mqttc.publish("/door", data)

