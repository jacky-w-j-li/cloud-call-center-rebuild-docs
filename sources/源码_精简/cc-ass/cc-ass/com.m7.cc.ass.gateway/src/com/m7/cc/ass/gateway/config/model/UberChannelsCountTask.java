package com.m7.cc.ass.gateway.config.model;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.TimerTask;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.gateway.GWChannel;
import com.m7.cc.ass.gateway.GateWayActivator;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

public class UberChannelsCountTask extends TimerTask {
	private Logger log = IceLogger.getLogger(ASConfig.getInstance().getLogDir(), "UberChannelsCount", "ALL", false);
	@Override
	public void run() {
		try {
			int count = 0;
			int inCallCount = 0;
			int outCallCount = 0;
			if(GateWayActivator.getHandler() != null){
				HashMap<String,GWChannel> channelsMap = GateWayActivator.getHandler().getChannels();
				
				for (Map.Entry<String, GWChannel> entry : channelsMap.entrySet()) {
					GWChannel channel = entry.getValue();
					if(channel.getVar("UBER_INBOUND") != null){
						inCallCount ++;
						count++;
					}else if(channel.getVar("UBER_OUTBOUND") != null){
						outCallCount++;
						count++;
					}
				}
				log.log(Level.INFO,"uberChannelsCount [gateway] ["+
						Utils.getCurrentDate()+"] inCallCount = "+inCallCount+" outCallCount = "+outCallCount+" channelsCount =" + count);

				String url = ASConfig.getInstance().getVar("cc.java.service.url");
				url = url+"?Action=uberAssChannelCount&inCount="+inCallCount+"&outCount="+outCallCount+"&cityId="+ASConfig.getInstance().getDistrictNo();
				String res = HttpProvider.sendGet(url);
				log.log(Level.INFO,"all channel count=" + count + "url ["+url+"] java-in res=" + res);
			}else{
				log.log(Level.INFO,"when uberChannelsCount run but EventHandler is null.we can't count!");
			}
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			log.log(Level.WARNING,"UberChannelsCount has exception!",e);
		}
	}

}
