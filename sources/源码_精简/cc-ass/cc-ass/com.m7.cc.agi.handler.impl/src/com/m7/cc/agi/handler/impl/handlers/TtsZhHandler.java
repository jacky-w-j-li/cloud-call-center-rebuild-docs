package com.m7.cc.agi.handler.impl.handlers;

import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.TextAnnouncement;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class TtsZhHandler {
	public static Logger log = Logger.getLogger(TtsZhHandler.class.getName());
	
	public static void handle(C5Action action){
		try {
			AgiSession session = (AgiSession) action.getParameters().remove(Fields.Session);
			try{
				String agi_network_script = action.getStringValue(Fields.agi_network_script);
				String[] a = agi_network_script.substring(agi_network_script.indexOf('?')+1).split("&");
				String pbx = a[0].split("=")[1];
				String servicePeerExten = a[1].split("=")[1];
				String channelName = action.getStringValue(Fields.agi_channel);
				C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx).getChannel(channelName);
				if(channel == null) {
					log.warning("Channel ["+channelName+"] not found");
					action.getParameters().clear();
					session.close();
					return;
				}
				
				C5Account account = RuntimeData.getInstance().getAccount(pbx, channel.getAccount());
				if (account == null) {
					log.warning("Account [" + channel.getAccount()+ "] not found");
					action.getParameters().clear();
					session.close();
					return;
				}
				//We should get Tss peer from runtime data to know the text to say and interval 
				//between words.
				TextAnnouncement textAnnouncement = account.getTextAnnouncements().get(servicePeerExten);
				if (textAnnouncement == null) {
					log.warning("TextAnnouncement [" + servicePeerExten+ "] not found");
					action.getParameters().clear();
					session.close();
					return;
				}
				
				String text = textAnnouncement.getAnnouncementText();
				
				if(text != null && !text.equals("")){
					//tts engine is kdxf
					if(textAnnouncement.getEngine()!=null 
							&& textAnnouncement.getEngine().equals(TextAnnouncement.ENGINE_KDXF)){
						if(account.getWebcallTtsGenerateMap().get(channel.getFromCid()) != null){
							String webcallFileName = account.getWebcallTtsGenerateMap().get(channel.getFromCid());
							if(webcallFileName != null && !webcallFileName.equals("")){
								session.send("SET VARIABLE TTSENGINE \"1\"");
								session.send("SET VARIABLE FILENAME \"sound/kdxf/"+ webcallFileName.substring(0, webcallFileName.length()-4) + "\"");
								account.getWebcallTtsGenerateMap().remove(channel.getFromCid());
							}
						}else{
							if(textAnnouncement.getReplaceVar()!= null && !textAnnouncement.getReplaceVar().equals("")){
								String replaceVar = textAnnouncement.getReplaceVar();
								if(replaceVar.indexOf(",") != -1){
									String[] varArr = replaceVar.split(",");
									for(int i=0;i<varArr.length;i++){
										if(channel.getVar(varArr[i]) != null)
											text = text.replaceAll(varArr[i], channel.getVar(varArr[i]));
									}
								}else{
									if(channel.getVar(replaceVar) != null)
										text = text.replaceAll(replaceVar, channel.getVar(replaceVar));
								}
							}
							String url = "http://127.0.0.1:9999";
							String data = "Action=generateWav&text="+text+"&voiceName="+textAnnouncement.getVoiceName()
									+"&speed="+textAnnouncement.getSpeed()+"&pitch="+textAnnouncement.getPitch()+"&volume="+textAnnouncement.getVolume();
							log.log(Level.WARNING, "send kdxfServer request = " + data);
							String result = HttpProvider.sendPost(url, data.getBytes("UTF-8"), 35000);
							log.log(Level.WARNING, "get kdxfServer result = " + result);
							HashMap<String,Object> resMap = null;
							if(result != null){
								System.out.println(result);
								JSONReader jr = new JSONReader();
								resMap = (HashMap<String,Object>)jr.read(result);
							}
							if(resMap != null && Boolean.valueOf(resMap.get("Succeed").toString())){
								String fileName = resMap.get("WavName").toString();
								session.send("SET VARIABLE TTSENGINE \"1\"");
								session.send("SET VARIABLE FILENAME \"sound/kdxf/"+ fileName.substring(0, fileName.length()-4) + "\"");
							}else{
								//if kdxf diao yong shi bai ,we use default.
								//If it is node type of say money, text will be converted to money format.
								if(textAnnouncement.getIsMoney().equals("1")){
									text = SayDigitHandler.convertNumberFormat(text);
								}
								int wordInterval = Integer.valueOf(textAnnouncement.getWordInterval());
								int signInterval = Integer.valueOf(textAnnouncement.getSignInterval());
								tts(text, session, wordInterval, signInterval);
							}	
						}
					}else{
						if(text.startsWith("__")){
							text = channel.getVar(text.substring(2));
						}
						//default engine
						if(text != null && !text.equals("")){
							//If it is node type of say money, text will be converted to money format.
							if(textAnnouncement.getIsMoney().equals("1")){
								text = SayDigitHandler.convertNumberFormat(text);
							}
							int wordInterval = Integer.valueOf(textAnnouncement.getWordInterval());
							int signInterval = Integer.valueOf(textAnnouncement.getSignInterval());
							tts(text, session, wordInterval, signInterval);
						}
					}
				}
				action.getParameters().clear();
				session.close();
			} catch (Exception e){
				log.log(Level.WARNING, "", e);
				action.getParameters().clear();
				session.close();
				return;
			}
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
		}
	}
	
	public static void tts(String text, AgiSession session) throws Exception{
		tts(text, session, 150, 500);
	}
	
	public static void tts(String text, AgiSession session, int wordInterval, int signInterval) throws Exception{
		char[] chars = text.toCharArray();
		String sendResult;
		Pattern p = Pattern.compile(".*result=\\d.*\\n");
		Matcher m = null;
		for (int i = 0; i < chars.length; i++) {
			String key = Utils.char2Unicode(chars[i]);
			String value = ASConfig.getInstance().getTTSZhList().get(key);
			if (value != null) {
				String file = "GET DATA \"/var/lib/asterisk/sounds/"
						+ "sound/pinyin/" + value + "\" 1 1";
				sendResult = session.send(file);
				m = p.matcher(sendResult);
				if (m.matches())
					break;
				Thread.sleep(wordInterval);
			} else {
				Thread.sleep(signInterval);
			}
		}
	}
}
