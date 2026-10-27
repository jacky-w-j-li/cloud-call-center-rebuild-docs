package com.m7.cc.ass.server.config.handler;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class AutoDialThread extends Thread {

	private static Logger log = Logger
			.getLogger(AutoDialThread.class.getName());

	private boolean dial = false;
	private String pbxID;
	private String accountId;

	public AutoDialThread(String pbx, String account) {
		super("auto dial "+account);
		this.pbxID = pbx;
		this.accountId = account;
		dial = true;
	}

	public void stopDial() {
		dial = false;
	}

	public void run() {
		try {
			C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(pbxID);
			C5Account account = pbx.getAccount(accountId);
			account.getAutoCalls().clear();
			AMIClient amiClient = AMICore.getInstance().getAMIClient(pbxID);
			while (dial) {
				try {
					// get list from app
					C5Action action = new C5Action("GetAutoDialList",
							Utils.getUniqueid());
					action.addParameter("account", accountId);
					String res = HttpProvider.sendPost(ASConfig.getInstance()
							.getVar("cdr.server.url"), action.getJsonString()
							.getBytes("UTF-8"), 10000);
					if (res.equals("404")) {
						dial = false;
						CallHandler.autoDialThreads.remove(accountId);
					} else {
						String[] nos = res.split(",");
						for (int i = 0; i < nos.length;) {
							if(!dial) {
								break;
							}
							SimpleDateFormat formatter = new SimpleDateFormat("HH");
							if(Integer.parseInt(formatter.format(new Date())) < 9 || Integer.parseInt(formatter.format(new Date())) >= 21){
								sleep(10000);
								continue;
							}
							if(account.getAutoCalls().size() >= account.getLisence().getMaxIncomingCalls()){
								sleep(500);
								continue;
							}
							if(account.getLisence().getAutoCallStrategy().equals(Fields.AutoCallStrategy_Smart)){
//								if(account.getOnlineUser().size() == 0){
//									sleep(1000);
//									continue;
//								}
								if( (account.getAutoCalls().size()-account.getCallReport().getCurrentInCalls()) 
										>= ((account.getIdleAndReserveUser())*account.getLisence().getSmartAutoCallCount()) ){
									sleep(500);
									continue;
								}
							}
							String[] _nos = nos[i].split(":");
							String no = _nos[0];
							String id = _nos[1];
							String channel = "SIP/"+account.getSipContact(no, Fields.DialoutFlag)+ "@"
									+ ASConfig.getInstance().getDialoutLine()
									+ ":"
									+ ASConfig.getInstance().getDialoutPort();
							String serviceNo = account.getDidNum(Fields.DialoutFlag);
							if(account.getServicePeer(serviceNo) == null){
								serviceNo = account.getServiceNoArray()[0].getExten();
							}
							String actionID = "auto,"+accountId + ","+ no + "," + id;
							Originate originate = new Originate(channel,
									serviceNo, serviceNo, "1",
									actionID);
							originate.setAsync("true");
							originate.setTimeout("60000");
							originate.setCallerID(account.getDidNum(Fields.DialoutFlag));
							originate.setVariable("autocall=1|realdid="+no);
							amiClient.sendAction(originate);
							account.getAutoCalls().add(actionID);
							i++;
							sleep(10);
						}
					}
				} catch (Exception e) {
					log.log(Level.WARNING, "", e);
				}

			}
		} catch (Exception e) {
			log.log(Level.WARNING, "auto dial failed", e);
			dial = false;
			CallHandler.autoDialThreads.remove(accountId);
		}
		dial = false;
		CallHandler.autoDialThreads.remove(accountId);
	}
}
