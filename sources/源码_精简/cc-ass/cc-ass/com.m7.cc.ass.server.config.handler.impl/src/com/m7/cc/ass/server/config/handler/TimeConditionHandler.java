package com.m7.cc.ass.server.config.handler;

import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.TimeCondition;
import com.m7.cc.ass.model.configuration.TimeConditionItem;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class TimeConditionHandler {
	
	private static Logger log = Logger.getLogger(TimeConditionHandler.class.getName());
	
	public static C5Response addTimeCondition(C5Action action){
		C5Response response = new C5Response(action.getActionName(), action.getActionID());
		try{
			String pbx = action.getStringValue(Fields.PBX);
			String account = action.getStringValue(Fields.Account);
			String exten = action.getStringValue(Fields.Exten);
			String times = action.getStringValue(Fields.Times);
//			boolean update = action.getBoolValue(Fields.Update);
			
			Vector<TimeCondition> tcs = new Vector<TimeCondition>();
			TimeCondition tc = RuntimeData.getInstance().getAccount(pbx, account).getTimeConditions().get(exten);
			if(tc == null)
				tc = new TimeCondition(pbx, account, exten);
			if (!"".equals(times)){
				tc.clearTimeConditionTime();
				String[] a = times.split("@");
				for(int i=0;i<a.length;i++){
					String[] b = a[i].split(",");
					TimeConditionItem item = new TimeConditionItem();
					item.setTimes(b[0]);
					item.setDaysOfWeek(b[1]);
					item.setDaysOfMoth(b[2]);
					item.setMoths(b[3]);
					tc.addTimeConditionItem(item);
				}
			}
			

			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					tc.setDisplayName(displayName);
				}
			}
			
			if(action.hasKey(Fields.MatchedPeer))
				tc.setMatchedPeer(action.getStringValue(Fields.MatchedPeer));
			if(action.hasKey(Fields.UnmatchedPeer))
				tc.setUnmatchedPeer(action.getStringValue(Fields.UnmatchedPeer));
			tcs.add(tc);
//			if(update)
			RuntimeData.getInstance().updateTimeCondition(pbx, account, tcs);
//			else 
//				RuntimeData.getInstance().addTimeCondition(pbx, account, tcs);
			response.setSucceed(true);
		} catch (Exception e){
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}
}
