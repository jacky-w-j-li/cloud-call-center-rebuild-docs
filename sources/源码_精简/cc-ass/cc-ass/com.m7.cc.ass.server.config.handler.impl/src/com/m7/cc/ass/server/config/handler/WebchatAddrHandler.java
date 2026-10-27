package com.m7.cc.ass.server.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.WebchatAddr;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class WebchatAddrHandler {
	private static Logger log = Logger.getLogger(WebchatAddrHandler.class
			.getName());

	public static C5Response addWebchatAddr(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
//			if (action.hasKey(Fields.OldWeixinAddr)) {
//				String oldWeixinAddr = action.getStringValue(Fields.OldWeixinAddr);
//				if(!oldWeixinAddr.equals(exten)){
//					//to delete old
//					Vector<String> delWeixinAddrs = new Vector<String>();
//					delWeixinAddrs.add(oldWeixinAddr);
//					RuntimeData.getInstance().removeWeixinAddr(pbx, account, delWeixinAddrs);
//				}
//			}
			
			WebchatAddr wc = RuntimeData.getInstance().getWebchatAddr(pbx, exten);
			if(wc == null 
					|| !account.equals(wc.getAccount()))
				wc = new WebchatAddr(pbx, account, exten);
			
			if (action.hasKey(Fields.DisplayName)) {
				String displayName = action.getStringValue(Fields.DisplayName);
				if (displayName != null
						&& !displayName.trim().equalsIgnoreCase("")) {
					wc.setDisplayName(displayName);
				} else {
					wc.setDisplayName(null);
				}
			} else {
				wc.setDisplayName(null);
			}
			
			if(action.hasKey(Fields.ToPeer))
				wc.setToPeer(action.getStringValue(Fields.ToPeer));
			RuntimeData.getInstance().updateWebchatAddr(pbx, account, wc);
			
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
