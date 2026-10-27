package com.koala.smart.server.reactor;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.SmartServer;

/**
 * A accpetor will listen a specificial port to accept TCP connection requst.
 * 
 * 
 * @author caif
 * @version 1.0.0
 */
public class Accepter implements Runnable {
	private ServerSocketChannel sschannel = null;
	private InetSocketAddress address;
	private DispatcherManager dispatcherManager = null;

	private SmartServer server = null;

	private String name = "";
	private boolean running = false;

	private static final Logger log = Logger
			.getLogger(Accepter.class.getName());

	public Accepter(SmartServer server) {
		this.server = server;
	}

	public Accepter(SmartServer server, InetSocketAddress address, String name) {
		this.address = address;
		this.name = "Accepter " + name;
		this.server = server;
		dispatcherManager = new DispatcherManager(server, server
				.getServerConfig().getDispatcherNum());
	}

	public void startListen() throws IOException {
		log.info("Start listening " + name);
		running = true;
		sschannel = ServerSocketChannel.open();
		ServerSocket ss = sschannel.socket();
		ss.bind(address);
		sschannel.configureBlocking(true);

		Thread t = new Thread(this, name);
		t.setDaemon(false);
		t.start();
	}

	public void run() {
		log.info("Accepter is listening " + name);
		while (running) {
			try {
				SocketChannel channel = sschannel.accept();
				channel.configureBlocking(false);
				// we wait for 1 second to send data before this socket close
				// channel.socket().setSoLinger(true, 1);
//				log.info("Agi Accepter is step: 1");
				Dispatcher dispatcher = dispatcherManager.nextDispatcher();
//				log.info("Agi Accepter is step: 2");
				Connection connection = new Connection(server, dispatcher,
						channel);
//				log.info("Agi Accepter is step: 3");
				if (server.processNewSession(connection.getAddress(),
						connection.getPort(), connection)){
//					log.info("Agi Accepter is step: 4");
					dispatcher.addConnection(connection);
				}
//				log.info("Agi Accepter is step: 5");
			} catch (Throwable e) {
				log.log(Level.WARNING, "receive new connection failed!", e);
			}
		}
	}

	public void close() {
		running = false;
		try {
			sschannel.close();
		} catch (IOException e) {
			log.log(Level.WARNING, "Close channel failed", e);
		}
		dispatcherManager.close();
	}

	public InetSocketAddress getAddress() {
		return address;
	}

	public void setAddress(InetSocketAddress address) {
		this.address = address;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public DispatcherManager getDispatcherManager() {
		return dispatcherManager;
	}
}
