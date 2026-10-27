package com.m7.cc.ass.model.configuration;

import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Hangup;
import com.m7.cc.util.Utils;

public class WebCallMaxCallTimerTask extends TimerTask {
	private static final Logger log = Logger.getLogger(WebCallMaxCallTimerTask.class.getName());
	
	C5Channel channel = null;
	C5Channel lchannel = null;
	String pbx = null;
	
	public WebCallMaxCallTimerTask(C5Channel c5channel) {
		this.channel = c5channel;
		this.pbx = channel.getPbx();
	}
	
	public void setLchannel(C5Channel lchannel){
		this.lchannel = lchannel;
	}
	public C5Channel getLchannel(){
		return this.lchannel;
	}
	
	public C5Channel getChannel() {
		return channel;
	}

	public void setChannel(C5Channel channel) {
		this.channel = channel;
	}

	public void run() {
		try {
			if(channel != null && RuntimeData.getInstance().getPbxViaId(pbx).getChannel(channel.getChannelName()) != null){
				if(channel.getVar("ClearMaxCallTime") != null){
					return;
				}
				AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
				if (amiClient != null && amiClient.isAuthenticated()) {
					AsteriskResponse res;
					String channelName = channel.getChannelName();
					//CALL_HANGUP_TRANSFER
					if(channel.getVar("CALL_HANGUP_TRANSFER") != null){
						res = amiClient.sendSynchronousAction(new Hangup(channelName , 
								"WebCallMaxCallTimerTask_cht" + Utils.getCurrentTimestamp()));
					}
					res = amiClient.sendSynchronousAction(new Hangup(channelName , 
									"WebCallMaxCallTimerTask" + Utils.getCurrentTimestamp()));
					if (res.isSuccessful()) {
						log.log(Level.WARNING, "WebCallMaxCallTimerTask hangup channel success! channel = " + channel.getChannelName());
					} else {
						log.log(Level.WARNING, "WebCallMaxCallTimerTask hangup channel failed! channel = " + channel.getChannelName());
					}
				}else{
					log.log(Level.WARNING, "WebCallMaxCallTimerTask AMI Client not found! or auth failed!");
				}
			}
			if(lchannel != null && RuntimeData.getInstance().getPbxViaId(pbx).getChannel(lchannel.getChannelName()) != null){
				log.log(Level.WARNING, "-----------WebCallMaxCallTimerTask hangup channel success! lchannel = " + lchannel.getChannelName());
				if(lchannel.getVar("ClearMaxCallTime") != null){
					return;
				}
				AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
				if (amiClient != null && amiClient.isAuthenticated()) {
					AsteriskResponse res;
					String channelName = lchannel.getChannelName();
					//CALL_HANGUP_TRANSFER
					if(lchannel.getVar("CALL_HANGUP_TRANSFER") != null){
						res = amiClient.sendSynchronousAction(new Hangup(channelName , 
								"WebCallMaxCallTimerTask_cht" + Utils.getCurrentTimestamp()));
					}
					res = amiClient.sendSynchronousAction(new Hangup(channelName , 
									"WebCallMaxCallTimerTask" + Utils.getCurrentTimestamp()));
					if (res.isSuccessful()) {
						log.log(Level.WARNING, "WebCallMaxCallTimerTask hangup lchannel success! lchannel = " + lchannel.getChannelName());
					} else {
						log.log(Level.WARNING, "WebCallMaxCallTimerTask hangup lchannel failed! lchannel = " + lchannel.getChannelName());
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
