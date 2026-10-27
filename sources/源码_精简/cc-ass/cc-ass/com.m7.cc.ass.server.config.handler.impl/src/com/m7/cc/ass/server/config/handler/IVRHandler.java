package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.IVR;
import com.m7.cc.ass.model.configuration.IVRKey;
import com.m7.cc.ass.model.configuration.Music;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class IVRHandler {

	private static Logger log = Logger.getLogger(IVRHandler.class.getName());

	public static C5Response addIvr(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
//			boolean update = action.getBoolValue(Fields.Update);
			String exten = action.getStringValue(Fields.Exten);
//			String dialextenNode = action.getStringValue(Fields.DialextenNode); // Aman zhai. 2010.06.08
			Vector<IVR> ivrs = new Vector<IVR>();
			IVR ivr = RuntimeData.getInstance().getAccount(pbx, accountID).getIvrs().get(exten);
			if(ivr == null)
				ivr = new IVR(pbx, accountID, exten);
			else
				ivr.getIvrKeys().clear();
			if (action.hasKey(Fields.Filename)) {
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
				music.setPlayback(false);
				ivr.setMusic(music);
			} else {
				ivr.setMusic(null);
			}
			int retryTime = action.getIntValue(Fields.RetryTime);
			ivr.setRetry_time(retryTime);
			ivr.setTimeout(action.getIntValue(Fields.Timeout));
			
			if (action.hasKey(Fields.IvrKey)) {
				String ivrKeys = action.getStringValue(Fields.IvrKey);
				String[] keys = ivrKeys.split(",");
				for (int i = 0; i < keys.length; i++) {
					String[] key = keys[i].split("@");
					IVRKey ivrKey = new IVRKey(key[0].trim());
					String toPeer = key[1].trim();
					if(toPeer.equalsIgnoreCase("null"))
						ivrKey.setToPeer(null);
					else ivrKey.setToPeer(toPeer);
					ivr.addIvrKey(ivrKey);
				}
			}
			
			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					ivr.setDisplayName(displayName);
				}
			}
			
			
			ivrs.add(ivr);
//			if (update)
			RuntimeData.getInstance().updateIVR(pbx, accountID, ivrs);
//			else
//				RuntimeData.getInstance().addIVR(pbx, accountID, ivrs);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
