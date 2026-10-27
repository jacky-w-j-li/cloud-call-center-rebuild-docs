package com.dishui.config;

import java.util.Hashtable;

/**
 * This class is a object of a configure file.
 * @author caif
 * @since 1.0.0
 */
public class Configure {
	
	/**
	 * The name of this configure.
	 */
	private String name;
	
	/**
	 * Peers in this configure.
	 */
	private Hashtable<String, ConfPeer> peers;
	
	public Configure(String name){
		this.name = name;
		peers = new Hashtable<String, ConfPeer>();
	}

	/**
	 * Get the name of this configure.
	 * @return configure name
	 */
	public String getName() {
		return name;
	}
	
	/**
	 * Add a peer to this configure.
	 * @param peer
	 */
	public void addPeer(ConfPeer peer){
		peers.put(peer.getName(), peer);
	}
	
	/**
	 * Get a peer of this configure by peer's name.
	 * @param name name of peer
	 * @return
	 */
	public ConfPeer getPeer(String name){
		return peers.get(name);
	}
	
	/**
	 * Get all peers in array.
	 * @return array of all peers.
	 */
	public ConfPeer[] getAllPeers(){
		Object[] objects = peers.values().toArray();
		ConfPeer[] _peers = new ConfPeer[peers.size()];
		for(int i=0;i<_peers.length;i++)
			_peers[i] = (ConfPeer)objects[i];
		return _peers;
	}
	
	/**
	 * Remove a specific peer via peer's name.
	 * @param name name of the peer
	 */
	public void removePeer(String name){
		peers.remove(name);
	}
	
	/**
	 * Remove all peers.
	 *
	 */
	public void removeAllPeers(){
		peers.clear();
	}
}
