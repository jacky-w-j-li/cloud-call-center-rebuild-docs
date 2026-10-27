package com.m7.cc.ass.server.config.handler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.BlackList;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;

public class BlackListHandler {

	private static final Logger log = Logger.getLogger(BlackListHandler.class
			.getName());

	public static C5Response addBlackList(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountID = action.getStringValue(Fields.Account);
//			boolean update = action.getBoolValue(Fields.Update);
			String exten = action.getStringValue(Fields.Exten);
			int style = action.getIntValue(Fields.Style);
			
			
			Vector<BlackList> list = new Vector<BlackList>();
			BlackList bl = RuntimeData.getInstance().getAccount(pbx, accountID).getBlackLists().get(exten);
			if (bl == null)
				bl = new BlackList(pbx, accountID, exten);
			bl.setStyle(style);
			if (bl.getStyle() == BlackList.list) {
				bl.getBlackListNumbers().clear();
				if(action.getParameters().containsKey(Fields.List)){
					String myList = action.getStringValue(Fields.List);
					if(myList != null){
						String[] bls = myList.split(",");
						String newNum, otherNum;
						for (int i = 0; i < bls.length; i++) {
							if(bls[i].trim().equalsIgnoreCase(""))
								continue;
							
							// TODO
							// add 01058103397  +58103397
							// add 58103397   +01058103397
							// add 158xxxxx    +0158xxxx
							// add 0158xxxx     +158
							
							newNum = bls[i];
							bl.addBlackList(newNum.trim());
							otherNum = ASConfig.getInstance()
									.getOtherNum(newNum).trim();
							if (!"".equals(otherNum)) {
								bl.addBlackList(otherNum);
							}
						}
					}
				}
			} else {
				String expression = action.getStringValue(Fields.Expression);
				bl.setExpression(expression);
			}
			if(action.hasKey(Fields.MatchedPeer)){
				String matchedPeer = action.getStringValue(Fields.MatchedPeer);
				if(matchedPeer != null && !matchedPeer.trim().equalsIgnoreCase("")){
					bl.setMatchedPeer(matchedPeer);
				}
			}
			if(action.hasKey(Fields.UnmatchedPeer)){
				String unmatchedPeer = action.getStringValue(Fields.UnmatchedPeer);
				if(unmatchedPeer != null && !unmatchedPeer.trim().equalsIgnoreCase("")){
					bl.setUnmatchedPeer(unmatchedPeer);
				}
			}
			if(action.hasKey(Fields.DisplayName)){
				String displayName = action.getStringValue(Fields.DisplayName);
				if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
					bl.setDisplayName(displayName);
				}
			}
			

			list.add(bl);
//			if (update) {
				RuntimeData.getInstance().updateBlacklist(pbx, accountID, list);
//			} else {
//				RuntimeData.getInstance().addBlacklist(pbx, accountID, list);
//			}

			response.setSucceed(true);
		} catch (Exception e) {
			response.setSucceed(false);
			response.setMessage(e.getMessage());
			log.log(Level.WARNING, "", e);
		}
		return response;
	}
	
	public static C5Response batchAddBlackList(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try {
			ArrayList<HashMap<String, String>> jsonstr = (ArrayList<HashMap<String, String>>)action.getParameterValue("BlackNodes");
			for (int k = 0; k < jsonstr.size(); k++) {
				HashMap<String, String> singleblacknode = jsonstr.get(k);
//				blackNodes
				String pbx = singleblacknode.get(Fields.PBX);
				String accountID = singleblacknode.get(Fields.Account);
//				boolean update = action.getBoolValue(Fields.Update);
				String exten = singleblacknode.get(Fields.Exten);
				int style = Integer.valueOf(singleblacknode.get(Fields.Style));
				String[] extens = exten.split(",");
				
				for (int j = 0; j < extens.length; j++) {
					Vector<BlackList> list = new Vector<BlackList>();
					BlackList bl = RuntimeData.getInstance().getAccount(pbx, accountID).getBlackLists().get(extens[j]);
					if (bl == null)
						bl = new BlackList(pbx, accountID, extens[j]);
					bl.setStyle(style);
					if (bl.getStyle() == BlackList.list) {
						bl.getBlackListNumbers().clear();
						if(action.hasKey(Fields.List)){
							String myList = action.getStringValue(Fields.List);
							if(myList != null){
								String[] bls = myList.split(",");
								String newNum, otherNum;
								for (int i = 0; i < bls.length; i++) {
									if(bls[i].trim().equalsIgnoreCase(""))
										continue;
									
									// TODO
									// add 01058103397  +58103397
									// add 58103397   +01058103397
									// add 158xxxxx    +0158xxxx
									// add 0158xxxx     +158
									
									newNum = bls[i];
									bl.addBlackList(newNum.trim());
									otherNum = ASConfig.getInstance()
											.getOtherNum(newNum).trim();
									if (!"".equals(otherNum)) {
										bl.addBlackList(otherNum);
									}
								}
							}
						}
					} else {
						String expression = singleblacknode.get(Fields.Expression);
						bl.setExpression(expression);
					}
					if(singleblacknode.containsKey(Fields.MatchedPeer)){
						String matchedPeer = singleblacknode.get(Fields.MatchedPeer);
						if(matchedPeer != null && !matchedPeer.trim().equalsIgnoreCase("")){
							bl.setMatchedPeer(matchedPeer);
						}
					}
					if(singleblacknode.containsKey(Fields.UnmatchedPeer)){
						String unmatchedPeer = singleblacknode.get(Fields.UnmatchedPeer);
						if(unmatchedPeer != null && !unmatchedPeer.trim().equalsIgnoreCase("")){
							bl.setUnmatchedPeer(unmatchedPeer);
						}
					}
					if(singleblacknode.containsKey(Fields.DisplayName)){
						String displayName = singleblacknode.get(Fields.DisplayName);
						if(displayName != null && !displayName.trim().equalsIgnoreCase("")){
							bl.setDisplayName(displayName);
						}
					}
					list.add(bl);
						RuntimeData.getInstance().updateBlacklist(pbx, accountID, list);
					}
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
