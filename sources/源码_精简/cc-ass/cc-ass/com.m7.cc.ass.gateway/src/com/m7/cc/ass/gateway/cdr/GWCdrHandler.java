package com.m7.cc.ass.gateway.cdr;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.gateway.ChannelListener;
import com.m7.cc.ass.gateway.GWChannel;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.util.log.IceLogger;


public class GWCdrHandler implements ChannelListener {

	private Vector<CdrListener> listeners = new Vector<CdrListener>();

	private static Logger cdrLog = IceLogger.getLogger(ASConfig.getInstance()
			.getLogDir(), "gw_cdr", "FINE", false);

	private static Logger log = Logger.getLogger(GWCdrHandler.class.getName());

	public GWCdrHandler() {

	}

	public void addListener(CdrListener listener) {
		synchronized (listeners) {
			listeners.add(listener);
		}
	}

	public void removeListener(CdrListener listener) {
		synchronized (listeners) {
			listeners.remove(listener);
		}
	}

	public void removeAllListener() {
		synchronized (listeners) {
			listeners.clear();
		}
	}

	@Override
	public void channelStatusChanged(GWChannel channel) {
//		System.out.println(channel.getJsonString());
		if(channel.isLink() && channel.getChannelStatus().equals(Fields.Hangup)
				&& (channel.getProduct().equals("400")
				|| channel.getProduct().equals("cc"))){
			cdrLog.info(channel.getJsonString());
			synchronized (listeners) {
				for (int i = 0; i < listeners.size(); i++) {
					try {
						listeners.get(i).channelCdrNew(channel);
					} catch (Exception e) {
						log.log(Level.WARNING, e.getMessage(), e);
					}
				}
			}
		}
	}

	@Override
	public void newExten(C5Event event) {
		// TODO Auto-generated method stub

	}

	public void close() {
		// TODO
	}

}
