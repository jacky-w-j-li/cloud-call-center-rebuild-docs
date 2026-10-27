package com.m7.cc.agi.handler.impl.handlers;

import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.CallUrl;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

public class CallUrlHandler {

	public static Logger log = IceLogger.getLogger(ASConfig.getInstance()
			.getLogDir(), "callUrl", "FINE", false);

	public static void hadle(C5Action action) {
		try {
			AgiSession session = (AgiSession) action.getParameters().remove(
					Fields.Session);
			try {
				String agi_network_script = action
						.getStringValue(Fields.agi_network_script);
				String[] a = agi_network_script.substring(
						agi_network_script.indexOf('?') + 1).split("&");
				String pbx = a[0].split("=")[1];
				String servicePeerExten = a[1].split("=")[1];
				int pramsL = a.length;
				Map<String,String> otherParams = new HashMap<String,String>();
				if(pramsL > 2){
					for(int i=2;i<pramsL;i++){
						String[] param = a[i].split("=");
						otherParams.put(param[0], param[1]);
 					}
				}
				String channelName = action.getStringValue(Fields.agi_channel);
				C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
						.getChannel(channelName);
				if (channel == null) {
					log.warning("Channel [" + channelName + "] not found");
					action.getParameters().clear();
					session.close();
					return;
				}

				C5Account account = RuntimeData.getInstance().getAccount(pbx,
						channel.getAccount());
				if (account == null) {
					log.warning("Account [" + channel.getAccount()
							+ "] not found");
					action.getParameters().clear();
					session.close();
					return;
				}

				CallUrl callUrl = account.getCallUrls().get(servicePeerExten);
				if (callUrl == null) {
					log.warning("CallUrl [" + servicePeerExten + "] not found");
					action.getParameters().clear();
					session.close();
					return;
				}

				action.getParameters().clear();
				if (callUrl.getMusic() != null) {
					session.send("STREAM FILE \""
							+ callUrl.getMusic().getMusicFileWithNoExtension()
							+ "\" \"*\"");
				}

				try {
					String url = callUrl.getUrl();
					boolean isJson = false;
					if(url.endsWith("[json]")){
						isJson = true;
						url = url.substring(0, url.length()-6);
					}
					if(url.endsWith("[rest]")){
						url = url.substring(0, url.length()-6);
						Vector<String> keys = getRestKeys(url);
						url = getRestRealUrl(url);
						for(int i=0;i<keys.size();i++) {
							String key = keys.get(i);
							String _var = channel.getVar(key);
							if (_var != null) {
								url += "/" + _var;
							} else if(otherParams.get(key) != null){
								url += "/" + otherParams.get(key);
							} else {
								url += "/" + key;
							}
						}
					}else{
						Map<String, String> params = Utils
								.getParametersFromUrl(url);
						Vector<String> keys = getKeys(url);
						if (url.indexOf('?') != -1)
							url = url.substring(0, url.indexOf("?") + 1);
						String p = "";
						for(int i=0;i<keys.size();i++) {
							String key = keys.get(i);
							String var = params.get(key);
							String _var = channel.getVar(var);
							log.info("otherParams: " + key+":::"+otherParams.get(var));
							if (_var != null) {
								p += key + "=" + _var + "&";
							} else if(otherParams.get(var) != null){
								p += key + "=" + otherParams.get(var) + "&";
							} else {
								p += key + "=" + var + "&";
							}
						}
						if (p.endsWith("&")) {
							p = p.substring(0, p.length() - 1);
						}
						String key = callUrl.getMd5Key();
						if (key != null && !key.equals("")) {
							if (key.startsWith("__")) {
								key = channel.getVar(key.substring(2));
							}
							if (key != null && !key.equals("")) {
								MessageDigest md = MessageDigest.getInstance("MD5");

								String key1 = p + key;
								if (account.getAccount().equals("B000000006069")
										|| account.getAccount().equals(
												"Q000000003893")) {
									key1 = key;
								}
								md.update((key1).getBytes("UTF-8"));
								log.info("To md5: " + key1);
								// md.update(p.getBytes("UTF-8"));
								byte[] paramDigest = md.digest();
								p = p + "&MD5="
										+ Utils.byteArrayToHexString(paramDigest);
							}
						}
						if (p.startsWith("&"))
							p = p.substring(0, p.length());
						url += p;
					}
					log.info("Call url from AGI: " + url);
					String result = HttpProvider.sendGet(url, callUrl
							.getTimeout() * 1000);
					log.info("Get return [" + result + "] from url [" + url
							+ "]");
					if (result.equalsIgnoreCase("")) {
						session.send("set variable callurltimeout \"1\"");
					}
					if(isJson){
						JSONReader jr = new JSONReader();
						HashMap<String, String> endMap = (HashMap<String, String>)jr.read(result);
						Iterator<String> keys = endMap.keySet().iterator();
						while(keys.hasNext()) {
							String key = (String) keys.next();
							if(endMap.get(key) instanceof String){
								String value = (String) endMap.get(key); 
								session.send("set variable " + key + " " + value);
								if (key.startsWith("__")) {
									channel.addC5Var(key, value);
								}
								channel.addVar(key, value);	
							}
						}
					}else{
						String value = result.replaceAll(" ", "");
						if (value != null && value.endsWith(".wav")) {
							value = value.substring(0, value.lastIndexOf("."));
							session.send("set variable thirdSoundName "
									+ value);
						}
						if(callUrl.getVar() != null && !callUrl.getVar().equals("")){
							session.send("set variable " + callUrl.getVar() + " "
									+ value);
						}
						if (callUrl.getVar().startsWith("__")) {
							channel.addC5Var(callUrl.getVar(), value);
						}
						channel.addVar(callUrl.getVar(), value);	
					}
				} catch (Exception e) {
					log.log(Level.WARNING, "Call url failed: "
							+ callUrl.getUrl(), e);
					session.send("set variable callurltimeout \"1\"");
				}
				action.getParameters().clear();
				session.close();
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
				action.getParameters().clear();
				session.close();
				return;
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
		}
	}
	
	private static Vector<String> getKeys(String url) {
		Vector<String> params = new Vector<String>();
		int start = url.indexOf('?');
		if (start == -1)
			return params;
		String paramString = url.substring(start + 1);
		if (paramString.trim().equals("") || paramString.indexOf('=') == -1)
			return params;
		if (paramString.indexOf('&') != -1) {
			String[] paramArray = paramString.split("&");
			for (int i = 0; i < paramArray.length; i++) {
				String param = paramArray[i];
				if (param.indexOf('=') != -1) {
					String[] a = param.split("=");
					params.add(a[0]);
				}
			}
		} else {
			String param = paramString;
			if (param.indexOf('=') != -1) {
				String[] a = param.split("=");
				params.add(a[0]);
			}
		}
		return params;
	}
	
	private static Vector<String> getRestKeys(String url) {
		Vector<String> params = new Vector<String>();
		String realUrl = url.substring(7);
		String[] arry = realUrl.split("/");
		
		if(arry.length > 0){
			for(int i=1;i<arry.length;i++){
				params.add(arry[i]);
			}
			return params;
		}else{
			return params;
		}
	}
	
	private static String getRestRealUrl(String url) {
		String realStr = url;
		String realUrl = url.substring(7);
		String[] arry = realUrl.split("/");
		if(arry.length > 0){
			realStr = "http://" + arry[0];
		}
		return realStr;
	}
	
	public static void main(String[] args) {
		String abc = "abcde3rerer111[rest]";
		System.out.println(abc.substring(0,abc.length()-6));
//		System.out.println(CallUrlHandler.getRestRealUrl("http://127.0.0.1:4000/didi/phone/didiPbxGetBind/456789/01056332211"));
//		System.out.println(CallUrlHandler.getRestKeys("http://127.0.0.1:4000/didi/phone/didiPbxGetBind/456789/01056332211").toString());
	}
}
