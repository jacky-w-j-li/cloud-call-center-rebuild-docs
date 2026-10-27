package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.Music;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class ServiceNoHandler {
	private static Logger log = Logger.getLogger(ServiceNoHandler.class
			.getName());

	public static C5Response addServiceNo(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			ServiceNo sn = RuntimeData.getInstance().getServiceNo(pbx, exten);
			if(sn == null 
					|| !account.equals(sn.getAccount())) // Aman zhai. 2010.06.18
				sn = new ServiceNo(pbx, account, exten);
			

			if (action.hasKey(Fields.DisplayName)) {
				String displayName = action.getStringValue(Fields.DisplayName);
				if (displayName != null
						&& !displayName.trim().equalsIgnoreCase("")) {
					sn.setDisplayName(displayName);
				} else {
					sn.setDisplayName(null);
				}
			} else {
				sn.setDisplayName(null);
			}
			
			if(action.hasKey(Fields.ToPeer))
				sn.setToPeer(action.getStringValue(Fields.ToPeer));
			if (action.hasKey(Fields.Type))
				sn.setType(action.getStringValue(Fields.Type));
			if (action.hasKey(Fields.Filename)) {
				String file = ASConfig.getInstance().getConfigPath()
						+ "/" + pbx + "/accounts/"
						+ account + "/" + ASConfig.AudioDirectory
						+ "/" + action.getStringValue(Fields.Filename);
				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + dir.getName()
							+ "] dose not exist.");
					return response;
				}
				Music welcomeMusic = new Music(pbx, account, file);
				welcomeMusic.setPlayback(true);
				sn.setWelcomeMusic(welcomeMusic);
			}
//			if (action.getBoolValue(Fields.Update))
			RuntimeData.getInstance().updateServiceNo(pbx, account, sn);
//			else
//				RuntimeData.getInstance().addServiceNo(pbx, account, sn);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
