package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Music;
import com.m7.cc.ass.model.configuration.SuperDialJobNum;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class SuperDialJobNumHandler {

	private static Logger log = Logger.getLogger(SuperDialJobNumHandler.class
			.getName());

	public static C5Response addSuperDialJobNum(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String data = null;
			String Filename = null;
			
			if(action.hasKey(Fields.Filename)){
				Filename = action.getStringValue(Fields.Filename);
			}
			
			Vector<SuperDialJobNum> ants = new Vector<SuperDialJobNum>();
			SuperDialJobNum ant = new SuperDialJobNum(pbx, accountID, action
					.getStringValue(Fields.Exten));
			
			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					ant.setDisplayName(displayName);
				}
			}
			ant.setToPeerNotExist(action.getStringValue(Fields.ToPeer));
			ant.setToPeerAgentBusy(action.getStringValue(Fields.AgentBusyToPeer));
			ant.setToPeerLogoff(action.getStringValue(Fields.LogoffToPeer));
			ant.setToPeerFrontOffice(action.getStringValue(Fields.FrontOfficeToPeer));

			if ( Filename != null) {
				String file = ASConfig.getInstance().getConfigPath()
				+ "/" + pbx + "/accounts/"
				+ accountID + "/" + ASConfig.AudioDirectory
				+ "/" + Filename;
				
				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + dir.getName()
							+ "] dose not exist.");
					return response;
				}
				Music anMusic = new Music(pbx, accountID, file);
				anMusic.setPlayback(true);
				ant.setMusic(anMusic);
			}
			
			ants.add(ant);
			RuntimeData.getInstance().updateSuperDialJobNum(pbx, accountID, ants);

			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}

}
