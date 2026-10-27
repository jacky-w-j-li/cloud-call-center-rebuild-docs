package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Announcement;
import com.m7.cc.ass.model.configuration.Music;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class AnnouncementHandler {

	private static Logger log = Logger.getLogger(AnnouncementHandler.class
			.getName());

	public static C5Response addAnnouncement(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			String isstop = "false";
			if(action.hasKey(Fields.NotBreak)){
				isstop = action.getParameterValue(Fields.NotBreak).toString();
			}
			String filename = null;
			if(action.hasKey(Fields.Filename))
				filename = action.getStringValue(Fields.Filename);
//			boolean update = action.getBoolValue(Fields.Update);
			Vector<Announcement> ants = new Vector<Announcement>();
			Announcement ant = RuntimeData.getInstance().getAccount(pbx, accountID).getAnnouncements().get(exten);
			if(ant == null){
				ant = new Announcement(pbx, accountID, action
					.getStringValue(Fields.Exten));
			}
			if ( filename != null) {
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
				Music welcomeMusic = new Music(pbx, accountID, file);
				if(Boolean.valueOf(isstop)){
					welcomeMusic.setPlayback(true);
				}else{
					welcomeMusic.setPlayback(false);
				}
				ant.setMusic(welcomeMusic);
			} else {
				ant.setMusic(null);
			}
			

			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					ant.setDisplayName(displayName);
				}
			}
			
			if (action.getParameters().containsKey(Fields.ToPeer)){
				String toPeer = action.getStringValue(Fields.ToPeer);
				if(toPeer != null)
					ant.setToPeer(toPeer);
			}
			ant.setNotbreak(isstop);
			ants.add(ant);
			RuntimeData.getInstance().updateAnnouncement(pbx, accountID, ants);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}
}
