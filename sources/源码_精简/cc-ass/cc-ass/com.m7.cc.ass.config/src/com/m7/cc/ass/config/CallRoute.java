package com.m7.cc.ass.config;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;


public class CallRoute {
	private static Logger log = Logger.getLogger(CallRoute.class.getName());
	
	private static List<String> callInKeys = new ArrayList<String>();
//	private static Map<String, String> callInRoutes = new HashMap<String, String>();
	private static Map<String, HashMap<String,String>> callInRoutes = new HashMap<String, HashMap<String,String>>();
	private static Map<String, String> service400NumRoutes = new HashMap<String, String>();
	
	public static String getCallInRoute(String serviceNo) {
		String routeResult = null;
		if(callInRoutes.containsKey(serviceNo)){
			HashMap<String, String> thisRoute = callInRoutes.get(serviceNo);
			if(thisRoute.get("is400").equals("true")){
				routeResult = thisRoute.get("account")+","+ thisRoute.get("route") +","+thisRoute.get("num");
			}else{
				routeResult = thisRoute.get("account")+","+ thisRoute.get("route");
			}
		}else{
			try{
				HashMap<String, String> routeVo = CallRoute.getRouteFromBill(serviceNo);
				if(routeVo == null){
					return routeResult;
				}
				if(routeVo.get("status").equals("404")){
					return routeResult;
				}
				if(routeVo.get("is400").equals("true")){
					routeResult = routeVo.get("account")+","+routeVo.get("route")+","+routeVo.get("num");
					service400NumRoutes.put(routeVo.get("num"), serviceNo);
				}else{
					routeResult = routeVo.get("account")+","+routeVo.get("route");
				}
				callInRoutes.put(serviceNo, routeVo);
				callInKeys.add(serviceNo);
				saveInRoute();
			} catch(Exception e) {
				log.log(Level.WARNING, "update callin route failed", e);
			}
		}
		return routeResult;
	}
	
	public static String getServiceNoBy400(String num400){		
		if(service400NumRoutes.get(num400) != null){
			return service400NumRoutes.get(num400);
		}
		return null;
	}
	
	public static HashMap<String,String> getRouteFromBill(String serviceNo){
		HashMap<String, String> routeVo = null;
		try{
			String url = ASConfig.getInstance().getVar("lisence.url")+
					"?action=service.getCallInRoute&data={\"callNum\":\""+serviceNo+
					"\",\"pbxId\":\""+ASConfig.getInstance().getFristPbxId()+"\"}";
			String result = HttpProvider.sendGet(url, 3000);
			log.log(Level.INFO, "require inRoute from bill [serviceNum="+serviceNo+"] [pbxId="
									+ASConfig.getInstance().getFristPbxId()+"] result = " + result);
			if(result.equals("")){
				return null;
			}
			JSONReader jr = new JSONReader();
			Map<String, Object> map = (Map<String, Object>)jr.read(result);
			String status = (String) map.get("status");
			boolean is400  = (Boolean) map.get("is400");
			String num400 = (String) map.get("num");
			String route = (String) map.get("route");
			String account = (String) map.get("account");
			routeVo = new HashMap<String, String>();
			routeVo.put("status", status);
			if(status.equals(404)){
				return routeVo;
			}
			routeVo.put("account", account);
			routeVo.put("route", route);
			routeVo.put("is400", String.valueOf(is400));
			if(is400){
				routeVo.put("num", num400);
			}
		} catch(Exception e) {
			log.log(Level.WARNING, "update callin route from bill failed", e);
		}
		return routeVo;
	}
	
	public static void removeCallInRoute(String serviceNo) {
		try{
			callInRoutes.remove(serviceNo);
			callInKeys.remove(serviceNo);
			for(Entry<String, String> entry:service400NumRoutes.entrySet()){
				if(serviceNo.equals(entry.getValue())){
					service400NumRoutes.remove(entry.getKey()); 					
				}
			}
			saveInRoute();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public static void loadRoute() {
		try {
			callInRoutes.clear();
			service400NumRoutes.clear();
			callInKeys.clear();
			File file = new File("callInRoute.conf");
			if (file.exists()) {
				BufferedReader br = new BufferedReader(new FileReader(file));
				String line = null;
				while ((line = br.readLine()) != null) {
					if(line.indexOf("=") != -1) {
						String[] a = line.split("=");
						HashMap<String, String> thisRoute = new HashMap<String, String>();
						String[] routeStr = a[1].trim().split(",");
						thisRoute.put("account", routeStr[0].trim());
						thisRoute.put("route", routeStr[1].trim());
						thisRoute.put("is400", routeStr[2].trim());
						if(routeStr.length > 3){
							thisRoute.put("num", routeStr[3].trim());
							service400NumRoutes.put(routeStr[3].trim(), a[0].trim());
						}
						callInRoutes.put(a[0].trim(), thisRoute);
						callInKeys.add(a[0].trim());
					}
				}
				br.close();
			} else {
				file.createNewFile();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public static void saveInRoute() {
		File file = new File("callInRoute.conf");
		if (!file.exists())
			try {
				file.createNewFile();
			} catch (IOException e) {
				log.log(Level.WARNING, "Create callInRoute.conf file failed", e);
				return;
			}
		StringBuffer data = new StringBuffer();
		for(int i=0;i<callInKeys.size();i++) {
			String key = callInKeys.get(i);
			HashMap<String, String> thisRoute = callInRoutes.get(key);
			if(thisRoute != null){
				data.append(key+"=");
				data.append(thisRoute.get("account"));
				data.append(","+thisRoute.get("route"));
				data.append(","+thisRoute.get("is400"));
				if(thisRoute.get("is400").equals("true")){
					data.append(","+thisRoute.get("num"));
				}
				data.append("\r\n");
			}
		}
		try {
			Writer fw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(file), "UTF-8"));
			fw.write(data.toString());
			fw.flush();
			fw.close();
		} catch (IOException e) {
			log.log(Level.WARNING, "Write queues.conf file failed", e);
		}
	}

	public static List<String> getCallInKeys() {
		return callInKeys;
	}

	public static void setCallInKeys(List<String> callInKeys) {
		CallRoute.callInKeys = callInKeys;
	}

	public static Map<String, HashMap<String, String>> getCallInRoutes() {
		return callInRoutes;
	}

	public static void setCallInRoutes(
			Map<String, HashMap<String, String>> callInRoutes) {
		CallRoute.callInRoutes = callInRoutes;
	}
}
