package com.m7.cc.ass.server.config.handler;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.MailAddr;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class MailAddrHandler {
	private static Logger log = Logger.getLogger(MailAddrHandler.class
			.getName());

	public static C5Response addMailAddr(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			if (action.hasKey(Fields.OldMailAddr)) {
				String oldMailAddr = action.getStringValue(Fields.OldMailAddr);
				if(!oldMailAddr.equals(exten)){
					//to delete
					Vector<String> delMailAddrs = new Vector<String>();
					delMailAddrs.add(oldMailAddr);
					RuntimeData.getInstance().removeMailAddr(pbx, account, delMailAddrs);
				}
			}
			
			MailAddr ma = RuntimeData.getInstance().getMailAddr(pbx, exten);
			if(ma == null 
					|| !account.equals(ma.getAccount()))
				ma = new MailAddr(pbx, account, exten);
			
			if (action.hasKey(Fields.DisplayName)) {
				String displayName = action.getStringValue(Fields.DisplayName);
				if (displayName != null
						&& !displayName.trim().equalsIgnoreCase("")) {
					ma.setDisplayName(displayName);
				} else {
					ma.setDisplayName(null);
				}
			} else {
				ma.setDisplayName(null);
			}
			
			if(action.hasKey(Fields.ToPeer))
				ma.setToPeer(action.getStringValue(Fields.ToPeer));
			RuntimeData.getInstance().updateMailAddr(pbx, account, ma);
			
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
