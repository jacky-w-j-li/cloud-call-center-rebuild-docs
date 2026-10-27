package com.m7.cc.agi.handler.impl.handlers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.AllBlackNums;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5LisenceHandler;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class CallInBlackNumHandler {
	public static Logger log = Logger.getLogger(CallInBlackNumHandler.class.getName());

	public static Map<String, String> dialRoute = new HashMap<String, String>();
	
	public static void isBlackNum(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);
			try {
				
				String agi_network_script = action
						.getStringValue(Fields.agi_network_script);
				String[] a = agi_network_script.substring(
						agi_network_script.indexOf('?') + 1).split("&");
				String pbx = a[0].split("=")[1];
				String accountid = a[1].split("=")[1];
				String extenid = a[2].split("=")[1];
				String callinnumber = a[3].split("=")[1];
				C5Account account = RuntimeData.getInstance().getAccount(pbx,
						accountid);
				if (account == null) {
					log.warning("Account [" + accountid + "] not found");
					session.close();
					return;
				}
				int indexofcount = account.getBlackLists().get(extenid).getBlackListNumbers().indexOf(callinnumber);
	
				if (indexofcount >= 0) {
					session.send("SET VARIABLE IS_BLACK_NUM 1");
				}else{
					session.send("SET VARIABLE IS_BLACK_NUM 0");
					}
				session.close();
			} catch (Exception e) {
				log.log(Level.WARNING, "", e);
				session.close();
				return;
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
		}
	}
}
