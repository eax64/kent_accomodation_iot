#ifndef __DEBUG_H__
#define __DEBUG_H__

//#define DEBUG
#include <stdio.h>

#ifdef DEBUG



#define DMSG(args...)   printf(args)
#define DMSG_STR(str)   printf("%s\n", str)
#define DMSG_INT(num)   printf("%d\n", num)
#define DMSG_HEX(num)   printf("%2X ", num)

#else

#define DMSG(args...)
#define DMSG_STR(str)
#define DMSG_INT(num)
#define DMSG_HEX(num)

#endif  // DEBUG

#endif  // __DEBUG_H__
