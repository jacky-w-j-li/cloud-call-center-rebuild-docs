package com.m7.cc.asterisk.cdr.client;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Socket;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.command.PacketParser;

public class SocketClient {
	private Socket socket;
	private BufferedReader reader;
	private OutputStream writer;
	private Vector<String> msgQueue;
	private PacketParser packetParser;
	private CdrConnection client;

	private Thread readThread;
	private Thread writeThread;
	private boolean running = false;

	private static final Logger log = Logger.getLogger(SocketClient.class
			.getName());

	public SocketClient(String hostname, int port, CdrConnection client)
			throws IOException {
		packetParser = new PacketParser(client);
		this.client = client;
		socket = new Socket(hostname, port);
		reader = new BufferedReader(new InputStreamReader(socket
				.getInputStream(), "UTF-8"));
		writer = socket.getOutputStream();

		msgQueue = new Vector<String>();

		running = true;

		readThread = new Thread("Socket Reader") {
			public void run() {
				readChannel();
			}
		};
		// readThread.setDaemon(true);
		readThread.start();

		writeThread = new Thread("Socket Writer") {
			public void run() {
				writeChannel();
			}
		};
		// writeThread.setDaemon(true);
		writeThread.start();
	}

	public boolean sendCommand(String msg) {
		synchronized (msgQueue) {
			msgQueue.add(msg + "\r\n");
			msgQueue.notifyAll();
		}
		return true;
	}

	private void readChannel() {
		try {
			while (running) {
				char[] chars = new char[1024];
				int count = 0;
				count = reader.read(chars);
				if (count > 0) {
					String data = new String(chars, 0, count);
					try {
						packetParser.parserPacket(data);
					} catch (Exception e) {
						log.log(Level.WARNING, "", e);
					}
				} else if (count == 0) {
					log.warning("Get 0 byte from asterisk! "
							+ System.currentTimeMillis());
				} else {
					running = false;
					throw new IOException("input stream end");
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Socket reader end", e);
			running = false;
			client.processClose();
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
						writer.write(msg.getBytes("UTF-8"));
						writer.flush();
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "Socket writer end", e);
			running = false;
			client.processClose();
		}
	}

	public void destruct() {
		running = false;
//		this.packetParser = null;
//		this.client = null;
		try {
			if (socket != null) {
				socket.close();
				socket = null;
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
		try {
			if (readThread != null)
				readThread.interrupt();
		} catch (Exception e) {
			e.printStackTrace();
		}
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
			try {
				synchronized (msgQueue) {
					msgQueue.notifyAll();
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
			msgQueue = null;
		}
		try {
			if (writeThread != null)
				writeThread.interrupt();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public boolean isRunning() {
		return running;
	}

}
