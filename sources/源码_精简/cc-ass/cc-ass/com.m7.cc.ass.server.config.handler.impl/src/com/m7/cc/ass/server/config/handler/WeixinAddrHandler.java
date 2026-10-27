package com.m7.cc.ass.server.config.handler;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.WeixinAddr;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class WeixinAddrHandler {
	private static Logger log = Logger.getLogger(WeixinAddrHandler.class
			.getName());

	public static C5Response addWeixinAddr(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			if (action.hasKey(Fields.OldWeixinAddr)) {
				String oldWeixinAddr = action.getStringValue(Fields.OldWeixinAddr);
				if(!oldWeixinAddr.equals(exten)){
					//to delete old
					Vector<String> delWeixinAddrs = new Vector<String>();
					delWeixinAddrs.add(oldWeixinAddr);
					RuntimeData.getInstance().removeWeixinAddr(pbx, account, delWeixinAddrs);
				}
			}
			
			WeixinAddr wa = RuntimeData.getInstance().getWeixinAddr(pbx, exten);
			if(wa == null 
					|| !account.equals(wa.getAccount()))
				wa = new WeixinAddr(pbx, account, exten);
			
			if (action.hasKey(Fields.DisplayName)) {
				String displayName = action.getStringValue(Fields.DisplayName);
				if (displayName != null
						&& !displayName.trim().equalsIgnoreCase("")) {
					wa.setDisplayName(displayName);
				} else {
					wa.setDisplayName(null);
				}
			} else {
				wa.setDisplayName(null);
			}
			
			if(action.hasKey(Fields.ToPeer))
				wa.setToPeer(action.getStringValue(Fields.ToPeer));
			RuntimeData.getInstance().updateWeixinAddr(pbx, account, wa);
			
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
