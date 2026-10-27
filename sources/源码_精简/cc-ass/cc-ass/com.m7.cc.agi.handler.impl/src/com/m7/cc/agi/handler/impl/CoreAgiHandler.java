package com.m7.cc.agi.handler.impl;

import com.m7.cc.agi.handler.AgiHandler;
import com.m7.cc.agi.handler.impl.handlers.CallGatewayHandler;
import com.m7.cc.agi.handler.impl.handlers.CallInBlackNumHandler;
import com.m7.cc.agi.handler.impl.handlers.CallLimitHandler;
import com.m7.cc.agi.handler.impl.handlers.CallNumberInfoHandler;
import com.m7.cc.agi.handler.impl.handlers.CallUrlHandler;
import com.m7.cc.agi.handler.impl.handlers.ChatingIvrPlaySetVarHandler;
import com.m7.cc.agi.handler.impl.handlers.DialinHandler;
import com.m7.cc.agi.handler.impl.handlers.DialoutHandler;
import com.m7.cc.agi.handler.impl.handlers.EncryptMD5Handler;
import com.m7.cc.agi.handler.impl.handlers.GetDisplayNameHandler;
import com.m7.cc.agi.handler.impl.handlers.LocalHandler;
import com.m7.cc.agi.handler.impl.handlers.LootCallHandler;
import com.m7.cc.agi.handler.impl.handlers.PhoneNumberHandler;
import com.m7.cc.agi.handler.impl.handlers.QueueHandler;
import com.m7.cc.agi.handler.impl.handlers.SatisfactionHandler;
import com.m7.cc.agi.handler.impl.handlers.SayNumberHandler;
import com.m7.cc.agi.handler.impl.handlers.SipManageHandler;
import com.m7.cc.agi.handler.impl.handlers.TtsZhHandler;
import com.m7.cc.agi.handler.impl.handlers.UtilHandler;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;

public class CoreAgiHandler implements AgiHandler{
	
	//private static HashMap<String, String> zhList = new HashMap<String, String>();
	
	public CoreAgiHandler(){
		//loadZhList();
	}
	
//	public static HashMap<String, String> getZhList(){
//		return zhList;
//	}
//	
//	private void loadZhList(){
//		File file = new File("./zh_list_coded");
//		try {
//			BufferedReader br = new BufferedReader(new FileReader(file));
//			String line = null;
//			while( (line = br.readLine()) != null){
//				String[] a = line.split(" ");
//				if(a.length == 2)
//					zhList.put(a[0], a[1]);
//				else {
//					System.out.println(line);
//				}
//			}
//			br.close();
//		} catch (FileNotFoundException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		} catch (Exception e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
//	}
	
	@Override
	public void handle(C5Action action) {
		if(action.getActionName().equalsIgnoreCase(Fields.Agi_callinroute)){
			CallGatewayHandler.callInRoute(action);
		}else if(action.getActionName().equalsIgnoreCase("agicallinblacknum")){
			CallInBlackNumHandler.isBlackNum(action);
		}else if(action.getActionName().equalsIgnoreCase(Fields.AgiSayExten)){
			SayNumberHandler.handlerSayExten(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiCallUrl)){
			CallUrlHandler.hadle(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiTssZh)){
			TtsZhHandler.handle(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiMD5)){
			EncryptMD5Handler.handle(action);
		} else if(action.getActionName().equalsIgnoreCase("agibindexten")){
			SipManageHandler.bindExten(action);
		} else if(action.getActionName().equalsIgnoreCase("agibindquery")) {
			SipManageHandler.queryBindInfo(action);
		} else if(action.getActionName().equalsIgnoreCase("agisiplogin")) {
			SipManageHandler.sipLogin(action);
		} else if(action.getActionName().equalsIgnoreCase("agisiplogout")) {
			SipManageHandler.sipLogout(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiProcessIvrLogin)){
			LocalHandler.processIvrLogin(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiProcessIvrLogout)){
			LocalHandler.processIvrLogout(action);
		}else if(action.getActionName().equalsIgnoreCase("gaicalllimit")) {
			CallLimitHandler.callLimit(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiDialin)){
			DialinHandler.dialin(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiCheckQueueAssignable)){
			QueueHandler.checkAssignable(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiIsLocalNumber)){
			PhoneNumberHandler.isLocalNumber(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.GateDisplayNameHandler)){
			GetDisplayNameHandler.hadle(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiDialoutable)){
			DialoutHandler.isDialoutable(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiIsOutboundBlackList)){
			DialoutHandler.isOutboundBlackList(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiIncomingCallLimit)){
			CallLimitHandler.incomingCallLimit(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiSatisfactionValidate)){
			SatisfactionHandler.satisfaction(action);
		} else if(action.getActionName().equals(Fields.AgiGetNumberDistrictNo)) {
			CallNumberInfoHandler.getNumberDistrictNo(action);
		} else if(action.getActionName().equals(Fields.AgiGetNumberProvince)) {
			CallNumberInfoHandler.getNumberProvince(action);
		} else if(action.getActionName().equals(Fields.AgiDialinWithoutRedirect)) { 
			DialinHandler.dialinWithoutRedirect(action);
		} else if(action.getActionName().equals(Fields.AgiGetUserCallerIDNum)) {
			DialoutHandler.getUserCallerIDNum(action);
		} else if(action.getActionName().equals(Fields.AgiGetUserSipViaFromDid)) {
			DialinHandler.getUserSipViaFromDid(action);
		} else if(action.getActionName().equals(Fields.AgiFormatDialoutNumber)) {
			DialoutHandler.formatDialoutNumber(action);
		} else if(action.getActionName().equals(Fields.AgiDialoutRoute)) {
			DialoutHandler.dialoutRoute(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiLootCall)){
			LootCallHandler.hadle(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiSuperDialin)){
			DialinHandler.superDialin(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiGetRandom)){
			UtilHandler.getRandom(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.Agi_multiAccCallMemoryByProxy)){
			CallGatewayHandler.multiAccCallMemoryByProxy(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.Agi_callInternational)){
			CallGatewayHandler.callInternational(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.AgiChatingIvrSetVar)){
			ChatingIvrPlaySetVarHandler.processChatingIvrSetVar(action);
		} else if(action.getActionName().equalsIgnoreCase(Fields.agiHangupLinkChannel)){
			UtilHandler.hangupLinkChannel(action);
		}else if(action.getActionName().equalsIgnoreCase(Fields.agiOriginateThirdPartyToThreewaycall)){
			UtilHandler.originateThirdPartyToThreewaycall(action);
		}else if(action.getActionName().equalsIgnoreCase(Fields.Agi_setVarFromLinkChannel)){
			UtilHandler.setVarFromLinkChannel(action);
		} else {
			try{
				AgiSession session = (AgiSession) action.getParameterValue(Fields.Session);
				session.close();
			} catch (Exception e){
				
			}
		}
	}
	
}
