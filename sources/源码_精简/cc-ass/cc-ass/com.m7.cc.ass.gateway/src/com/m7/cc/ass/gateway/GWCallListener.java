package com.m7.cc.ass.gateway;

import java.util.Hashtable;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.command.C5Event;

public class GWCallListener {
	
	public static GWCallListener instance;
	
	private static Logger log = Logger.getLogger(GWCallListener.class.getName());
	
	private Hashtable<String, Vector<ChannelListener>> channelListeners = 
		new Hashtable<String, Vector<ChannelListener>>();
	
	private GWCallListener(){
		instance = this;
	}
	
	public static GWCallListener getInstance(){
		if (instance == null)
			new GWCallListener();
		return instance;
	}
	
	public void addChannelListener(String account, ChannelListener listener){
		synchronized (channelListeners) {
			Vector<ChannelListener> listeners = channelListeners.get(account);
			if(listeners == null){
				listeners = new Vector<ChannelListener>();
				channelListeners.put(account, listeners);
			}
			listeners.add(listener);
		}
	}
	
	public void removeChannelListener(String account, ChannelListener listener){
		synchronized (channelListeners) {
			Vector<ChannelListener> listeners = channelListeners.get(account);
			if(listeners == null){
				listeners = new Vector<ChannelListener>();
				channelListeners.put(account, listeners);
			}
			listeners.remove(listener);
		}
	}
	
	public void removeAllChannelListeners(){
		synchronized (channelListeners) {
			channelListeners.clear();
		}
	}
	
	
	public void channelStatusChanged(GWChannel channel) {
		synchronized (channelListeners) {
			try{
				Vector<ChannelListener> allls = channelListeners.get("ALL");
				if(allls != null){
					for(int i=0;i<allls.size();i++)
						allls.get(i).channelStatusChanged(channel);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
			
//			Vector<ChannelListener> ls = channelListeners.get(channel.getAccount());
//			if(ls != null){
//				for(int i=0;i<ls.size();i++)
//					ls.get(i).channelStatusChanged(channel);
//			}
		}
	}
	
	public void channelNewExten(String account, C5Event event) {
		synchronized (channelListeners) {
			try{
				Vector<ChannelListener> pbxls = channelListeners.get("ALL");
				if(pbxls != null){
					for(int i=0;i<pbxls.size();i++)
						pbxls.get(i).newExten(event);
				}
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
			}
			if(account != null){
				Vector<ChannelListener> ls = channelListeners.get(account);
				if(ls != null){
					for(int i=0;i<ls.size();i++)
						ls.get(i).newExten(event);
				}
			}
		}

	}
}
