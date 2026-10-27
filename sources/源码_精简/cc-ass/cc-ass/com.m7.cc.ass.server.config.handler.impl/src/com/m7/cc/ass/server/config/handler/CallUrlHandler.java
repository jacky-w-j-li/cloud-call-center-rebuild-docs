package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.CallUrl;
import com.m7.cc.ass.model.configuration.Music;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class CallUrlHandler {
	
	private static Logger log = Logger.getLogger(CallUrlHandler.class.getName());
	
	public static C5Response add(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			
			C5Account account = RuntimeData.getInstance().getAccount(pbx, accountID);
			
			CallUrl callUrl = account.getCallUrls().get(exten);
			if(callUrl == null) {
				callUrl = new CallUrl(pbx, accountID, exten);
			}
			if(action.hasKey(Fields.Url))
				callUrl.setUrl(action.getStringValue(Fields.Url));
			if(action.hasKey(Fields.DisplayName))
				callUrl.setDisplayName(action.getStringValue(Fields.DisplayName));
			if(action.hasKey(Fields.Variable))
				callUrl.setVar(action.getStringValue(Fields.Variable));
			if(action.hasKey(Fields.MD5)) {
				callUrl.setMd5Key(action.getStringValue(Fields.MD5));
			}
			if(action.hasKey(Fields.Filename) && !action.getStringValue(Fields.Filename).equals("")){
				String filename = action.getStringValue(Fields.Filename);
				String file = ASConfig.getInstance().getConfigPath()
						+ "/" + pbx + "/accounts/"
						+ accountID + "/" + ASConfig.AudioDirectory
						+ "/" + filename;
				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + dir.getName()
							+ "] dose not exist.");
					return response;
				}
				Music music = new Music(pbx, accountID, file);
				music.setPlayback(true);
				callUrl.setMusic(music);
			} else {
				callUrl.setMusic(null);
			}
			if(action.hasKey(Fields.Timeout))
				callUrl.setTimeout(action.getIntValue(Fields.Timeout));
			
			if(action.hasKey(Fields.ToPeerWhenTimeout))
				callUrl.setToPeerWhenTimeout(action.getStringValue(Fields.ToPeerWhenTimeout));
			else callUrl.setToPeerWhenTimeout(null);
			if(action.hasKey(Fields.NextPeer))
				callUrl.setNextPeer(action.getStringValue(Fields.NextPeer));
			else callUrl.setNextPeer(null);
			
			account.addCallUrl(callUrl);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
