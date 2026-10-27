package com.m7.cc.ass.server.handler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.TimerTask;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.service.OriginateResponseListener;
import com.m7.cc.ass.model.ChatingIvrPrompt;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.MeetWebCallMaxCallTimerTask;
import com.m7.cc.ass.model.configuration.WebCallMaxCallTimerTask;
import com.m7.cc.ass.server.webcall.dispatcher.WebCallTask;
import com.m7.cc.ass.server.webcall.dispatcher.WebCallcallbackurlCach;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

/**
 * 
 * @author Jing DeLiang 2016-08-15
 * 
 */
public class WebcallAsynchronousHandler implements OriginateResponseListener {
	private Logger log = Logger.getLogger(WebcallAsynchronousHandler.class.getName());

	private static ExecutorService executor;
	
	public WebcallAsynchronousHandler() {
		executor = Executors.newCachedThreadPool();
	}

	

	/**
	 * Event: OriginateResponse
	 * Privilege: call,all
	 * Timestamp: 1328668031.713113
	 * ActionID: originate6265657272351846768
	 * Response: Success
	 * Channel: SIP/21302735-18aac3c0
	 * Context: Q000000005225
	 * Exten: 9051257703522
	 * Reason: 4
	 * Uniqueid: ass-03-145-1328668031.74740
	 * CallerID: <unknown>
	 * CallerIDNum: <unknown>
	 * CallerIDName: <unknown>
	 * @param event
	 */
	@Override
	public void OriginateResponse(C5Event event) {
		try {
			String actionID = event.getStringValue(Fields.ActionID);
			String reason = event.getStringValue(Fields.Reason);
			HashMap<String, Object> urlandtype = WebCallcallbackurlCach.getWebCallcallbackurlcach(actionID);
			if(urlandtype != null){
				C5Channel c5channel = RuntimeData.getInstance()
						.getPbxViaId(event.getStringValue(Fields.PBX))
						.getChannel(event.getStringValue(Fields.Channel));
				String callbackurl = urlandtype.get("callbackurl").toString();
				String callbacktype = urlandtype.get("callbacktype").toString();
				String maxCallTime = urlandtype.get("maxCallTime").toString();
				C5Action action = (C5Action) urlandtype.get("action");
				System.out.println("actionid:"+action.getActionID());
				String variable = urlandtype.get("variable").toString();
				ArrayList<ChatingIvrPrompt> chatingIvrPromptList = (ArrayList<ChatingIvrPrompt>) urlandtype.get("chatingIvrPromptList");
				System.out.println("ssss"+chatingIvrPromptList.size());
				if (c5channel != null) {
					if(!variable.equals("")){
						String[] variables = variable.split(",");
						for (String token : variables) {
							int index = token.indexOf(":");
							String varKey = token.substring(0, index);
							String varValue = token.substring(index + 1);
							if(varKey.startsWith("__")){
								c5channel.addC5Var(varKey.substring(2),varValue);
								c5channel.addVar(varKey.substring(2),varValue);
							}else{
								c5channel.addVar(varKey,varValue);									
							}
						}
					}
					c5channel.addC5Var("WebcallActionID", actionID);
					c5channel.addVar("WebcallActionID", actionID);								
					if(maxCallTime != ""){
						if(action.hasKey(Fields.MeetMaxCallTime)){
							MeetWebCallMaxCallTimerTask maxCallTask = new MeetWebCallMaxCallTimerTask(c5channel);
							c5channel.addVar("Meet-MaxCallTime", "true");
							c5channel.setMaxCallTime(Integer.parseInt(maxCallTime));
							c5channel.setMeetMaxCallTimerTask(maxCallTask);
						}else{
							WebCallMaxCallTimerTask maxCallTask = new WebCallMaxCallTimerTask(c5channel);
							c5channel.setMaxCallTime(Integer.parseInt(maxCallTime));
							c5channel.setMaxCallTimerTask(maxCallTask);
						}
					}
					if(chatingIvrPromptList.size() > 0){
						if(action.hasKey(Fields.MeetChatingIvrPrompt)){
							c5channel.addVar("Meet-ChatingIvrPrompt", "true");									
						}
						Hashtable<String, TimerTask> tmpMap = new Hashtable<String, TimerTask>();
						for(int i=0 ; i<chatingIvrPromptList.size() ; i++){
							WebCallChatingIvrPromptTimerTask wccipt = 
									new WebCallChatingIvrPromptTimerTask(c5channel, chatingIvrPromptList.get(i));
							tmpMap.put(chatingIvrPromptList.get(i).getTime(), wccipt);
						}
						c5channel.setWebCallChatingIvrPromptVoMap(tmpMap);
					}
				} else {
					log.warning("Channel not found in webcall.");
				}
				executor.execute(new WebCallTask(callbackurl,actionID,reason,callbacktype));
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
}
