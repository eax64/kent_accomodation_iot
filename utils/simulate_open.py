#!/bin/python

import paho.mqtt.client as mqtt
import argparse
import json

key = {
    "cmd":"rawdata",
    "uuid":"deadbeefbadc0ffe",
    "data":
    {
        "key":
        {
            "uid":"babebeef",
            "college":7,
            "block":5,
            "flat":2,
            "door":18
        }
    }
}


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', required=True, help="MQTT host")
    parser.add_argument('--college', help="College number")
    parser.add_argument('--block', help="Block number")
    parser.add_argument('--flat', help="Flat number")
    parser.add_argument('--door', help="Door number")
    parser.add_argument('--uid', help="User key uid")
    parser.add_argument('--device_uuid', help="IOT Device uuid")
    args = parser.parse_args()


    
    if args.device_uuid:
        key["data"]["uuid"] = args.device_uuid

    for v in ["uid", "college", "block", "flat", "door"]:
        if getattr(args, v):
            key["data"]["key"][v] = getattr(args, v)
            
    return args

if __name__ == "__main__":
    args = parse_args()
    
    mqttc = mqtt.Client("python_pub")
    mqttc.connect(args.host, 1883)
    mqttc.loop_start()
    data = json.dumps(key)
    print("Sending: ", data)
    mqttc.publish("/door", data)
    mqttc.loop_stop()

