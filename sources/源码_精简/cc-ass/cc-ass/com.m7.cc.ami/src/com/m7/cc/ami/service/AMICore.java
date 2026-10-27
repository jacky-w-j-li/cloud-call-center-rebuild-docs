package com.m7.cc.ami.service;

import java.io.IOException;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.AMIContacts;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.ASConfigListener;
import com.m7.cc.asterisk.ami.AsteriskSysListener;
import com.m7.cc.asterisk.ami.action.AsteriskAction;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.exceptions.CommunicationException;
import com.m7.cc.asterisk.ami.exceptions.ConnectionException;

/**
 * 
 * @author caizhibin 2009-6-11
 * 
 */
public class AMICore implements AsteriskSysListener, ASConfigListener {
	private static AMICore instance = null;
	private Vector<AMISystemListener> sysListeners = new Vector<AMISystemListener>();
	private Hashtable<String, AMIClient> amiClients = new Hashtable<String, AMIClient>();

	private final static Logger log = Logger.getLogger(AMICore.class.getName());

	private AMICore() {
		instance = this;
		ASConfig.getInstance().addConfigListener(this);
	}

	public static AMICore getInstance() {
		if (instance == null) {
			new AMICore();
		}
		return instance;
	}

	public void initAMIClient(Hashtable<String, AMIContacts> amis) {
		Iterator<String> keys = amis.keySet().iterator();
		while (keys.hasNext()) {
			String key = keys.next();
			AMIContacts ami = amis.get(key);
			AMIClient aClient = new AMIClient(ami.getId(), ami.getHost(), ami
					.getPort());
			aClient.setUserName(ami.getUser());
			aClient.setSecret(ami.getPassword());
			
			synchronized (amiClients) {
				amiClients.put(aClient.getId(), aClient);
			}
			if(!aClient.isAuthenticated()){
				reconnectToAsterisk(aClient.getId());
			}
			log.fine("init ami client " + ami.getId() + ":" + ami.getPort());
		}
	}

	public void sendAction(String id, AsteriskAction action) {
		AMIClient client = amiClients.get(id);
		if (client != null) {
			try {
				client.sendAction(action);
			} catch (IOException e) {
				log.log(Level.WARNING, "Send action to "+id+" failed", e);
			}
		}
	}

	public AsteriskResponse sendSynchronousAction(String id,
			AsteriskAction action) {
		AMIClient client = amiClients.get(id);
		if (client != null) {
			try {
				return client.sendSynchronousAction(action);
			} catch (CommunicationException e) {
				e.printStackTrace();
			}
		}
		return null;
	}

	public void deleteAMIClient(String id) {
		AMIClient client = amiClients.get(id);
		if (client == null)
			return;
		synchronized (amiClients) {
			amiClients.remove(id);
		}
		log.info("Delete Asterisk: " + id);
		client.destruct();
	}

	public void addAMIClient(String id, String ip, int port, String user, String password)
			throws Exception {
		AMIClient client = amiClients.get(id);
		if (client != null)
			throw new Exception("This PBX is already here: " + ip);
		AMIClient aClient = new AMIClient(id, ip, port);
		if (aClient.login(user, password)) {
			aClient.addAsteriskSysListener(this);
		} else {
			log.warning("Login to " + aClient.getId() + " with " + user
					+ ":" + password + "failed");
		}
		synchronized (amiClients) {
			amiClients.put(aClient.getId(), aClient);
		}
		this.reconnectToAsterisk(ip);
		log.info("Add Asterisk: " + ip + ":" + port);
	}

	public void asteriskDown(final String id) {
		AMIClient client = amiClients.get(id);
		if (client == null || client.isConnecting())
			return;
		client.setConnecting(true);

		log.warning("Asterisk shut down: " + id);

		if (!ASConfig.getInstance().getAmiContacts().containsKey(id)) {
			log.info("This ami client is closed by admin: " + id);
			return;
		}

		synchronized (sysListeners) {
			for (int i = 0; i < sysListeners.size(); i++) {
				sysListeners.get(i).asteriskDisonnected(client);
			}
		}

		Thread thread = new Thread("Reconnect to " + id) {
			public void run() {
				AMIClient client = amiClients.get(id);
				if(client == null)
					return;
				client.clear();
				boolean connected = false;

				while (!connected && !client.isDisposed()) {
					log.info("Reconnect to " + id);
					try {
						connected = client.login(client.getUserName(), client
								.getSecret());
					} catch (ConnectionException e) {
						log.log(Level.WARNING, "Reconnect failed", e);
					} catch (IOException e) {
						log.log(Level.WARNING, "Reconnect failed", e);
					}

					if (connected) {
						client.setConnecting(false);
						client.addAsteriskSysListener(AMICore.getInstance());
						log.info("Asterisk reconnected: " + client.getId());
						synchronized (sysListeners) {
							for (int i = 0; i < sysListeners.size(); i++) {
								sysListeners.get(i).asteriskConnected(client);
							}
						}
					}
					// wait 10 seconds to reconnect again
					try {
						sleep(10 * 1000);
					} catch (InterruptedException e) {
						e.printStackTrace();
					}
				}
			}
		};
		thread.start();
	}
	
	public void reconnectToAsterisk(final String pbx){
		Thread thread = new Thread("Keep connecting to " + pbx) {
			public void run() {
				AMIClient client = amiClients.get(pbx);
				if(client == null)
					return;
				client.clear();
				boolean connected = false;

				while (!connected && !client.isDisposed()) {
					log.info("Reconnect to " + pbx);
					try {
						connected = client.login(client.getUserName(), client
								.getSecret());
					} catch (ConnectionException e) {
						log.log(Level.WARNING, "Reconnect failed: "+pbx, e);
					} catch (IOException e) {
						log.log(Level.WARNING, "Reconnect failed: "+pbx, e);
					}

					if (connected) {
						client.setConnecting(false);
						client.addAsteriskSysListener(AMICore.getInstance());
						log.info("Asterisk reconnected: " + client.getId());
						synchronized (sysListeners) {
							for (int i = 0; i < sysListeners.size(); i++) {
								sysListeners.get(i).asteriskConnected(client);
							}
						}
					} else {
						// wait 10 seconds to reconnect
						try {
							sleep(10000);
						} catch (InterruptedException e) {
							e.printStackTrace();
						}
					}
				}
			}
		};
		thread.start();
	}

	public void addAMIListener(AMISystemListener al) {
		if (al != null && sysListeners != null)
			if (!sysListeners.contains(al))
				synchronized (sysListeners) {
					sysListeners.add(al);
				}
	}

	public void removeAMIListener(AMISystemListener al) {
		if (al != null && sysListeners != null)
			if (sysListeners.contains(al))
				synchronized (sysListeners) {
					sysListeners.remove(al);
				}
	}

	public void removeAllAMIListeners() {
		if (sysListeners != null)
			synchronized (sysListeners) {
				sysListeners.clear();
			}

	}
	
	public AMIClient[] getAMIClients() {
		synchronized (amiClients) {
			AMIClient[] clients = new AMIClient[amiClients.size()];
			Iterator<AMIClient> it = amiClients.values().iterator();
			int i=0;
			while(it.hasNext()){
				clients[i] = it.next();
				i++;
			}
			return clients;
		}
	}
	
	public AMIClient getAMIClient(String id) {
		return amiClients.get(id);
	}

	public void pbxAdd(String id) {
		AMIContacts ami = ASConfig.getInstance()
				.getAmiContacts().get(id);
		try {
			addAMIClient(id, ami.getHost(), ami.getPort(), ami.getUser(), ami
					.getPassword());
		} catch (Exception e) {
			log.log(Level.WARNING, "process added pbx failed", e);
		}
	}

	public void pbxChanged(String id) {
		AMIClient client = amiClients.get(id);
		if(client == null)
			return;
		AMIContacts ami = ASConfig.getInstance()
		.getAmiContacts().get(id);
		client.setHostname(ami.getHost());
		client.setPortNum(ami.getPort());
		client.setUserName(ami.getUser());
		client.setSecret(ami.getPassword());
	}

	public void pbxRemoved(String ip) {
		deleteAMIClient(ip);
	}

	@Override
	public void asteriskReload(String pbx) {
		// TODO Auto-generated method stub
		
	}
	
	public void destruct(){
		ASConfig.getInstance().removeConfigListener(this);
		synchronized (amiClients) {
			Iterator<AMIClient> it = amiClients.values().iterator();
			while(it.hasNext()){
				it.next().destruct();
			}
			amiClients.clear();
		}
	}
}
