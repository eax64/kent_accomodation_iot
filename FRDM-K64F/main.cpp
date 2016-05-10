#include "mbed.h"
#include "PN532_SPI.h"
#include "NfcAdapter.h"
#include "PN532.h"
#include "MQTTEthernet.h"
#include "MQTTClient.h"
#include <MbedJSONValue.h>

/ The real mifare key have been redacted from this file.
#define KENT_MIFARE_KEY 0x00, 0x00, 0x00, 0x00, 0x00, 0x00

#define BLOCK_COLLEGE_OFFSET 5
#define BLOCK_BLOCK_OFFSET 6
#define BLOCK_FLAT_OFFSET 7
#define BLOCK_DOOR_OFFSET 12

#define MQTTCLIENT_QOS2 1





RawSerial host (USBTX, USBRX);
DigitalOut led_red(LED_RED);
DigitalOut led_green(LED_GREEN);

Ticker ping_ticker;
Timeout led_timeout;
MQTT::Client<MQTTEthernet, Countdown> *g_client =0;

char g_device_id[17] = {};

struct s_Key {
    unsigned char college;
    unsigned char block;
    unsigned char flat;
    unsigned char door;
    char uid[32];
};

char *key_to_json(struct s_Key *k)
{
    char *json = NULL;

    if (asprintf(&json,
                 "{"
                 "\"uid\":\"%s\","
                 "\"college\":%d,"
                 "\"block\":%d,"
                 "\"flat\":%d,"
                 "\"door\":%d"
                 "}",
                 k->uid, k->college, k->block, k->flat, k->door) == -1)
        return NULL;
    return json;
}

// Way of having an id unique per device
void init_uid()
{
    sprintf(g_device_id, "%08x%08x", SIM_UIDML ^ SIM_UIDH, SIM_UIDL ^ SIM_UIDMH);
}

void send_ping()
{
    char buf[128];

    snprintf(buf, 127, "{"
             "\"cmd\": \"ping\","
             "\"uuid\":\"%s\""
             "}",
             g_device_id);

    MQTT::Message message;

    message.qos = MQTT::QOS0;
    message.retained = false;
    message.dup = false;
    message.payload = (void*)buf;
    message.payloadlen = strlen(buf);
    g_client->publish("/door", message);

}



void init_door()
{
    led_red = 1;
    led_green = 1;
}

void open_door_succeed()
{
    led_timeout.attach(init_door, 2.0);
    led_green = 0;
}

void open_door_failed()
{
    led_timeout.attach(init_door, 2.0);
    led_red = 0;
}

void serial_rx_callback()
{
    char c;

    while (host.readable()) {
        c = host.getc();
    }
    if (c == '1')
        open_door_succeed();
    else if (c == '0')
        open_door_failed();
}

void messageArrived(MQTT::MessageData& md)
{
    MQTT::Message &message = md.message;
    host.printf("Payload %.*s\r\n", message.payloadlen, (char*)message.payload);

    MbedJSONValue parser;
    parse(parser, (char*)message.payload);

    if (!parser.hasMember("cmd") || parser["cmd"].get<std::string>() != "accessAuthentication")
        return;
    if (!parser.hasMember("data"))
        return;
    if (parser["data"].get<bool>())
        open_door_succeed();
    else
        open_door_failed();
}

void sub(MQTT::Client<MQTTEthernet, Countdown> &client, char *topic)
{
    int ret = 0;

    MQTTPacket_connectData data = MQTTPacket_connectData_initializer;
    data.MQTTVersion = 3;
    data.clientID.cstring = "mbed-sample";
    data.username.cstring = g_device_id;
    data.password.cstring = g_device_id;
    if ((ret = client.connect(data)) != 0)
        host.printf("MQTT connect: %d\r\n", ret);

    if ((ret = client.subscribe(topic, MQTT::QOS2, messageArrived)) != 0)
        host.printf("MQTT subscribe: %d\r\n", ret);
}


void send_key(MQTT::Client<MQTTEthernet, Countdown> &client, char *topic, struct s_Key *key)
{
    char buf[256];
    int ret = 0;
    snprintf(buf, 255, "{"
             "\"cmd\":\"rawdata\", \"uuid\":\"%s\", \"data\":"
             "{"
             "\"key\":%s"
             "}"
             "}"
             ,
             g_device_id, key_to_json(key));

    MQTT::Message message;

    message.qos = MQTT::QOS0;
    message.retained = false;
    message.dup = false;
    message.payload = (void*)buf;
    message.payloadlen = strlen(buf);
    ret = g_client->publish(topic, message);
}

int main()
{


    MQTTEthernet ipstack = MQTTEthernet();
    MQTT::Client<MQTTEthernet, Countdown> client = MQTT::Client<MQTTEthernet, Countdown>(ipstack);
    g_client = &client;

    host.baud(9600);
    host.attach(serial_rx_callback, Serial::RxIrq);
    fclose(stdout);
    int ret;
    uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0, 0};
    uint8_t last_uid[] = { 0, 0, 0, 0, 0, 0, 0, 0};
    uint8_t kentkey[6] = {KENT_MIFARE_KEY};
    uint8_t uidLen;
    uint8_t buf[512] = {};
    struct s_Key key_data;
    unsigned int cnt = 0;
    time_t last_ping = time(NULL);

    init_uid();
    char *topic_sub = g_device_id;
    char *topic_pub = "/door";
    char *hostname = "192.168.0.1";
    int port = 1883;

    host.printf("Connecting to %s:%d\r\n", hostname, port);
    ret = ipstack.connect(hostname, port);
    sub(client, topic_sub);

    init_door();

    //ping_ticker.attach(send_ping, 2.0); // not working with rtos
    send_ping();


    SPI spi(D11, D12, D13);
    PN532_SPI pn532spi(spi, D10);
    PN532 nfc(pn532spi);
    nfc.begin();
    nfc.SAMConfig();
    while (1) {
        if (time(NULL) - last_ping > 4) {
            send_ping();
            last_ping = time(NULL);
            client.yield();
        }
        ret = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLen, 500);

        if (!ret) {
            memset(uid, 0, sizeof(uid));
            memset(last_uid, 0, sizeof(uid));
            continue;
        }
        if (!memcmp(uid, last_uid, sizeof(uid))) {
            wait(0.2);
            continue;
        }
        memcpy(last_uid, uid, sizeof(uid));
        ret = nfc.mifareclassic_AuthenticateBlock(uid, uidLen, 28, 0, kentkey);

        if (!ret)
            continue;
        ret =  nfc.mifareclassic_ReadDataBlock(28, buf);

        if (!ret)
            continue;
        memset(key_data.uid, 0, sizeof(key_data.uid));

        for (int i = 0 ; i < uidLen ; i++) {
            sprintf(key_data.uid, "%s%02x", key_data.uid, uid[i]);
        }
        key_data.college = ((unsigned char*)buf)[BLOCK_COLLEGE_OFFSET];
        key_data.block = ((unsigned char*)buf)[BLOCK_BLOCK_OFFSET];
        key_data.flat = ((unsigned char*)buf)[BLOCK_FLAT_OFFSET];

        ret =  nfc.mifareclassic_ReadDataBlock(29, buf);

        if (!ret)
            continue;
        key_data.door = ((unsigned char*)buf)[BLOCK_DOOR_OFFSET];
        send_key(client, topic_pub, &key_data);

    }

}
