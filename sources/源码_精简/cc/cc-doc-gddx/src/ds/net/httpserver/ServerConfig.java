/*
 * @(#)ServerConfig.java	1.5 06/05/18
 *
 * Copyright 2006 Sun Microsystems, Inc. All rights reserved.
 * SUN PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

package ds.net.httpserver;


/**
 * Parameters that users will not likely need to set
 * but are useful for debugging
 */

class ServerConfig {

    static int clockTick = 10000;

    static int defaultClockTick = 10000 ; // 10 sec.

    /* These values must be a reasonable multiple of clockTick */
    static long defaultReadTimeout = 20 ; // 20 sec.
    static long defaultWriteTimeout = 60 ; // 60 sec.
    static long defaultIdleInterval = 300 ; // 5 min
    static long defaultSelCacheTimeout = 120 ;  // seconds
    static int defaultMaxIdleConnections = 200 ; 

    static long defaultDrainAmount = 64 * 1024;

    static long readTimeout     = 20000;
    static long writeTimeout    = 60000;
    static long idleInterval    = 300000;
    static long selCacheTimeout = 86400;	
    static long drainAmount = 64 * 1024;	// max # of bytes to drain from an inputstream
    static int maxIdleConnections = 2000;	
    static boolean debug = false;

    static long getReadTimeout () {
    	return readTimeout;
    }

    static long getSelCacheTimeout () {
	return selCacheTimeout;
    }

    static boolean debugEnabled () {
	return debug;
    }

    static long getIdleInterval () {
	return idleInterval;
    }

    static int getClockTick () {
	return clockTick;
    }

    static int getMaxIdleConnections () {
	return maxIdleConnections;
    }

    static long getWriteTimeout () {
	return writeTimeout;
    }

    static long getDrainAmount () {
	return drainAmount;
    }
}
