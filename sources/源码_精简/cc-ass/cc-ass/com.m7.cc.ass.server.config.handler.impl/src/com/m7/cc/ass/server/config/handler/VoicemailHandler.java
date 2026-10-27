package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Music;
import com.m7.cc.ass.model.configuration.Voicemail;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class VoicemailHandler {
	
	private static Logger log = Logger.getLogger(VoicemailHandler.class.getName());
	
	public static C5Response addVoicemail(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			C5Account account = RuntimeData.getInstance().getAccount(pbx, accountID);
			Voicemail voicemail = account.getVms().get(exten);
			if(voicemail == null)
				voicemail = new Voicemail(pbx, accountID, exten);
			voicemail.setValues(action.getParameters());
			if (voicemail.getWelcomeMusic() != null) {
				String file = ASConfig.getInstance()
						.getConfigPath()
						+ "/"
						+ pbx
						+ "/accounts/"
						+ account.getAccount()
						+ "/"
						+ ASConfig.AudioDirectory
						+ "/"
						+ voicemail.getWelcomeMusic().getMusicFile();
				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + file
							+ "] dose not exist.");
					return response;
				}
				Music music = new Music(pbx, accountID, file);
				music.setPlayback(true);
				voicemail.setWelcomeMusic(music);
			}
			

			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					voicemail.setDisplayName(displayName);
				}
			}
			
			account.addVoicemail(voicemail);
			response.setSucceed(true);
		} catch (Exception e){
			log.log(Level.WARNING, e.getMessage(), e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
