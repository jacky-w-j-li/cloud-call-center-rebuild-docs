package com.koala.smart.server.listener;

import com.koala.smart.server.Session;

/**
 * 
 * @author caif
 *
 */
public interface DataListener {

	/**
	 * Method called every time client sends an binary data.
	 * Should be used to handle the binary data sent.
	 * @exception java.net.SocketTimeoutException if socket times out
	 * @exception java.io.IOException if io error in socket
	 */
	public void handleByte(Session session, byte command[]);
	
	public void handleString(Session session, String command);

}
