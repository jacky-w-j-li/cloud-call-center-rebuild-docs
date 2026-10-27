package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Music;
import com.m7.cc.ass.model.configuration.Satisfaction;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class SatisfactionHandler {

	private static Logger log = Logger.getLogger(SatisfactionHandler.class
			.getName());

	public static C5Response addSatisfaction(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String data = null;
			String Welfilename = null;
			String Invalidfilename = null;
			String Timeoutfilename = null;
			String Byefilename = null;
			String Endfilename = null;
			
			if(action.hasKey(Fields.Welfilename)){
				Welfilename = action.getStringValue(Fields.Welfilename);
			}
			if(action.hasKey(Fields.Invalidfilename)){
				Invalidfilename = action.getStringValue(Fields.Invalidfilename);
			}
			if(action.hasKey(Fields.Timeoutfilename)){
				Timeoutfilename = action.getStringValue(Fields.Timeoutfilename);
			}
			if(action.hasKey(Fields.Byefilename)){
				Byefilename = action.getStringValue(Fields.Byefilename);
			}
			if(action.hasKey(Fields.Endfilename)){
				Endfilename = action.getStringValue(Fields.Endfilename);
			}
			//boolean update = action.getBoolValue(Fields.Update);
			
			Vector<Satisfaction> ants = new Vector<Satisfaction>();
			Satisfaction ant = new Satisfaction(pbx, accountID, action
					.getStringValue(Fields.Exten));
			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					ant.setDisplayName(displayName);
				}
			}
			if (action.getParameters().containsKey(Fields.NextPeer)){
				String toPeer = action.getStringValue(Fields.NextPeer);
				if(toPeer != null)
					ant.setToPeer(toPeer);
			}
			if(action.hasKey(Fields.Data)){
				data = action.getStringValue(Fields.Data);
				if(data != null)
					ant.setData(data);
			}
			
			if ( Welfilename != null) {
				String file = ASConfig.getInstance().getConfigPath()
				+ "/" + pbx + "/accounts/"
				+ accountID + "/" + ASConfig.AudioDirectory
				+ "/" + Welfilename;
				
				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + dir.getName()
							+ "] dose not exist.");
					return response;
				}
				Music anMusic = new Music(pbx, accountID, file);
				anMusic.setPlayback(true);
				ant.setWelmusic(anMusic);
			}
			if ( Invalidfilename != null) {
				String file = ASConfig.getInstance().getConfigPath()
				+ "/" + pbx + "/accounts/"
				+ accountID + "/" + ASConfig.AudioDirectory
				+ "/" + Invalidfilename;
				
				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + dir.getName()
							+ "] dose not exist.");
					return response;
				}
				Music anMusic = new Music(pbx, accountID, file);
				anMusic.setPlayback(true);
				ant.setInvalidmusic(anMusic);
			}
			if ( Timeoutfilename != null) {
				String file = ASConfig.getInstance().getConfigPath()
				+ "/" + pbx + "/accounts/"
				+ accountID + "/" + ASConfig.AudioDirectory
				+ "/" + Timeoutfilename;
				
				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + dir.getName()
							+ "] dose not exist.");
					return response;
				}
				Music anMusic = new Music(pbx, accountID, file);
				anMusic.setPlayback(true);
				ant.setTimeoutmusic(anMusic);
			}
			if ( Byefilename != null) {
				String file = ASConfig.getInstance().getConfigPath()
				+ "/" + pbx + "/accounts/"
				+ accountID + "/" + ASConfig.AudioDirectory
				+ "/" + Byefilename;
				
				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + dir.getName()
							+ "] dose not exist.");
					return response;
				}
				Music anMusic = new Music(pbx, accountID, file);
				anMusic.setPlayback(true);
				ant.setByemusic(anMusic);
			}
			if ( Endfilename != null) {
				String file = ASConfig.getInstance().getConfigPath()
				+ "/" + pbx + "/accounts/"
				+ accountID + "/" + ASConfig.AudioDirectory
				+ "/" + Endfilename;
				
				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + dir.getName()
							+ "] dose not exist.");
					return response;
				}
				Music anMusic = new Music(pbx, accountID, file);
				anMusic.setPlayback(true);
				ant.setEndmusic(anMusic);
			}
			
			
			ants.add(ant);
			//if (update)
			RuntimeData.getInstance().updateSatisfaction(pbx, accountID, ants);
//			else
//				RuntimeData.getInstance().addSatisfaction(pbx, accountID, ants);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}

}
