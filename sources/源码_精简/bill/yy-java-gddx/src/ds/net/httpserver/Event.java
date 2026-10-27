/*
 * @(#)Event.java	1.3 05/11/17
 *
 * Copyright 2006 Sun Microsystems, Inc. All rights reserved.
 * SUN PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

package ds.net.httpserver;


class Event {

    ExchangeImpl exchange;

    protected Event (ExchangeImpl t) {
	this.exchange = t;
    }
}

class WriteFinishedEvent extends Event {
    WriteFinishedEvent (ExchangeImpl t) {
	super (t);
    }
}
