package com.m7.cc.ass.server.config.handler;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.BlackList;
import com.m7.cc.ass.model.configuration.RedList;
import com.m7.cc.asterisk.ami.action.Redirect;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class RedListHandler {

	private static final Logger log = Logger.getLogger(RedListHandler.class
			.getName());

	public static C5Response addRedList(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			String myList = action.getStringValue(Fields.List);
			
			RedList rl = RuntimeData.getInstance().getAccount(pbx, accountID).getRedList();
			if (rl == null)
				rl = new RedList(pbx, accountID, "RedList");
			if(myList != null){
				StringBuffer endList = new StringBuffer();
				String[] rls = myList.split(",");
				String newNum, otherNum;
				for (int i = 0; i < rls.length; i++) {
					if(rls[i].trim().equalsIgnoreCase(""))
						continue;
					newNum = rls[i];
					endList.append(newNum+",");
					otherNum = ASConfig.getInstance()
							.getOtherNum(newNum).trim();
					if (!"".equals(otherNum)) {
						endList.append(otherNum+",");
					}
				}
				myList = endList.toString();
				if(myList != null && !myList.equals("")){
					if(myList.substring(myList.length()-1).equals(",")){
						myList = myList.substring(0, myList.length()-1);
					}					
				}
			}else{
				myList = "";
			}
			rl.setList(myList);
			RuntimeData.getInstance().updateRedlist(pbx, accountID, rl);

			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}
}
