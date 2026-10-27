/*
 * @(#)HttpConnection.java	1.6 06/05/08
 *
 * Copyright 2006 Sun Microsystems, Inc. All rights reserved.
 * SUN PROPRIETARY/CONFIDENTIAL. Use is subject to license terms.
 */

package ds.net.httpserver;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.channels.SelectionKey;
import java.nio.channels.SocketChannel;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLEngine;

/**
 * encapsulates all the connection specific state for a HTTP/S connection one of
 * these is hung from the selector attachment and is used to locate everything
 * from that.
 */
class HttpConnection {

	HttpContextImpl context;
	SSLEngine engine;
	SSLContext sslContext;
	SSLStreams sslStreams;

	/* high level streams returned to application */
	InputStream i;

	/* low level stream that sits directly over channel */
	InputStream raw;
	OutputStream rawout;

	SocketChannel chan;
	SelectionKey selectionKey;
	String protocol;
	long time;
	long connectedTime = System.currentTimeMillis();
	int remaining;
	boolean closed = false;
	Logger logger;

	public String toString() {
		String s = null;
		if (chan != null) {
			s = chan.toString();
		}
		return s;
	}

	HttpConnection() {
	}

	void setChannel(SocketChannel c) {
		chan = c;
	}

	void setContext(HttpContextImpl ctx) {
		context = ctx;
	}

	void setParameters(InputStream in, OutputStream rawout, SocketChannel chan,
			SSLEngine engine, SSLStreams sslStreams, SSLContext sslContext,
			String protocol, HttpContextImpl context, InputStream raw) {
		this.context = context;
		this.i = in;
		this.rawout = rawout;
		this.raw = raw;
		this.protocol = protocol;
		this.engine = engine;
		this.chan = chan;
		this.sslContext = sslContext;
		this.sslStreams = sslStreams;
		this.logger = context.getLogger();
	}

	SocketChannel getChannel() {
		return chan;
	}

	synchronized void close() {
		if (closed) {
			return;
		}
		closed = true;
//		if (logger != null && chan != null) {
//			logger.finest("Closing connection: " + chan.toString());
//		}

		try{
			if (chan != null && !chan.isOpen()) {
				logger.warning("Channel already closed");
//				return;
			}
		} catch (Exception e){
			logger.log(Level.WARNING, "connection close", e);
		}
		
		try {
			/* need to ensure temporary selectors are closed */
			if (raw != null) {
				raw.close();
				raw = null;
			}
		} catch (Exception e) {
			logger.log(Level.WARNING, "connection close", e);
		}
		try {
			if (rawout != null) {
				rawout.close();
				rawout = null;
			}
		} catch (Exception e) {
			logger.log(Level.WARNING, "connection close", e);
		}
		try {
			if (sslStreams != null) {
				sslStreams.close();
				sslStreams = null;
			}
		} catch (Exception e) {
			logger.log(Level.WARNING, "connection close", e);
		}
		try {
			if(chan != null){
				chan.close();
				chan = null;
			}
		} catch (Exception e) {
			logger.log(Level.WARNING, "Channel closed", e);
		}
		try {
			if(selectionKey != null){
				selectionKey.cancel();
				selectionKey.attach(null);
				selectionKey = null;
			}
		} catch (Exception e) {
			logger.log(Level.WARNING, "connection close", e);
		}
	}

	/*
	 * remaining is the number of bytes left on the lowest level inputstream
	 * after the exchange is finished
	 */
	void setRemaining(int r) {
		remaining = r;
	}

	int getRemaining() {
		return remaining;
	}

	SelectionKey getSelectionKey() {
		return selectionKey;
	}

	InputStream getInputStream() {
		return i;
	}

	OutputStream getRawOutputStream() {
		return rawout;
	}

	String getProtocol() {
		return protocol;
	}

	SSLEngine getSSLEngine() {
		return engine;
	}

	SSLContext getSSLContext() {
		return sslContext;
	}

	HttpContextImpl getHttpContext() {
		return context;
	}
}
