
#if !defined(MQTTETHERNET_H)
#define MQTTETHERNET_H

#include "MQTTmbed.h"
#include "EthernetInterface.h"
#include "MQTTSocket.h"

class MQTTEthernet : public MQTTSocket
{
public:    
    MQTTEthernet()
    {
        eth.init("192.168.0.2", "255.255.255.0", "192.168.0.1");
        eth.connect(2000);
    }
    
    EthernetInterface& getEth()
    {
        return eth;
    }
    
    void reconnect()
    {
        eth.connect();  // nothing I've tried actually works to reconnect 
    }
    
private:

    EthernetInterface eth;
    
};


#endif
