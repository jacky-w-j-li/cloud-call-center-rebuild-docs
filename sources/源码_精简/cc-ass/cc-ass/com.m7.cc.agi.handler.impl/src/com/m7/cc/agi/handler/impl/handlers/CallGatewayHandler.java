package com.m7.cc.agi.handler.impl.handlers;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.CallRoute;
import com.m7.cc.ass.gateway.GWChannel;
import com.m7.cc.ass.gateway.GateWayActivator;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;

public class CallGatewayHandler {
	public static Logger log = Logger.getLogger(CallGatewayHandler.class.getName());

	public static void callInRoute(C5Action action) {
		try {
			AgiSession session = (AgiSession) action.getParameters().remove(
					Fields.Session);
			try {
				String agi_network_script = action
						.getStringValue(Fields.agi_network_script);
				String channelName = action.getStringValue(Fields.agi_channel);
				String[] a = agi_network_script.substring(
						agi_network_script.indexOf('?') + 1).split("&");
				String did = a[0].split("=")[1];
				String routeResult = CallRoute.getCallInRoute(did);
				
				if(routeResult == null) {
					session.send("SET VARIABLE DOMAIN \"0\"");
//					session.send("HANGUP "+channelName);
				} else {
					if(routeResult.split(",").length > 2){
						session.send("SET VARIABLE ACCOUNT \""+routeResult.split(",")[0]+"\"");
						session.send("SET VARIABLE DOMAIN \""+routeResult.split(",")[1]+"\"");
						session.send("SET VARIABLE NUM \""+routeResult.split(",")[2]+"\"");
						session.send("SET VARIABLE IS400 \"1\"");
					}else{
						session.send("SET VARIABLE ACCOUNT \""+routeResult.split(",")[0]+"\"");
						session.send("SET VARIABLE DOMAIN \""+routeResult.split(",")[1]+"\"");						
					}
				}
				session.close();
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
				session.close();
				return;
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
		}
	}
	
	public static void callInternational(C5Action action){
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters().remove(Fields.Session);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			return;
		}
		try {
			String agi_network_script = action.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String channel_uniqueid = action.getStringValue(Fields.agi_uniqueid);
			String Account = a[0].split("=")[1];
			String calledNo = a[1].split("=")[1];
			String callNo = a[2].split("=")[1];
			String agentId = null;
			if(a.length > 3){
				agentId = a[3].split("=")[1];
			}
			if(agentId == null){
				agentId = "";
			}
			
			String billUrl = ASConfig.getInstance().getVar("lisence.url");
			if(billUrl.endsWith("/")){
				billUrl = billUrl.substring(0, billUrl.length()-7);
			}else{
				billUrl = billUrl.substring(0, billUrl.length()-6);
			}
			if(billUrl != null){
				String requestUrl = billUrl + "openService/?action=isNumberAllowedIntl&account="+Account+"&product=cc&did="+calledNo+"&cid="+callNo+"&agentId="+agentId;
				String result = HttpProvider.sendGet(requestUrl);
				log.log(Level.INFO, "ass require yy-server,get callInternational callinRoute request="+ requestUrl + " .result=" + result);
				if (result != null) {
					JSONReader reader = new JSONReader();
					Map<String, Object> info = (Map<String, Object>) reader.read(result);
					if(info.get("success").toString().equals("true")){
						if(info.get("allowed").toString().equals("true")){
							HashMap<String, String> intl = (HashMap<String, String>)info.get("intl");
							String line = intl.get("line");
							String dest = intl.get("dest");
							String code = intl.get("code");
							session.send("SET VARIABLE allowed 1");
							session.send("SET VARIABLE INTL-ROUTE "+line);
							log.log(Level.INFO, "ass require yy-server,get callInternational channel_uniqueid:" + channel_uniqueid);
							GWChannel gwchannel = GateWayActivator.getHandler().getChannel(channel_uniqueid);
							if(gwchannel != null){
								gwchannel.setCalleeCity(dest);
								gwchannel.setCalleeProvince(dest);
								gwchannel.setCalleeDistrictNo(code);
							}
//						    "code": "886",
//						    "price": 11307,
//						    "line": "004",
//						    "dest": "Taiwan"
						}else{
							session.send("SET VARIABLE allowed 0");
							action.getParameters().clear();
							session.close();
						}
					}
				}
			}
			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}
	public static void multiAccCallMemoryByProxy(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			return;
		}
		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String proxyName = a[0].split("=")[1];
			String callNo = a[1].split("=")[1];

			//request cc-server get route.
			String appUrl = ASConfig.getInstance().getVar("app.url");
			if(appUrl != null){
				String result = HttpProvider.sendGet(appUrl + "service/?action=multiAccountCallMemoryByProxy&json={\"proxyName\":\""+proxyName
						+"\",\"callNo\":\""+callNo+"\"}");
				log.log(Level.INFO, "ass require cc-server,get multiAccountCallMemoryByProxy callinRoute" + result);
				if (result != null) {
					JSONReader reader = new JSONReader();
					Map<String, Object> info = (Map<String, Object>) reader.read(result);
					if(info.get("success").toString().equals("true")){
						if(info.get("isFound").toString().equals("true")){
							String isDialExten = info.get("isDialExten").toString();
							String serviceNo = info.get("serviceNo").toString();
							String ip = info.get("ip").toString();
							String jobNum = info.get("jobNum").toString();
							session.send("SET VARIABLE isFound 1");
							if(isDialExten.equals("true")){
								session.send("SET VARIABLE isDialExten 1");
								session.send("SET VARIABLE jobNum " + jobNum);
							}else{
								session.send("SET VARIABLE isDialExten 0");
							}
							session.send("SET VARIABLE accDomain " + ip);
							session.send("SET VARIABLE accServiceNo " + serviceNo);
							
							action.getParameters().clear();
							session.close();
							return;
						}else{
							session.send("SET VARIABLE isFound 0");
							action.getParameters().clear();
							session.close();
						}
					}
				}
			}
			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}
	public static void main(String[] args) {
		String billUrl = "http://115.29.14.183:3000/public/";
		if(billUrl.endsWith("/")){
			billUrl = billUrl.substring(0, billUrl.length()-7);
		}else{
			billUrl = billUrl.substring(0, billUrl.length()-6);
		}
		System.out.println(billUrl);
	}
}
