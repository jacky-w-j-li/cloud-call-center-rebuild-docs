package com.m7.cc.ass.server.config.handler;

import java.io.File;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.SwitchBoard;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class SwitchBoardHandler {
	public static Logger log = Logger.getLogger(SwitchBoardHandler.class.getName());

	public static C5Response addUser(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			SwitchBoard switchBoard = RuntimeData.getInstance().getAccount(pbx, accountID).getSwitchBoards().get(exten);
			if(switchBoard == null){
				switchBoard = new SwitchBoard(pbx, accountID, exten);
			}
			if (action.hasKey(Fields.Filename)) {
				String file = ASConfig.getInstance().getConfigPath()
						+ "/" + pbx + "/accounts/"
						+ accountID + "/" + ASConfig.AudioDirectory
						+ "/" + action.getStringValue(Fields.Filename);
				File dir = new File(file);
				if (!dir.exists()) {
					response.setSucceed(false);
					response.setMessage("File [" + dir.getName()
							+ "] dose not exist.");
					return response;
				}
				action.getParameters().put(Fields.Filename, file);
			}
			
			switchBoard.setValues(action.getParameters());
			
			RuntimeData.getInstance().updateSwitchBoard(pbx, accountID, switchBoard);
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}
}
