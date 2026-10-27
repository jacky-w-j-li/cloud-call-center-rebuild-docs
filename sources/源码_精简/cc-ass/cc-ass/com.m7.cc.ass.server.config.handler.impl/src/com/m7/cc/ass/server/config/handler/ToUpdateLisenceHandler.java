package com.m7.cc.ass.server.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5LisenceHandler;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;

public class ToUpdateLisenceHandler {
	private static Logger log = Logger.getLogger(ToUpdateLisenceHandler.class
			.getName());

	public static void toUpdate(C5Action action) {
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);

			C5Account account = RuntimeData.getInstance().getAccount(pbx,
					accountID);
			
			if (C5LisenceHandler.updateLisence(account) == null) {
				log.warning("To update lisence failure for account:"
						+ accountID);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "System error when update lisence.", e);
		}
	}
	
	public static void toUpdate400(C5Action action) {
		try {
			String accountID = action.getStringValue(Fields.Account);

			if (!C5LisenceHandler.update400License(accountID)) {
				log.warning("To update 400 lisence failure for account:"
						+ accountID);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "System error when update 400 lisence.", e);
		}
	}
}
