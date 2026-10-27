package com.m7.cc.ass.model;

import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.TimerTask;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

public class DidiChannelsCountTask extends TimerTask {
	private Logger log = IceLogger.getLogger(ASConfig.getInstance().getLogDir(), "didiChannelsCount", "ALL", false);
	@Override
	public void run() {
		Vector<String> pbxIds;
		try {
			int count = 0;
			int inCallCount = 0;
			int outCallCount = 0;
			pbxIds = RuntimeData.getInstance().getPbxs();
			for(int i=0;i<pbxIds.size();i++){
				int curCount = RuntimeData.getInstance().getPbxViaId(pbxIds.get(i)).getChannels().size();

				Hashtable<String, C5Channel> map = RuntimeData.getInstance().getPbxViaId(pbxIds.get(i)).getChannels();
				Set set = map.entrySet();
				Iterator ite = set.iterator();         
				while(ite.hasNext()){      
				     Map.Entry<String, C5Channel> entry1 = (Map.Entry<String, C5Channel>)ite.next(); 
				     if(entry1.getValue() != null && entry1.getValue().getVar("SERVICE_NO_TYPE") != null){
				    	 inCallCount ++;
				     }else{
				    	 outCallCount++;
				     }
				}   
				count += curCount;
				log.log(Level.INFO,"didiChannelsCount ["+pbxIds.get(i)+"] ["+
						Utils.getCurrentDate()+"] inCallCount = "+inCallCount+" outCallCount = "+outCallCount+" channelsCount =" + curCount);
			}
			String url = ASConfig.getInstance().getVar("cc.java.service.url");
			url = url+"?Action=didiAssChannelCount&inCount="+inCallCount+"&outCount="+outCallCount+"&cityId="+ASConfig.getInstance().getDistrictNo();
			String res = HttpProvider.sendGet(url);
			log.log(Level.INFO,"all channel count=" + count + "url ["+url+"] java-in res=" + res);
			
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			log.log(Level.WARNING,"didiChannelsCount has exception!",e);
		}
	}

}
