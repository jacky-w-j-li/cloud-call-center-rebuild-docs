package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Music;
import com.m7.cc.ass.model.configuration.TwowayCall;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class TwowayCallHandler {
	
	private static Logger log = Logger.getLogger(TwowayCallHandler.class.getName());
	
	public static C5Response add(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			
			C5Account account = RuntimeData.getInstance().getAccount(pbx, accountID);
			
			TwowayCall twowayCall = account.getTwowayCalls().get(exten);
			if(twowayCall == null) {
				twowayCall = new TwowayCall(pbx, accountID, exten);
			}
			if(action.hasKey(Fields.DisplayName))
				twowayCall.setDisplayName(action.getStringValue(Fields.DisplayName));
			if(action.hasKey(Fields.Variable))
				twowayCall.setVariable(action.getStringValue(Fields.Variable));

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
				twowayCall.setMusic(music);
			} else {
				twowayCall.setMusic(null);
			}

//			if(action.hasKey(Fields.NextPeer))
//				twowayCall.setNextPeer(action.getStringValue(Fields.NextPeer));
//			else twowayCall.setNextPeer(null);
			
			account.addTwowayCall(twowayCall);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
