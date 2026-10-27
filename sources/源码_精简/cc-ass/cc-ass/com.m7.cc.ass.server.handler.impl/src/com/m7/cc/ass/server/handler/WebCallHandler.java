package com.m7.cc.ass.server.handler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.ChatingIvrPrompt;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.MeetWebCallMaxCallTimerTask;
import com.m7.cc.ass.model.configuration.TextAnnouncement;
import com.m7.cc.ass.model.configuration.WebCallMaxCallTimerTask;
import com.m7.cc.ass.server.webcall.dispatcher.WebCallcallbackurlCach;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.asterisk.ami.exceptions.CommunicationException;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

/**
 * old: http://211.151.35.103/ass2/command?Action=
 * Webcall&PBX=3.1.2.109&Channel=Local/915117942927@B000000005869&
 * ServiceNo=58103131 <br/>
 * new: http://211.151.33.26/command?Action=Webcall&PBX=10.1.1
 * .100&Account=Q000000008301&ServiceNo=80112&Exten=15811013870&Variable=var1:value1,var2:value2
 * 
 * @author Cai Zhibin
 * 
 */
public class WebCallHandler {
	private static final Logger log = Logger.getLogger(WebCallHandler.class
			.getName());
	
	public static C5Response processWebCall(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID());
		try {
			String serviceNo = (String) action
					.getParameterValue(Fields.ServiceNo);
			String account = (String) action.getParameterValue(Fields.Account);
			String exten = (String) action.getParameterValue(Fields.Exten);
			String webcalltype = null;
			String callbackurl = null;
			String callbacktype = null;
			if(action.hasKey(Fields.WEBCALLTYPE)){
				webcalltype = (String) action.getParameterValue(Fields.WEBCALLTYPE);
			}
			if(action.hasKey(Fields.CALLBACKURL)){
				callbackurl = (String) action.getParameterValue(Fields.CALLBACKURL);
			}
			if(action.hasKey(Fields.CALLBACKTYPE)){
				callbacktype = (String) action.getParameterValue(Fields.CALLBACKTYPE);
			}
			
			if (!exten.matches("[0-9]+")) {
				response.setMessage("[303] Exten error [" + exten + "]");
				response.setSucceed(false);
				return response;
			}

			String pbx = null;
			if(action.hasKey(Fields.PBX)){
				pbx = (String) action.getParameterValue(Fields.PBX);
			}
			if(pbx == null){
				pbx = RuntimeData.getInstance().getPbxViaAccount(account);
			}
			if (pbx == null) {
				response.setMessage("[401]ACCOUNT not found");
				response.setSucceed(false);
				return response;
			}

			C5Account c5Account = RuntimeData.getInstance().getAccount(pbx,
					account);

			if (c5Account.getServicePeer(serviceNo) == null) {
				response.setMessage("[404]The serviveNo not found.");
				response.setSucceed(false);
				return response;
			}

			String dialoutPrefix = null;
			try {
				dialoutPrefix = c5Account.getSipContact(exten,
						Fields.DialoutFlag);
			} catch (Exception e) {
				response.setMessage("[406]Dialout line not config.");
				response.setSucceed(false);
				return response;
			}
			
			String variable = "";
			if (action.hasKey(Fields.Variable)) {
				variable = (String) action.getParameterValue(Fields.Variable);
				variable = variable.trim();
				if (variable.equals("")) {
					response.setMessage("[408]Variable parameter found, but value is null or blank.");
					response.setSucceed(false);
					return response;
				}
			}
			String timeout = "20000";
			if (action.hasKey(Fields.Timeout)) {
				timeout = (String) action.getParameterValue(Fields.Timeout);
				if(Utils.isNumeric(timeout)){
					int timeoutInt = Integer.parseInt(timeout);
					if(timeoutInt >= 20 && timeoutInt <= 60){
						timeout += "000";
					}else{
						response.setMessage("[409]Timeout parameter found, but value is null or not a number. Notice: 20 < Timeout < 60");
						response.setSucceed(false);
						return response;
					}
				}else{
					response.setMessage("[409]Timeout parameter found, but value is null or not a number. Notice: 20 < Timeout < 60");
					response.setSucceed(false);
					return response;
				}
			}
			String maxCallTime = "";
			if (action.hasKey(Fields.MaxCallTime) || action.hasKey(Fields.MeetMaxCallTime)) {
				if(action.hasKey(Fields.MeetMaxCallTime))
					maxCallTime = (String) action.getParameterValue(Fields.MeetMaxCallTime);
				if(action.hasKey(Fields.MaxCallTime))
					maxCallTime = (String) action.getParameterValue(Fields.MaxCallTime);				
				if(Utils.isNumeric(maxCallTime)){
					int maxCallTimeInt = Integer.parseInt(maxCallTime);
					if(maxCallTimeInt >= 1){
						maxCallTime += "000";
					}else{
						response.setMessage("[410]MaxCallTime parameter found, but value is null or not a number. Notice: MaxCallTime >= 1");
						response.setSucceed(false);
						return response;
					}
				}else{
					response.setMessage("[410]MaxCallTime parameter found, but value is null or not a number. Notice: MaxCallTime >= 1");
					response.setSucceed(false);
					return response;
				}
			}
			
			ArrayList<ChatingIvrPrompt> chatingIvrPromptList = new ArrayList<ChatingIvrPrompt>();
			try{
				if (action.hasKey(Fields.ChatingIvrPrompt) || action.hasKey(Fields.MeetChatingIvrPrompt)) {
					String chatingIvrPrompt = null;
					if(action.hasKey(Fields.ChatingIvrPrompt))
						chatingIvrPrompt = (String) action.getParameterValue(Fields.ChatingIvrPrompt);
					if(action.hasKey(Fields.MeetChatingIvrPrompt))
						chatingIvrPrompt = (String) action.getParameterValue(Fields.MeetChatingIvrPrompt);
					String[] cipArr = chatingIvrPrompt.split(";");
					for(int i=0 ; i< cipArr.length ; i++){
						String[] childArr = cipArr[i].split("-");
						if(childArr.length >= 2){
							if(!Utils.isNumeric(childArr[0]) || !Utils.isNumeric(childArr[1])){
								response.setMessage("[411]ChatingIvrPrompt parameter found, but value is wrong.");
								response.setSucceed(false);
								return response;
							}
							ChatingIvrPrompt cip = new ChatingIvrPrompt();
							cip.setTime(childArr[0]+"000");
							cip.setServiceNo(childArr[1]);
							if(childArr.length > 2){
								cip.setVarStr(childArr[2]);
							}
							chatingIvrPromptList.add(cip);
						}else{
							response.setMessage("[412]ChatingIvrPrompt parameter found, but value is wrong.");
							response.setSucceed(false);
							return response;
						}
					}
				}
			}catch(Exception e){
				log.log(Level.WARNING,"[413]ChatingIvrPrompt parameter found, but value is wrong.",e);
				response.setMessage("[413]ChatingIvrPrompt parameter found, but value is wrong.");
				response.setSucceed(false);
				return response;
			}
			
			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			if (amiClient == null || !amiClient.isAuthenticated()) {
				response.setSucceed(false);
				response.setMessage("[407]Can not find this pbx/peer: " + pbx);
				return response;
			} else {
				if (action.hasKey("TextAnnExten")) {
					String textAnnExten = (String) action.getParameterValue("TextAnnExten");
					TextAnnouncement textAnnouncement = c5Account.getTextAnnouncements().get(textAnnExten);
					if(textAnnouncement != null){
						String text = textAnnouncement.getAnnouncementText();
						if(text != null && !text.equals("")){
							//tts engine is kdxf
							if(textAnnouncement.getEngine()!=null 
									&& textAnnouncement.getEngine().equals(TextAnnouncement.ENGINE_KDXF)){
								HashMap<String, String> varMap = new HashMap<String, String>();
								if(!variable.equals("")){
									String[] variables = variable.split(",");
									for (String token : variables) {
										int index = token.indexOf(":");
										String varKey = token.substring(0, index);
										String varValue = token.substring(index + 1);
										if(varKey.startsWith("__")){
											varMap.put(varKey.substring(2), varValue);
										}else{
											varMap.put(varKey, varValue);							
										}
									}
								}
								if(textAnnouncement.getReplaceVar()!= null && !textAnnouncement.getReplaceVar().equals("")){
									String replaceVar = textAnnouncement.getReplaceVar();
									if(replaceVar.indexOf(",") != -1){
										String[] varArr = replaceVar.split(",");
										for(int i=0;i<varArr.length;i++){
											if(varMap.get(varArr[i]) != null)
												text = text.replaceAll(varArr[i], varMap.get(varArr[i]));
										}
									}else{
										if(varMap.get(replaceVar) != null)
											text = text.replaceAll(replaceVar, varMap.get(replaceVar));
									}
								}
								String url = "http://127.0.0.1:9999";
								String data = "Action=generateWav&text="+text+"&voiceName="+textAnnouncement.getVoiceName()
										+"&speed="+textAnnouncement.getSpeed()+"&pitch="+textAnnouncement.getPitch()+"&volume="+textAnnouncement.getVolume();
								log.log(Level.WARNING, "webcall send kdxfServer request = " + data);
								String result = HttpProvider.sendPost(url, data.getBytes("UTF-8"), 35000);
								log.log(Level.WARNING, "webcall get kdxfServer result = " + result);
								HashMap<String,Object> resMap = null;
								if(result != null){
									JSONReader jr = new JSONReader();
									resMap = (HashMap<String,Object>)jr.read(result);
								}
								if(resMap != null && Boolean.valueOf(resMap.get("Succeed").toString())){
									String fileName = resMap.get("WavName").toString();
									c5Account.getWebcallTtsGenerateMap().put(exten, fileName);
								}
									
							}
						}
					}
				}
				
				Originate originate = null;
				String priority = "1";
				
				String channel = "SIP/" + dialoutPrefix + "@"
						+ ASConfig.getInstance().getDialoutLine() + ":"
						+ ASConfig.getInstance().getDialoutPort();
				originate = new Originate(channel, serviceNo, serviceNo,
						priority, action.getActionID());
//				originate.setCallerID(c5Account.getDidNum(Fields.DialoutFlag));
				originate.setCallerID(c5Account.getAutoCallDidNum());
				originate.setAsync("true");
				originate.setTimeout(timeout);
				//add by chenguang
				String varStr = "IS_WEBCALL=true|WEBCALL_EXTEN="+exten;
				if(!variable.equals("")){
					String[] variables = variable.split(",");
					for (String token : variables) {
						int index = token.indexOf(":");
						String varKey = token.substring(0, index);
						String varValue = token.substring(index + 1);
						if(varKey.startsWith("__")){
							varStr += "|"+varKey.substring(2)+"="+varValue;
						}else{
							varStr += "|"+varKey+"="+varValue;							
						}
					}
				}
				 originate.setVariable(varStr);
				// originate.setVariable("__FROM_DID=" + serviceNo);
				AsteriskResponse res;
				try {					
					if(webcalltype !=null && webcalltype.equals("asynchronous")){
						if(callbackurl == null){
							response.setSucceed(false);
							response.setMessage("Can not find callbackurl!");
							return response;
						}else{
							if(callbacktype == null||callbacktype.equals("get")){
								callbacktype = "get";
							}else if(callbacktype.equals("post")){
								callbacktype = "post";
							}else{
								response.setSucceed(false);
								response.setMessage("CallBackType can't send! CallBackType:" + callbacktype);
								return response;
							}
							HashMap<String, Object> webcallmap = new HashMap<String, Object>();
							webcallmap.put("callbackurl", callbackurl);
							webcallmap.put("callbacktype", callbacktype);
							webcallmap.put("maxCallTime", maxCallTime);
							webcallmap.put("variable", variable);
							webcallmap.put("chatingIvrPromptList", chatingIvrPromptList);
							webcallmap.put("action", action);
							WebCallcallbackurlCach.add(action.getActionID(), webcallmap);
							amiClient.sendAction(originate);
						}
					}else{
						res = amiClient.sendSynOriginate(originate);						
						if(!res.isSuccessful() && !res.getParameter(Fields.Reason).equals("4")){					
							if(action.hasKey(Fields.Redial)){
								res = amiClient.sendSynOriginate(originate);								
							}						
						}
						if (res.isSuccessful() && res.getParameter(Fields.Reason).equals("4")) {
							C5Channel c5channel = RuntimeData.getInstance()
									.getPbxViaId(pbx)
									.getChannel(res.getParameter(Fields.Channel));
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
								c5channel.addC5Var("WebcallActionID", action.getActionID());
								c5channel.addVar("WebcallActionID", action.getActionID());								
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
						}
						response.setMessage(res.getParameter(Fields.Reason));
						response.setSucceed(true);
					} 
				}catch (CommunicationException e) {
					response.setMessage(e.getMessage());
				}
			}
			response.setSucceed(true);
		} catch (Exception e) {
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
