package com.m7.cc.ass.server.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.asterisk.ami.exceptions.CommunicationException;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class OriginateHandler {
	
	private static Logger log = Logger.getLogger(OriginateHandler.class.getName());
	
	public static C5Response processOriginate(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String pbx = (String) action.getParameterValue(Fields.PBX);
			
			String channel = (String) action.getParameterValue(Fields.Channel);
			String account = action.getStringValue(Fields.Account);
			String userId = action.getStringValue(Fields.UserID);
			String exten = null;
			if(action.hasKey(Fields.Exten))
				exten = (String) action.getParameterValue(Fields.Exten);
			String application = null;
			if(action.hasKey(Fields.Application))
				application = (String) action.getParameterValue(Fields.Application);
			String data = null;
			if(action.hasKey(Fields.Data))
				data = (String) action.getParameterValue(Fields.Data);
			String callType = null;
			if(action.hasKey(Fields.CallType))
				callType = (String) action.getParameterValue(Fields.CallType);
			
			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
			SipPeer mypeer = RuntimeData.getInstance().getPbxViaId(pbx).getPeer(channel.replaceAll("SIP/", ""));
			User user = RuntimeData.getInstance().getAccount(pbx, account).getUser(userId);
			if(mypeer.getChannels().size() > 0){
				response.setSucceed(false);
				response.setMessage("This user is already calling");
				return response;
			}
			if(amiClient == null || mypeer == null || !amiClient.isAuthenticated()){
				response.setSucceed(false);
				response.setMessage("can not find this pbx/peer: "+pbx+" "+channel);
				return response;
			} else {
				Originate originate = null;
				//it's an application
				if(application != null){
					//this action is channel spy
					if(application.equalsIgnoreCase(Fields.ChanSpy)){
						user.setStatus(SipPeer.LISTENNING);
						user.addVar(Fields.CalledNo, user.getExten());
					}
					originate = new Originate(channel,
							application, data, Utils.getSynActionID("originate"));
				}
				//it's originate to a context
				else {
					String context = (String) action.getParameterValue(Fields.Context);
					String priority = (String) action.getParameterValue(Fields.Priority);
					
					if(!callType.equalsIgnoreCase("")){
						//dial out
						if(callType.equalsIgnoreCase("dialout")){
							user.setStatus(SipPeer.OUTBOUND_CALL);
							String exten1 = exten;
							if(exten.startsWith("9")){
								if(!(exten.length()==5 && exten.startsWith("95")) && !(exten.length()==5 && exten.startsWith("96"))){
									exten1 = exten.substring(1);						
								}
							}
							user.addVar(Fields.CalledNo, exten1);
						} else if(callType.equalsIgnoreCase("inner")){
							user.setStatus(SipPeer.INBOUND_CALL);
							user.addVar(Fields.CalledNo, exten);
						}
					}
					String actionId = Utils.getSynActionID("originate");
					if(action.hasKey(Fields.HasCdrVar))
						actionId = "CdrVar=" + action.getStringValue(Fields.ActionID).split("@")[0];
					originate = new Originate(channel,
							exten, context, priority, actionId);
					originate.setVariable(data);
				}
				if(originate == null){
					response.setSucceed(false);
					response.setMessage("error action");
					return response;
				}

				if(action.hasKey(Fields.Account))
					originate.setAccount(action.getStringValue(Fields.Account));
				if(action.hasKey(Fields.Async))
					originate.setAsync(action.getStringValue(Fields.Async));
				if(action.hasKey(Fields.CallerID))
					originate.setCallerID(action.getStringValue(Fields.CallerID));
				if(action.hasKey(Fields.Timeout))
					originate.setTimeout(action.getIntValue(Fields.Timeout)+"");
				if(action.hasKey(Fields.Variable))
					originate.setVariable(action.getStringValue(Fields.Variable));
				
				AsteriskResponse res;
				try {
					res = amiClient.sendSynchronousAction(originate);
					Thread.sleep(1000);
					boolean result = res.isSuccessful();
					if(!result){
						user.setStatus(SipPeer.IDLE);
						response.setSucceed(false);
						response.setMessage("Originate call failed: "+res.toString());
					} else {
						response.setSucceed(true);
					}
				} catch (CommunicationException e) {
					user.setStatus(SipPeer.IDLE);
				}
			}
		} catch (Exception e){
			log.log(Level.WARNING, "originate failed", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
