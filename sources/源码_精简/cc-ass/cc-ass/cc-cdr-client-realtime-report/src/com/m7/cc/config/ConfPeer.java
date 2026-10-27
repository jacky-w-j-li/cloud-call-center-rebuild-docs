package com.m7.cc.config;

import java.util.Hashtable;
import java.util.Iterator;

/**
 * A peer of the configuration object.
 * It is displayed in a config file like below:
 * ;comments
 * [name1]
 * param1= value1
 * param2= value2
 * ......
 * 
 * ******************
 * * [name2]        *
 * * param1= value1 *  This is a peer.
 * * param2= value2 *
 * ******************
 * 
 * ;Server configuration parameters, it is used to tell application
 * ;which host it should connect to.
 * [server]
 * address= localhost
 * port= 9876
 * 
 * ";" is comment symble, the line which is start with ";" will be treated
 * as comments.
 * 
 * @author caif
 * @since 1.0.0
 */
public class ConfPeer {
	/**
	 * Name of this peer. It is always included in "[]";
	 * Sample: [server]
	 */
	private String name;
	private Hashtable<String, String> params;
	private String comments = "";
	
	public ConfPeer(String name){
		this.name = name;
		params = new Hashtable<String, String>();
	}
	
	/**
	 * Add a parameter via key and value.
	 * It will replace the previous value if the key is already in the map.
	 * @param key
	 * @param value
	 */
	public void addParam(String key, String value){
		params.put(key, value);
	}
	
	/**
	 * Get a parameter of a specific key.
	 * It will return null if the map dose not contain this key.
	 * @param key
	 * @return the value of this key, or null if this key is not in the map.
	 */
	public String getParam(String key){
		return params.get(key);
	}
	
	public Hashtable<String, String> getParams(){
		return params;
	}

	/**
	 * Get the name of this peer.
	 * @return the name of this peer.
	 */
	public String getName() {
		return name;
	}
	
	/**
	 * set comments to this peer.
	 * The comment string will append to the original comments.
	 * @param comment comments.
	 */
	public void setComments(String comment) {
		comments = comment;
	}
	
	/**
	 * Get comments of this peer.
	 * @return string comments.
	 */
	public String getComments(){
		return comments;
	}
	
	/**
	 * If the peer contains this parameter return true,
	 * or return false.
	 * @param key
	 * @return
	 */
	public boolean contain(String key){
		return params.containsKey(key);
	}
	
	public String toString(){
		String str = comments + "[" + name + "]";
		Iterator<String> it = params.keySet().iterator();
		while(it.hasNext()){
			String key = it.next();
			str = str + ConfigProvider.newLine + key + "= " + params.get(key);
		}
		return str;
	}
}
