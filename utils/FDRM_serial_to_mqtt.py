#!/bin/python

import paho.mqtt.client as mqtt
import argparse
import time
import serial
import json

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', required=True, help="MQTT host")
    parser.add_argument('--serial', default="/dev/ttyACM0", help="Serial device path")
    parser.add_argument('--debug', action="store_true", help="Print debug")
    args = parser.parse_args()
    return args

def get_serial_fd(args):
    print("Waiting for serial device to be connected...")
    ser = False
    while not ser:
        try:
            ser = serial.Serial(args.serial, 9600, timeout=50)
        except serial.serialutil.SerialException as e:
            if args.debug:
                print(e)
            time.sleep(0.2);
            continue
    print("Serial device connected")
    return ser
        
def on_message(client, userdata, msg):

    try:
        j = json.loads(msg.payload.decode("utf8"))
    except json.decoder.JSONDecodeError:
        return

    if "cmd" in j and j["cmd"] != "ping":
        print("[MQTT] " + msg.payload.decode("utf8"))
        
    if not "cmd" in j or j["cmd"] != "accessAuthentication":
        return
    if j["data"] == True:
        ser.write(b"1");
    else:
        ser.write(b"0");


if __name__ == "__main__":
    args = parse_args()
    
    mqttc = mqtt.Client("python_serial_proxy")
    mqttc.connect(args.host, 1883)
    mqttc.loop_start()
    mqttc.subscribe("/door")
    mqttc.on_message = on_message

    ser = get_serial_fd(args)
        
    while 1:
        try:
            s = ser.readline()
        except serial.serialutil.SerialException as e:
            print("Serial device disconnected")
            ser = get_serial_fd(args)
            if args.debug:
                print(e)

        data = s.decode("utf8").replace("\r\n", "")
        print("[SERIAL] " + data)
        mqttc.publish("/door", data)

