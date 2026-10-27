package com.m7.cc.asterisk.ami;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.Socket;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;


/**
 * 
 * @author caizhibin 2009-6-9
 *
 */
public class SocketServer {
	private Socket socket;
	private BufferedReader reader;
	private BufferedWriter writer;
	private Vector<String> msgQueue;
	private Vector<DataListener> cls;
	private StringBuffer msgBuffer;

	private Thread readThread;
	private Thread writeThread;
	private boolean running = false;

	private static final Logger log = Logger
			.getLogger(SocketServer.class.getName());

	public SocketServer(String hostname, int port) throws IOException {
		
		socket = new Socket(hostname, port);

		reader = new BufferedReader(new InputStreamReader(socket
				.getInputStream()));
		writer = new BufferedWriter(new OutputStreamWriter(socket
				.getOutputStream()));

		msgQueue = new Vector<String>();
		cls = new Vector<DataListener>();

		running = true;

		readThread = new Thread("AMI Reader") {
			public void run() {
				readChannel();
			}
		};
//		readThread.setDaemon(true);
		readThread.start();

		writeThread = new Thread("AMI Writer") {
			public void run() {
				writeChannel();
			}
		};
//		writeThread.setDaemon(true);
		writeThread.start();
	}

	public boolean sendCommand(String msg) {
		synchronized (msgQueue) {
			msgQueue.add(msg);
			msgQueue.notifyAll();
		}
		return true;
	}

	private void readChannel() {
		try {
			msgBuffer = new StringBuffer();
			while (running) {
				char[] chars = new char[1024];
				int count = 0;
				count = reader.read(chars);
				if (count > 0) {
					msgBuffer.append(chars, 0, count);
					int i = 0;
					if ((i = msgBuffer
							.lastIndexOf(C5Constants.ASTERISK_END_LINE
									+ C5Constants.ASTERISK_END_ACTION)) > 0) {
						// if we have one or more messages, send this to our
						// listeners
						notifyObservers(msgBuffer.substring(0, i + 4));
						msgBuffer = msgBuffer.delete(0, i + 4);
					}
				} else if(count == 0 ){
					log.warning("Get 0 byte from asterisk!"+System.currentTimeMillis());
				}
				else {
					throw new IOException("input stream end");
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "AMI reader end", e);
			notifyObserversConnectionClosed(e.getMessage());
		}
	}

	private void writeChannel() {
		try {
			while (running) {
				String msg = null;
				synchronized (msgQueue) {
					if (msgQueue.isEmpty())
						msgQueue.wait();
					else {
						if (msgQueue.size() > 0)
							msg = msgQueue.remove(0);
					}
				}

				if (msg != null) {
					synchronized (writer) {
						log.finest("Sending message: " + msg);
						writer.write(msg);
						writer.flush();
					}
				}
			}
		} catch (InterruptedException e) {
			log.log(Level.FINE, "AMI writer end", e);
			notifyObserversConnectionClosed(e.getMessage());
		} catch (IOException e) {
			log.log(Level.FINE, "AMI writer end", e);
			notifyObserversConnectionClosed(e.getMessage());
		}
	}

	public void destruct() {
		running = false;
		try {
			if (socket != null) {
				socket.close();
				socket = null;
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		if(readThread != null)
			readThread.interrupt();

		if (reader != null) {
			try {
				reader.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
			reader = null;
		}
		if (writer != null) {
			try {
				
				writer.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
			writer = null;
		}
		if (msgQueue != null) {
			msgQueue.clear();
			try{
				synchronized (msgQueue) {
					msgQueue.notifyAll();
				}
			}catch(Exception e){
				e.printStackTrace();
			}
			msgQueue = null;
		}
		
		if(writeThread != null)
			writeThread.interrupt();
		
		if (cls != null) {
			cls.clear();
			cls = null;
		}
	}

	private void notifyObservers(String msg) {
		if(cls == null)
			return;
		synchronized (cls) {
			try{
				for (int i = 0; i < cls.size(); i++) {
					cls.get(i).update(msg);
				}
			} catch (Throwable e){
				e.printStackTrace();
			}
		}
	}
	
	private void notifyObserversConnectionClosed(String message){
		if(cls == null)
			return;
		synchronized (cls) {
			for (int i = 0; i < cls.size(); i++) {
				cls.get(i).connectionClosed(message);
			}
		}
	}

	public void addObserver(DataListener co) {
		if(cls == null)
			return;
		synchronized (cls) {
			if (cls.contains(co))
				return;
			else
				cls.add(co);
		}
	}

	public void deleteObserver(DataListener co) {
		if(cls == null)
			return;
		synchronized (cls) {
			if (cls.contains(co))
				cls.remove(co);
		}
	}

	public void deleteObservers() {
		if(cls == null)
			return;
		synchronized (cls) {
			cls.clear();
		}
	}

}
