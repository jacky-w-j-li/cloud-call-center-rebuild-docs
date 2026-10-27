package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.DialextenNode;
import com.m7.cc.ass.model.configuration.Music;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class DialextenNodeHandler {

	private static Logger log = Logger.getLogger(DialextenNodeHandler.class.getName());

	public static C5Response addDialextenNode(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			boolean update = action.getBoolValue(Fields.Update);
			String exten = action.getStringValue(Fields.Exten);
			Vector<DialextenNode> dialextenNodes = new Vector<DialextenNode>();
			DialextenNode dialextenNode = new DialextenNode(pbx, accountID, exten);
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
				dialextenNode.setMusic(music);
			}
//			int retryTime = action.getIntValue(Fields.RetryTime);
			dialextenNode.setExtenLen(action.getIntValue(Fields.ExtenLen));
			dialextenNode.setTimeout(action.getIntValue(Fields.Timeout));
			dialextenNode.setToPeerWhenTimeout(action.getStringValue(Fields.ToPeerWhenTimeout));
			
			dialextenNodes.add(dialextenNode);
			if (update)
				RuntimeData.getInstance().updateDialextenNodes(pbx, accountID, dialextenNodes);
			else
				RuntimeData.getInstance().addDialextenNodes(pbx, accountID, dialextenNodes);
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
		}
		return response;
	}
}
