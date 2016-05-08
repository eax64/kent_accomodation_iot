#include "mbed.h"
#include "PN532_SPI.h"
#include "NfcAdapter.h"
#include "PN532.h"

// The real mifare key have been redacted from this file.
#define KENT_MIFARE_KEY 0x00, 0x00, 0x00, 0x00, 0x00, 0x00

#define BLOCK_COLLEGE_OFFSET 5
#define BLOCK_BLOCK_OFFSET 6
#define BLOCK_FLAT_OFFSET 7
#define BLOCK_DOOR_OFFSET 12

DigitalOut led(LED_RED);
Serial host (USBTX, USBRX);
Ticker ping_ticker;

char g_device_id[17] = {};

struct s_Key
{
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
    host.printf("{"
    "\"cmd\": \"ping\","
    "\"uuid\":\"%s\""
    "}\r\n",
    g_device_id);
}

int main()
{
    host.baud(9600);
    fclose(stdout);
    uint8_t ret;
    uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0, 0};
    uint8_t last_uid[] = { 0, 0, 0, 0, 0, 0, 0, 0};
    uint8_t kentkey[6] = {KENT_MIFARE_KEY};
    uint8_t uidLen;
    uint8_t buf[512] = {};
    struct s_Key key_data;
    unsigned int cnt = 0;
    
    init_uid();
    ping_ticker.attach(send_ping, 5.0);
    send_ping();
    led = 0;
    SPI spi(D11, D12, D13);
    PN532_SPI pn532spi(spi, D10);
    PN532 nfc(pn532spi);
    nfc.begin();
    nfc.SAMConfig();
    while (1) { 
            ret = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLen, 1000);

            if (!ret)
                {
                    memset(uid, 0, sizeof(uid));
                    memset(last_uid, 0, sizeof(uid));
                    continue;
                }
            if (!memcmp(uid, last_uid, sizeof(uid)))
            {
                wait(0.5);
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
            
            for (int i = 0 ; i < uidLen ; i++)
            {
                sprintf(key_data.uid, "%s%02x", key_data.uid, uid[i]);
            }
            key_data.college = ((unsigned char*)buf)[BLOCK_COLLEGE_OFFSET];
            key_data.block = ((unsigned char*)buf)[BLOCK_BLOCK_OFFSET];
            key_data.flat = ((unsigned char*)buf)[BLOCK_FLAT_OFFSET];
            nfc.PrintHexChar(buf, 16);
            ret =  nfc.mifareclassic_ReadDataBlock(29, buf);
    
            if (!ret)
                continue;
            key_data.door = ((unsigned char*)buf)[BLOCK_DOOR_OFFSET];
            nfc.PrintHexChar(buf, 16);
            
            wait(0.5);
            host.printf("{"
            "\"cmd\":\"rawdata\", \"uuid\":\"%s\", \"data\":"
                    "{"
                        "\"key\":%s"
                    "}"
                "}"
                "\r\n",
                g_device_id, key_to_json(&key_data));
        }

}
