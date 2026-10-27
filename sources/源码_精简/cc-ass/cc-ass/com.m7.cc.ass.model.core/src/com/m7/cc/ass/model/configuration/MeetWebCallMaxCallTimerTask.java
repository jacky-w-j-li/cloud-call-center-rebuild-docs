package com.m7.cc.ass.model.configuration;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Map;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Hangup;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class MeetWebCallMaxCallTimerTask extends TimerTask {
	private static final Logger log = Logger.getLogger(MeetWebCallMaxCallTimerTask.class.getName());
	
	C5Channel channel = null;
	
	public MeetWebCallMaxCallTimerTask(C5Channel c5channel) {
		this.channel = c5channel;
	}
	
	public void run() {
		try {
			if(RuntimeData.getInstance().getPbxViaId(channel.getPbx()).getChannel(channel.getChannelName()) != null){
				if(channel.getVar("ClearMaxCallTime") != null){
					return;
				}
				AMIClient amiClient = AMICore.getInstance().getAMIClient(channel.getPbx());
				if (amiClient != null && amiClient.isAuthenticated()) {
					AsteriskResponse res;
					
					String channelName = channel.getChannelName();
					//CALL_HANGUP_TRANSFER
					if(channel.getVar("CALL_HANGUP_TRANSFER") != null){
						res = amiClient.sendSynchronousAction(new Hangup(channelName , 
								"MeetWebCallMaxCallTimerTask_cht" + Utils.getCurrentTimestamp()));
					}
					ArrayList<String> list = new ArrayList<String>();
					Hashtable<String, C5Channel> cs = RuntimeData.getInstance().getPbxViaId(channel.getPbx()).getChannels();
					for(Map.Entry<String, C5Channel> entry:cs.entrySet()){
						C5Channel curChannel = entry.getValue();
						if(!curChannel.getUniqueid().equals(channel.getUniqueid())
								&& curChannel.getAccount().equals(channel.getAccount()) 
								&& curChannel.getVar("ORI_MEETME_NUM").equals(channel.getVar("ORI_MEETME_NUM"))){
							list.add(curChannel.getChannelName());
						}
					}
					//------hangup channel1
					res = amiClient.sendSynchronousAction(new Hangup(channelName , "MeetWebCallMaxCallTimerTask" + Utils.getCurrentTimestamp()));
					if (res.isSuccessful()) {
						log.log(Level.WARNING, "MeetWebCallMaxCallTimerTask hangup channel success! channel = " + channel.getChannelName());
					} else {
						log.log(Level.WARNING, "MeetWebCallMaxCallTimerTask hangup channel failed! channel = " + channel.getChannelName());
					}
					//-------hangup other channel
					for(int i=0 ;i<list.size();i++){
						res = amiClient.sendSynchronousAction(new Hangup(list.get(i) , "MeetWebCallMaxCallTimerTask" + Utils.getCurrentTimestamp()));
						if (res.isSuccessful()) {
							log.log(Level.WARNING, "MeetWebCallMaxCallTimerTask hangup channel success! channel = " + list.get(i));
						} else {
							log.log(Level.WARNING, "MeetWebCallMaxCallTimerTask hangup channel failed! channel = " + list.get(i));
						}						
					}
				}else{
					log.log(Level.WARNING, "WebCallMaxCallTimerTask AMI Client not found! or auth failed!");
				}
			}
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			log.log(Level.WARNING, "WebCallMaxCallTimerTask AMI has Exception!", e);
		}
	}
}
