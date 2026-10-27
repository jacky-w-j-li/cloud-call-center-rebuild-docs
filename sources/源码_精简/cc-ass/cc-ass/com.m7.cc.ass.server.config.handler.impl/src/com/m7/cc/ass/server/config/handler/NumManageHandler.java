package com.m7.cc.ass.server.config.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class NumManageHandler {
	private static final Logger log = Logger.getLogger(NumManageHandler.class
			.getName());

	public static C5Response addNum(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			//boolean update = action.getBoolValue(Fields.Update);
			String num = action.getStringValue(Fields.Num);
			String oldNum = action.getStringValue(Fields.oldNum);
			String type = action.getStringValue(Fields.Type);
			 
			RuntimeData.getInstance().updateNum(pbx, accountID, type, num, oldNum);

			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}
	
	public static C5Response batchaddNum(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
			//boolean update = action.getBoolValue(Fields.Update);
			String num = action.getStringValue(Fields.Num);
			String oldNum = action.getStringValue(Fields.oldNum);
			String type = action.getStringValue(Fields.Type);
			String[] nums = num.split(",");
			 for (int i = 0; i < nums.length; i++) {
				 RuntimeData.getInstance().updateNum(pbx, accountID, type, nums[i], oldNum);
			}
			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}
	
}
