package com.m7.cc.agi.handler.impl.handlers;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.model.Binded400;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;

public class CallLimitHandler {
	public static Logger log = Logger.getLogger(CallLimitHandler.class
			.getName());

	public static void callLimit(C5Action action) {
		try {
			AgiSession session = (AgiSession) action.getParameters().remove(
					Fields.Session);
			try {
				String agi_network_script = action
						.getStringValue(Fields.agi_network_script);
				String[] a = agi_network_script.substring(
						agi_network_script.indexOf('?') + 1).split("&");
				String pbx = a[0].split("=")[1];
				String exten = a[1].split("=")[1];
				String channelName = action.getStringValue(Fields.agi_channel);
				ServiceNo sn = RuntimeData.getInstance().getPbxViaId(pbx)
						.getServiceNo(exten);
				action.getParameters().clear();

				if (sn == null) {
					log.warning("ServiceNo [" + exten + "] not found");
					session.close();
					return;
				}

				C5Account account = RuntimeData.getInstance().getAccount(pbx,
						sn.getAccount());
				if (account == null) {
					log.warning("Account [" + sn.getAccount() + "] not found");
					session.close();
					return;
				}

				int maxIncomingCalls = account.getLisence()
						.getMaxIncomingCalls();
				if (maxIncomingCalls != -1
						&& account.getCallReport().getCurrentInCalls() > maxIncomingCalls) {
					session.send("HANGUP " + channelName);
				}
				
				//check if redList
				if(account.getRedList() != null){
					C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbx)
							.getChannel(channelName);
					String from_cid = channel.getFromCid();
					String redList = account.getRedList().getList();
					String[] redArray = redList.split(",");
					for(int i=0 ;i<redArray.length;i++){
						if(redArray[i].equals(from_cid)){
							session.send("SET VARIABLE IS_RED_NUM 1");
							break;
						}
					}
				}
				// if (account.getExtenFields().containKey(
				// Fields.MaxIncomingCalls)) {
				// int count = account.getExtenFields().getIntValue(
				// Fields.MaxIncomingCalls);
				// if (count > -1
				// && account.getCallReport().getCurrentInCalls() > count) {
				// session.send("HANGUP "+channelName);
				// } else if (account.getLisence().getCallCount() == 0) {
				// C5LisenceHandler.updateLisence(account);
				// if (account.getLisence().getCallCount() == 0){
				// session.send("HANGUP "+channelName);
				// }
				// }
				// }
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

	public static void incomingCallLimit(C5Action action) {
		AgiSession session = null;
		try {
			session = (AgiSession) action.getParameters()
					.remove(Fields.Session);

		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			return;
		}

		try {
			String agi_network_script = action
					.getStringValue(Fields.agi_network_script);
			String[] a = agi_network_script.substring(
					agi_network_script.indexOf('?') + 1).split("&");
			String serviceNo = a[0].split("=")[1];
			String channelName = action.getStringValue(Fields.agi_channel);

			if (ASConfig.getInstance().isBinded400(serviceNo)) {
				Binded400 binded400 = ASConfig.getInstance()
						.getBinded400ViaServiceNo(serviceNo);
				if (binded400 != null) {
					if (binded400.getIsCallable().equals("0")) {
						session.send("HANGUP " + channelName);
					}
					// Vector<C5Account> accounts = RuntimeData.getInstance()
					// .getAccount(binded400.getAccountId());
					// if (accounts.size() > 0) {
					// if (!accounts.get(0).getLisence().isCallable400()) {
					// session.send("HANGUP " + channelName);
					// }
					// }
				}
			}

			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}
}
