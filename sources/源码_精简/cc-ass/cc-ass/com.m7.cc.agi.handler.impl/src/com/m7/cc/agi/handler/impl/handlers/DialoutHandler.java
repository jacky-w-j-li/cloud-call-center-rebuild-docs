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
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.fastagi.AgiSession;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class DialoutHandler {
	public static Logger log = Logger.getLogger(DialoutHandler.class.getName());

	public static Map<String, String> dialRoute = new HashMap<String, String>();
	
	public static void isDialoutable(C5Action action) {
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
			String accountId = a[0].split("=")[1];
			String connectType = a[1].split("=")[1];
			String dprefix = null;
			String calledNo = null;
			if (a.length >= 4) {
				dprefix = a[2].split("=")[1];
				calledNo = a[3].split("=")[1];
			}
			String channelName = action.getStringValue(Fields.agi_channel);
			Vector<C5Account> accounts = RuntimeData.getInstance().getAccount(
					accountId);
			if (accounts.size() < 1) {
				log.warning("Account [" + accountId + "] not found");
				action.getParameters().clear();
				session.close();
				return;
			}
			HashMap<String, String> accountlimit = new HashMap<String, String>();
			String numberopen = "on";
			String acccallok = "yes";
			if(RuntimeData.getInstance().getNumCallToManyACCLimit().containsKey(calledNo)){
				accountlimit = RuntimeData.getInstance().getNumCallToManyACCLimit().get(calledNo);
				if(accountlimit.containsKey(accountId)){
					String open = accountlimit.get(accountId);
					if(open.equals("off")){
						session.send("EXEC ChannelRedirect " + channelName
								+ "|limitnum-music-call|1|1");
					}else{
						acccallok = "no";
					}
				}
			}
			if(acccallok.equals("yes")){
				if(RuntimeData.getInstance().getNumCallToManyLimit().containsKey(calledNo)){
					numberopen = RuntimeData.getInstance().getNumCallToManyLimit().get(calledNo);
						if(numberopen.equals("off")){
							session.send("EXEC ChannelRedirect " + channelName
									+ "|limitnum-music-call|1|1");
						}
				}
			}
			if(AllBlackNums.allBlackNumCach.containsKey("allblack")){
				String allblacklistnums = AllBlackNums.allBlackNumCach.get("allblack");
				String[] allblacklistnumsarray = allblacklistnums.split(",");
				String tempcalledNo = calledNo;
				while(tempcalledNo.length()<11){
					tempcalledNo = tempcalledNo + "0";
				}
				for (int i = 0; i < allblacklistnumsarray.length; i++) {
					switch (allblacklistnumsarray[i].length()) {
					case 1:
						if(tempcalledNo.substring(0,1).equals(allblacklistnumsarray[i])){
							session.send("EXEC ChannelRedirect " + channelName + "|blacknum-music-call|1|1");
						}
						break;
					case 2:
						if(tempcalledNo.substring(0,2).equals(allblacklistnumsarray[i])){
							session.send("EXEC ChannelRedirect " + channelName + "|blacknum-music-call|1|1");
						}
						break;
					case 3:
						if(tempcalledNo.substring(0,3).equals(allblacklistnumsarray[i])){
							session.send("EXEC ChannelRedirect " + channelName + "|blacknum-music-call|1|1");
						}					
						break;
					case 4:
						if(tempcalledNo.substring(0,4).equals(allblacklistnumsarray[i])){
							session.send("EXEC ChannelRedirect " + channelName + "|blacknum-music-call|1|1");
						}
						break;
					case 5:
						if(tempcalledNo.substring(0,5).equals(allblacklistnumsarray[i])){
							session.send("EXEC ChannelRedirect " + channelName + "|blacknum-music-call|1|1");
						}
						break;
					case 6:
						if(tempcalledNo.substring(0,6).equals(allblacklistnumsarray[i])){
							session.send("EXEC ChannelRedirect " + channelName + "|blacknum-music-call|1|1");
						}
						break;
					case 7:
						if(tempcalledNo.substring(0,7).equals(allblacklistnumsarray[i])){
							session.send("EXEC ChannelRedirect " + channelName + "|blacknum-music-call|1|1");
						}
						break;
					case 8:
						if(tempcalledNo.substring(0,8).equals(allblacklistnumsarray[i])){
							session.send("EXEC ChannelRedirect " + channelName + "|blacknum-music-call|1|1");
						}
						break;
					case 9:
						if(tempcalledNo.substring(0,9).equals(allblacklistnumsarray[i])){
							session.send("EXEC ChannelRedirect " + channelName + "|blacknum-music-call|1|1");
						}
						break;
					case 10:
						if(tempcalledNo.substring(0,10).equals(allblacklistnumsarray[i])){
							session.send("EXEC ChannelRedirect " + channelName + "|blacknum-music-call|1|1");
						}
						break;
					case 11:
						if(tempcalledNo.substring(0,11).equals(allblacklistnumsarray[i])){
							session.send("EXEC ChannelRedirect " + channelName + "|blacknum-music-call|1|1");
						}
						break;
					default:
						
						break;
					}
				}
			}
			boolean isCheck = true;
			// Alway skip checsk when use the transfer line of CT58 line to
			// transfer BJ numbers
			if (connectType.equals(Fields.XferFlag) && dprefix != null
					&& dprefix.equals(Fields.CT58DPrefix)) {
				if (calledNo != null && !calledNo.equals("")) {
					String num = calledNo;
					if (calledNo.startsWith("0")) {
						num = calledNo.substring(1);
					}
					if (ASConfig.getInstance().isMobileNumber(num)) {
						if (ASConfig.getInstance().isLocalMobileNumber(num,
								"010")) {
							isCheck = false;
						}
					} else {
						if (calledNo.startsWith("010")) {
							isCheck = false;
						} else if (!calledNo.startsWith("0")) {
							isCheck = false;
						}
					}
				}
			}

			if (isCheck) {
				C5Account account = accounts.get(0);
				if (!account.getLisence().isCanDialout()) {
					C5LisenceHandler.updateLisence(account);
					if (!account.getLisence().isCanDialout()) {
						if (connectType.equals(Fields.XferFlag)) {
							if (dprefix != null) {
								session.send("HANGUP " + channelName);
							}
						} else {
							session.send("EXEC ChannelRedirect " + channelName
									+ "|balance|s|1");
						}
					}
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
	public static void main(String[] args) {
		String str ="1234567890";
		System.out.println(str.substring(0,1));
	}
	public static void dialoutRoute(C5Action action) {
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
			String accountId = a[0].split("=")[1];
			
			String channelName = action.getStringValue(Fields.agi_channel);
			Vector<C5Account> accounts = RuntimeData.getInstance().getAccount(
					accountId);
			if (accounts.size() < 1) {
				log.warning("Account [" + accountId + "] not found");
				action.getParameters().clear();
				session.close();
				return;
			}
			
			String route = ASConfig.getInstance().getVar("route."+accountId);
			
			if(route != null && !route.equals("")){
				String dprefix = accounts.get(0).getDialoutLine().getExten();
				boolean routed = false;
				List<String> routes = new ArrayList<String>();
				String[] a1 = route.split(",");
				String firstRoute = dprefix;
				String firstRouteKey = "";
				for(int i=0;i<a1.length;i++) {
					String[] b1 = a1[i].split("-");
					String routeKey = accountId+b1[0];
					routes.add(routeKey);
					if(i==0){
						firstRoute = b1[0];
						firstRouteKey = routeKey;
					}
					int count = Integer.valueOf(b1[1]).intValue();
					if(dialRoute.containsKey(routeKey)) {
						int dialedCount = Integer.valueOf(dialRoute.get(routeKey)).intValue();
						if(dialedCount < count){
							dprefix = b1[0];
							routed = true;
							dialedCount++;
							dialRoute.put(routeKey, dialedCount+"");
							break;
						}
					} else {
						dprefix = b1[0];
						routed = true;
						dialRoute.put(routeKey, "1");
						break;
					}
				}
				//All routes are dispatched, clear it and use first route
				if(!routed) {
					for(int i=0;i<routes.size();i++) {
						dialRoute.remove(routes.get(i));
					}
					dprefix = firstRoute;
					dialRoute.put(firstRouteKey, "1");
				}
				session.send("SET VARIABLE PREFIX " + dprefix);
				log.info("==="+accountId+": "+dprefix);
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

	public static void isOutboundBlackList(C5Action action) {
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
			String pbxId = a[0].split("=")[1];
			String accountId = a[1].split("=")[1];
			String num = a[2].split("=")[1];
			String channelName = action.getStringValue(Fields.agi_channel);

			C5Account account = RuntimeData.getInstance().getAccount(pbxId,
					accountId);
			List<String> outboundBlackList = account
					.getNumViaType(Fields.DialoutBlackList);
			if (outboundBlackList != null && outboundBlackList.contains(num)) {
				C5Channel c5Channel = RuntimeData.getInstance()
						.getPbxViaId(pbxId).getChannel(channelName);
				if (c5Channel != null) {
					c5Channel.setLocation(Fields.blacklist);
				}
				session.send("EXEC ChannelRedirect " + channelName
						+ "|outboundBlackList|s|1");
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

	/**
	 * Agent need to dial out with own callerID number,we set callerID number as
	 * user login name, When agent dials out, use AGI get user callerID number
	 * and set to asterisk.
	 * 
	 * @param action
	 */
	// public static void getUserCallerIdNum(C5Action action) {
	// AgiSession session = null;
	// try {
	// session = (AgiSession) action.getParameters().remove(Fields.Session);
	// } catch (Exception e) {
	// log.log(Level.WARNING, "", e);
	// action.getParameters().clear();
	// return;
	// }
	//
	// try {
	// String agi_network_script = action
	// .getStringValue(Fields.agi_network_script);
	// String[] a = agi_network_script.substring(
	// agi_network_script.indexOf('?') + 1).split("&");
	// String pbxId = a[0].split("=")[1];
	// String channelName = action.getStringValue(Fields.agi_channel);
	//
	// C5Channel channel =
	// RuntimeData.getInstance().getPbxViaId(pbxId).getChannel(channelName);
	// if(channel == null) {
	// log.warning("Channel [" + channelName + "] not found");
	// action.getParameters().clear();
	// session.close();
	// return;
	// }
	//
	// SipPeer sipPeer = channel.getSipPeer();
	// if(sipPeer == null) {
	// log.warning("Sip peer [" + channelName + "] not found");
	// action.getParameters().clear();
	// session.close();
	// return;
	// }
	//
	// User user = sipPeer.getUser();
	// if(user == null) {
	// log.warning("User [" + channelName + "] not found via sip peer: " +
	// sipPeer.getExten());
	// action.getParameters().clear();
	// session.close();
	// return;
	// }
	//
	// String callerIDNum = ASConfig.getInstance().getDistrictNo() +
	// user.getUser().trim();
	// session.send("SET VARIABLE userCallerIDNum " + callerIDNum);
	//
	// action.getParameters().clear();
	// session.close();
	// } catch (Exception e) {
	// log.log(Level.WARNING, "", e);
	// action.getParameters().clear();
	// session.close();
	// return;
	// }
	// }

	public static void getUserCallerIDNum(C5Action action) {
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
			String pbxId = a[0].split("=")[1];
			String channelName = action.getStringValue(Fields.agi_channel);

			C5Channel channel = RuntimeData.getInstance().getPbxViaId(pbxId)
					.getChannel(channelName);
			if (channel == null) {
				log.warning("Channel [" + channelName + "] not found");
				action.getParameters().clear();
				session.close();
				return;
			}

			String callerIDNum = "";
			User user = channel.getSipPeer().getUser();
			
			C5Account account = RuntimeData.getInstance().getAccount(pbxId,
					channel.getAccount());
			if (account == null) {
				log.warning("Account [" + channel.getAccount()
						+ "] not found");
				action.getParameters().clear();
				session.close();
				return;
			}
			if (user == null) {
				log.warning("User not found when get user CallerIDNum, try to get from account line.");
				callerIDNum = account.getDialoutLine().getDidNum();
			} else {
				session.send("SET VARIABLE agentId " + user.getId());
				if(channel.getVar(Fields.CallSheetID) !=null&&
						!channel.getVar(Fields.CallSheetID).equals("")	){
					session.send("SET VARIABLE call_sheet_ID " + channel.getVar(Fields.CallSheetID));
				}
				
				callerIDNum = user.getMultiDidNumEnd();
				//if config multiDidNum
				if(callerIDNum == null || "".equals(callerIDNum) || callerIDNum.equals(account.getDialoutLine().getDidNum())){
					if(account.getDialoutLine().isMultiDidEnable()){
						if(account.getDialoutLine().getMultiDidList().size() > 0){
							if(account.getDialoutLine().getMultiDidScope() != null){
								if(account.getDialoutLine().getMultiDidScope().equals("all") || account.getDialoutLine().getMultiDidScope().equals("hand")){
									if(account.getDialoutLine().getMultiDidStrategy().equals("order")){
										if(account.getDialoutLine().getMultiDidIndex() > account.getDialoutLine().getMultiDidList().size()-1){
											account.getDialoutLine().setMultiDidIndex(0);
										}
										callerIDNum = account.getDialoutLine().getMultiDidList().get(account.getDialoutLine().getMultiDidIndex());
										if(account.getDialoutLine().getMultiDidIndex() >= account.getDialoutLine().getMultiDidList().size()-1){
											account.getDialoutLine().setMultiDidIndex(0);
										}else{
											account.getDialoutLine().setMultiDidIndex(account.getDialoutLine().getMultiDidIndex()+1);
										}
									}else if(account.getDialoutLine().getMultiDidStrategy().equals("random")){
										callerIDNum =  account.getDialoutLine().getMultiDidList()
												.get(Utils.getScopeRandom(0, account.getDialoutLine().getMultiDidList().size()));
									}	
								}	
							}
						}
					}
				}
			}
			if (callerIDNum != null && !"".equals(callerIDNum))
				session.send("SET VARIABLE userCallerIDNum " + callerIDNum);

			action.getParameters().clear();
			session.close();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			action.getParameters().clear();
			session.close();
			return;
		}
	}
	
	public static void formatDialoutNumber(C5Action action) {
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
			String pbxId = a[0].split("=")[1];
			String accountID = a[1].split("=")[1];
			String dialNum = a[2].split("=")[1];
			
			C5Account account = RuntimeData.getInstance().getAccount(pbxId,
					accountID);

			if (account == null) {
				log.warning("Account [" + accountID
						+ "] not found");
				action.getParameters().clear();
				session.close();
				return;
			}
			if (!dialNum.startsWith("9")) {
				User toUser = account.getUserViaExten(dialNum);
				Hashtable<String, C5Queue> queueMap = account.getQueues();
				Hashtable<String, SipPeer> peers = account.getPeers();
				if (toUser == null && !queueMap.containsKey(dialNum) && !peers.containsKey(dialNum)) {
					if(dialNum.length() == 4){
						boolean isHasGroup = false;
						String billUrl = ASConfig.getInstance().getVar("lisence.url");
						if(billUrl != null){
							String result = HttpProvider.sendGet(billUrl + "?action=service.queryGroupAccountExten&data={\"account\":\""
									+ account.getAccount() + "\",\"exten\":\""
									+ dialNum + "\"}");
							log.log(Level.INFO, "ass formatDialoutNumber require yy-server,get group accounts exten or another product exten:"+result);
							if (result != null) {
								JSONReader reader = new JSONReader();
								Map<String, Object> info = (Map<String, Object>) reader.read(result);
								if(info.get("success").toString().equals("true")){
									if(info.get("isHas").toString().equals("true")){
										isHasGroup = true;
									}
								}
							}
						}
						if(!isHasGroup){
							session.send("SET VARIABLE dialNum \"9" + dialNum + "\"");	
						}
					}else{
						session.send("SET VARIABLE dialNum \"9" + dialNum + "\"");						
					}
				}
			}
			if (dialNum.length()==5 && (dialNum.startsWith("95") || dialNum.startsWith("96"))) {
				session.send("SET VARIABLE dialNum \"9" + dialNum + "\"");
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
