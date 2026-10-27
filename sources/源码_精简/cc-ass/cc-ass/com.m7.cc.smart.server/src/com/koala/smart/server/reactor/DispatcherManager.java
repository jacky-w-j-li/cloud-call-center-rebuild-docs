package com.koala.smart.server.reactor;

import java.util.Vector;
import java.util.logging.Logger;

import com.koala.smart.server.SmartServer;

/**
 * This class used to initiate dispatchers and dispatch dispatchers.
 * @author caif
 *
 */
public class DispatcherManager {
	
	//How many dispatcher that will be used for server
	private int dispatcherNumber = 1;
	
	//Vector that maps dispatchers
	private Vector<Dispatcher> dispatchers = new Vector<Dispatcher>();

	private SmartServer server;
	
	private final static Logger log = Logger.getLogger(DispatcherManager.class.getName());
	
	/**
	 * Create a DispatcherManager with default dispatcher number.
	 * The default dispatcher number is 1.
	 * @param server
	 */
	public DispatcherManager(SmartServer server){
		this.server = server;
		initDispatcher();
	}
	
	/**
	 * Create a DispatcherManager with indicated dispatcher number.
	 * <br><br>
	 * @param server
	 * @param dispatcherNumber the number of dispatchers
	 */
	public DispatcherManager(SmartServer server, int dispatcherNumber){
		this.server = server;
		if(dispatcherNumber < 1)
			dispatcherNumber = 1;
		this.dispatcherNumber = dispatcherNumber;
		initDispatcher();
	}
	
	private void initDispatcher(){
		log.info("Create dispatcher ["+dispatcherNumber+"]");
		for(int i=0;i<dispatcherNumber;i++){
			dispatchers.add(new Dispatcher(server, "Smart Dispatcher-"+(i+1)+""));
		}
	}
	
	/**
	 * Get the next dispatcher.
	 * <br><br>
	 * @return
	 */
	public Dispatcher nextDispatcher(){
		synchronized (dispatchers) {
			Dispatcher dispatcher = dispatchers.get(0);
			for(int i=1;i<dispatchers.size();i++){
				if(dispatcher.getConnectionCount() > dispatchers.get(i).getConnectionCount())
					dispatcher = dispatchers.get(i);
			}
			return dispatcher;
		}
	}
	
	public Vector<Dispatcher> getDispatchers() {
		return dispatchers;
	}
	
	public int getDispatcherNumber() {
		return dispatcherNumber;
	}
	
	public void close(){
		server = null;
		while(dispatchers.size() > 0){
			dispatchers.remove(0).close();
		}
	}
}
