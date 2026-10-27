package com.m7.cc.ass.server.handler;

import java.util.Hashtable;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.ChatingIvrPrompt;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class WebCallChatingIvrPromptTimerTask extends TimerTask {
	private static final Logger log = Logger.getLogger(WebCallChatingIvrPromptTimerTask.class.getName());
	
	ChatingIvrPrompt cipVo = null;
	C5Channel channel = null;
	String pbx = null;
	String CallID = null;
	
	public WebCallChatingIvrPromptTimerTask(C5Channel c5channel, ChatingIvrPrompt vo) {
		this.channel = c5channel;
		this.cipVo = vo;
		this.pbx = c5channel.getPbx();
		this.CallID = c5channel.getUniqueid();
	}
	
	public C5Channel getChannel() {
		return channel;
	}

	public void setChannel(C5Channel channel) {
		this.channel = channel;
	}
	
	public void run() {
		try {
			if(RuntimeData.getInstance().getPbxViaId(pbx).getChannel(channel.getChannelName()) != null){
				if(channel.getVar("Meet-ChatingIvrPrompt") != null){
					C5Action action = new C5Action("ChatingIvrPlay", "ChatingIvrPlay"+Utils.getCurrentTimestamp());
					action.addParameter(Fields.PBX, pbx);
					action.addParameter(Fields.Account, channel.getAccount());
					action.addParameter(Fields.Exten, cipVo.getServiceNo());
					action.addParameter(Fields.CallID, CallID);
					if(cipVo.getVarStr() != null)
						action.addParameter(Fields.Variable, cipVo.getVarStr());
					C5Response res = ChatingIvrPlayHandler.processChatingIvrPlay(action);		
				}else{
					if(channel.getState().equals(Fields.Hangup)){
						Hashtable<String, String> tempMap = RuntimeData.getInstance().getWebcallChatingIvrPromptCallIDMap().get(this.CallID);
						CallID = tempMap.get("CallID");
						C5Action action = new C5Action("ChatingIvrPlay", "ChatingIvrPlay"+Utils.getCurrentTimestamp());
						action.addParameter(Fields.PBX, pbx);
						action.addParameter(Fields.Account, tempMap.get("Account"));
						action.addParameter(Fields.Exten, cipVo.getServiceNo());
						action.addParameter(Fields.CallID, CallID);
						if(cipVo.getVarStr() != null)
							action.addParameter(Fields.Variable, cipVo.getVarStr());
						ChatingIvrPlayHandler.processChatingIvrPlay(action);
					}else{
						if(channel.getLinkedChannel() != null &&
								RuntimeData.getInstance().getPbxViaId(pbx).getChannel(channel.getLinkedChannel().getChannelName()) != null){
							
							C5Action action = new C5Action("ChatingIvrPlay", "ChatingIvrPlay"+Utils.getCurrentTimestamp());
							action.addParameter(Fields.PBX, pbx);
							action.addParameter(Fields.Account, channel.getAccount());
							action.addParameter(Fields.Exten, cipVo.getServiceNo());
							action.addParameter(Fields.CallID, CallID);
							if(cipVo.getVarStr() != null)
								action.addParameter(Fields.Variable, cipVo.getVarStr());
							ChatingIvrPlayHandler.processChatingIvrPlay(action);
						}
					}
					RuntimeData.getInstance().getWebcallChatingIvrPromptCallIDMap().remove(this.CallID);
				}
			}
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			log.log(Level.WARNING, "WebCallChatingIvrPromptTimerTask has Exception!", e);
		}
	}
}
