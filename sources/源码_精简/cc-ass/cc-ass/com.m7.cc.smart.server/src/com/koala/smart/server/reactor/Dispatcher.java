package com.koala.smart.server.reactor;

import java.io.IOException;
import java.nio.channels.ClosedChannelException;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.util.Iterator;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.SmartServer;

/**
 * Dispatcher will read and write all ready channels which have been registered
 * into it. Every dispatcher contains one selector to select ready channel. A
 * smart server has one or more channels according the number of CPUs the server
 * has on which it runs. Every dispatcher will run in a seperate thread.
 * 
 * @author caif
 * @version 1.0.0
 */
public class Dispatcher {

	// Selector of this dispatcher
	private Selector readSelector;
	private Selector writeSelector;

	/**
	 * TaskQueue is used to save tasks temporarily. A task is a proccess that
	 * will register/unregister/update a SlectionKey of channel.
	 */
	private ConcurrentLinkedQueue<Runnable> readQueue = new ConcurrentLinkedQueue<Runnable>();
	private ConcurrentLinkedQueue<Runnable> writeQueue = new ConcurrentLinkedQueue<Runnable>();

	// Is the dispatcher thread should keep running.
	private boolean running = true;

	// Thread of this dispatcher
	private Thread readThread;
	private Thread writeThread;

	// Name of this thread, just a sign
	private String name;

	// How many connections this dispatcher is proccessing.
	private int connectionCount = 0;

	private ExecutorService excutor = Executors.newCachedThreadPool();
	private final static Logger log = Logger.getLogger(Dispatcher.class
			.getName());

	/**
	 * Construct of dispatcher.
	 * 
	 * @param server
	 *            The SmartServer for which this dispathcer works.
	 * @param name
	 *            Name of this dispatcher.
	 */
	public Dispatcher(SmartServer server, String name) {
		this.name = name;
		try {
			readSelector = Selector.open();
			writeSelector = Selector.open();
		} catch (IOException e) {
			log.log(Level.SEVERE, "Open selector failed", e);
		}
		readThread = new Thread(name+"-read"){
			public void run(){
				read();
			}
		};
		readThread.start();
		writeThread = new Thread(name+"-write"){
			public void run(){
				write();
			}
		};
		writeThread.start();
	}

	/**
	 * When accepter get a new connection, it should send it to a dispatcher to 
	 * process it by calling this method.
	 * It will register this connection for OP_READ.
	 * 
	 * @param connection 
	 */
	public void addConnection(final Connection connection) {
		if (!running)
			return;
		connectionCount++;
		register(connection, SelectionKey.OP_READ);
	}

	/**
	 * Register a connection with indicated operations.
	 * 
	 * @param connection
	 * @param ops
	 */
	public void register(final Connection connection, final int ops) {
		if (!running)
			return;
		if (connection.isOpen()) {
			Runnable runnable = new Runnable() {
				public void run() {
					registerNow(connection, ops);
				}
			};
			if(ops == SelectionKey.OP_READ) {
				readQueue.add(runnable);
				readSelector.wakeup();
			} else if (ops == SelectionKey.OP_WRITE) {
				writeQueue.add(runnable);
				writeSelector.wakeup();
			}
		} else {
			log.warning("Trying to register a unopened connection");
		}

	}

	private void registerNow(Connection connection, int ops) {
		if (!running)
			return;
		try{
			// if connection is opened, register it
			if (connection.isOpen()) {
				if(ops == SelectionKey.OP_READ){
					try {
						connection.getChannel().register(readSelector, ops, connection);
					} catch (ClosedChannelException e) {
						log.log(Level.WARNING, "register connection failed", e);
					}
				} else if(ops == SelectionKey.OP_WRITE){
					try {
						connection.getChannel().register(writeSelector, ops, connection);
					} catch (ClosedChannelException e) {
						log.log(Level.WARNING, "register connection failed", e);
					}
				}
				
			} else {
				log.warning("Trying to register a unopened connection");
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	/**
	 * Unregister a connection. It will remove this channel from the selector.
	 * 
	 * @param connection
	 */
	public void unregister(Connection connection) {
		if (!running)
			return;
		try{
			SelectionKey key = connection.getChannel().keyFor(readSelector);
			if (key != null && key.isValid()) {
				key.cancel();
			}
			SelectionKey key1 = connection.getChannel().keyFor(writeSelector);
			if (key1 != null && key1.isValid()) {
				key1.cancel();
			}
			connection.unregistered();
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
		}
	}

	private void read() {
		while (running) {
			try {
				int count = readSelector.select(1000);
				while (true) {
					Runnable registerTask = readQueue.poll();
					if (registerTask == null) {
						break;
					} else {
						registerTask.run();
					}
				}
				if (count > 0) {
					Set<SelectionKey> selectedEventKeys = readSelector.selectedKeys();
					Iterator<SelectionKey> it = selectedEventKeys.iterator();

					// handle read & write
					while (it.hasNext() && running) {
						long a = System.currentTimeMillis();
						try {
							SelectionKey eventKey = it.next();
							it.remove();
							Connection connection = (Connection) eventKey.attachment();
							// read data
							if (eventKey.isValid() && eventKey.isReadable()) {
								eventKey.interestOps(eventKey.interestOps() ^ SelectionKey.OP_READ);
								excutor.execute(connection.reader);
							}

//							// write data
//							if (eventKey.isValid() && eventKey.isWritable()) {
//								eventKey.interestOps(eventKey.interestOps() ^ SelectionKey.OP_WRITE);
//								excutor.execute(connection.writer);
//							}
							
						} catch (Throwable e) {
							// eat and log exception
							log.log(Level.WARNING, "error occured by handling selection keys", e);
						}
						
					}
				}
			} catch (IOException e) {
				log.log(Level.SEVERE, name + " select failed", e);
			}
		}
	}
	
	private void write() {
		while (running) {
			try {
				int count = writeSelector.select(1000);
				while (true) {
					Runnable registerTask = writeQueue.poll();
					if (registerTask == null) {
						break;
					} else {
						registerTask.run();
					}
				}
				if (count > 0) {
					Set<SelectionKey> selectedEventKeys = writeSelector.selectedKeys();

					Iterator<SelectionKey> it = selectedEventKeys.iterator();

					// handle read & write
					while (it.hasNext() && running) {
						long a = System.currentTimeMillis();
						try {
							SelectionKey eventKey = it.next();
							it.remove();
							Connection connection = (Connection) eventKey.attachment();
//							// read data
//							if (eventKey.isValid() && eventKey.isReadable()) {
//								eventKey.interestOps(eventKey.interestOps() ^ SelectionKey.OP_READ);
//								excutor.execute(connection.reader);
//							}

							// write data
							if (eventKey.isValid() && eventKey.isWritable()) {
								eventKey.interestOps(eventKey.interestOps() ^ SelectionKey.OP_WRITE);
								excutor.execute(connection.writer);
							}
						} catch (Throwable e) {
							// eat and log exception
							log.log(Level.WARNING, "error occured by handling selection keys", e);
						}
					}
				}
			} catch (IOException e) {
				log.log(Level.SEVERE, name + " select failed", e);
			}
		}
	}

	public int getConnectionCount() {
		return connectionCount;
	}

	public void close(){
		running = false;
		readQueue.clear();
		writeQueue.clear();
		try {
			readSelector.wakeup();
			readSelector.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		
		try {
			writeSelector.wakeup();
			writeSelector.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		
		try{
			readThread.interrupt();
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
		}
		
		try{
			writeThread.interrupt();
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
		}
	}
}
