package com.m7.cc.ass.call.event;

import java.sql.Timestamp;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Hashtable;
import java.util.Vector;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.impl.Activator;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.asterisk.ami.action.AsteriskResponse;
import com.m7.cc.asterisk.ami.action.QueuePause;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class CallCounter {
	public static Vector<String> linkedChannel = new Vector<String>();

	private static Logger log = Logger.getLogger(CallCounter.class.getName());
	
	public static Hashtable<String, Integer> serviceNoInRateWarningMap = new Hashtable<String, Integer>();
	private static ExecutorService excutor = Executors.newCachedThreadPool();
	
	public static void count(C5Pbx pbx, C5Channel channel) {
		try {
			ServiceNo trunk = null;
			String accountId = channel.getAccount();
			if (channel.getChannelType().equals(Fields.normal)) {
				countNormal(pbx, channel);
			} else if (channel.getChannelType().equals(Fields.dialout)) {
				countDialout(pbx, channel);
			} else if (channel.getChannelType().equals(Fields.transfer) || 
					channel.getChannelType().equals(Fields.dialTransfer)){
				countTransfer(pbx, channel);
			}

			if (channel.getState().equals(Fields.Hangup)) {
				linkedChannel.remove(channel.getUniqueid());
				C5Account account = pbx.getAccount(accountId);
				if (account == null) {
					log.warning("Account [" + accountId + "] not found");
				} else {
					if (account.getCallReport().outgoingCallEnd(
							channel.getUniqueid())
							|| account.getCallReport().incomingCallEnd(
									channel.getUniqueid())) {
						CallListener.getInstance().callReportUpdate(
								account.getAccount(),
								account.getCallReport().getStateEvent());
					}
				}
			}
			if (channel.getChannelType().equals(Fields.normal)
					|| channel.getChannelType().equals(Fields.transfer)) {
				if (channel.getState().equals(Fields.Hangup)
						&& channel.getSipPeer() == null) {
					trunk = pbx.getServiceNo(channel.getFromDid());
					if (trunk != null) {
						trunk.setInLosts(trunk.getInCalls()
								- trunk.getInComplete());
						C5Event event = trunk.getStateEvent();
						CallListener.getInstance().serviceNoState(
								channel.getAccount(), event);
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		setUserAutoBusy(pbx, channel);
	}

	private static void countNormal(C5Pbx pbx, C5Channel channel) {
		ServiceNo trunk = null;
		String accountId = channel.getAccount();
		if (channel.getState().equals(Fields.Ring)) {
			// service number
			if (channel.getFromDid() != null
					&& !channel.getFromDid().equalsIgnoreCase("")
					&& !channel.isLooting()) {
				trunk = pbx.getServiceNo(channel.getFromDid());
				if (trunk != null) {
					trunk.setInCalls(trunk.getInCalls() + 1);

					C5Account account = pbx.getAccount(accountId);
					if (account == null) {
						log.warning("Account [" + accountId + "] not found");
					} else if (channel.getSipPeer() == null) {
						channel.setRingtimestamp(Utils
								.getDate(Utils.getTimestamp(
										channel.getTimestamp()).getTime()));
						account.getCallReport().incomingCall(
								Integer.valueOf(channel.getRingtimestamp()
										.substring(11, 13)));
						account.getCallReport().incomingCallStart(
								channel.getUniqueid());
						CallListener.getInstance().callReportUpdate(
								account.getAccount(),
								account.getCallReport().getStateEvent());
					}

					C5Event event = trunk.getStateEvent();
					CallListener.getInstance().serviceNoState(
							channel.getAccount(), event);
				}
			}
		} else if (channel.getState().equals(Fields.Ringing)) {
			if (channel.getSipPeer() != null
					&& channel.getSipPeer().getUser() != null) {
				User user = channel.getSipPeer().getUser();
				if (!channel.getSipPeer().getLinkedChannel().equals(
						channel.getLinkedChannel().getUniqueid())) {
					user.setInCalls(user.getInCalls() + 1);
					CallListener.getInstance().userCallsUpdate(user.getId(),
							user);
				}
			}
		} else if (channel.getState().equals(Fields.Link)) {
			if (channel.getSipPeer() != null
					&& channel.getSipPeer().getUser() != null) {
				User user = channel.getSipPeer().getUser();
				user.setInCallsCompleted(user.getInCallsCompleted() + 1);
				CallListener.getInstance().userCallsUpdate(user.getId(), user);
			}

			if (channel.getFromDid() != null
					&& !channel.getFromDid().equalsIgnoreCase("")
					&& channel.getSipPeer() == null) {
				if (linkedChannel.contains(channel.getUniqueid()))
					// This linked channel has been counted, omit it
					// now.
					;
				else {
					trunk = pbx.getServiceNo(channel.getFromDid());
					if (trunk != null) {
						linkedChannel.add(channel.getUniqueid());
						C5Account account = pbx.getAccount(accountId);
						if (account == null) {
							log
									.warning("Account [" + accountId
											+ "] not found");
						} else {
							account.getCallReport().incomingCallCompleted(
									Integer.valueOf(channel.getRingtimestamp()
											.substring(11, 13)));
							CallListener.getInstance().callReportUpdate(
									account.getAccount(),
									account.getCallReport().getStateEvent());
						}
						trunk.setInComplete(trunk.getInComplete() + 1);
						C5Event event = trunk.getStateEvent();
						CallListener.getInstance().serviceNoState(
								channel.getAccount(), event);
					}
				}
			}
		} else if (channel.getState().equals(Fields.Hangup)) {
			if (channel.getSipPeer() == null) {
				trunk = pbx.getServiceNo(channel.getFromDid());
				if (trunk != null) {
					trunk.setInLosts(trunk.getInCalls() - trunk.getInComplete());
					C5Event event = trunk.getStateEvent();
					CallListener.getInstance().serviceNoState(
							channel.getAccount(), event);
					
					dealInRateWarning(trunk);
				}
			} else {
				User user = channel.getSipPeer().getUser();
				if (user != null) {
					Timestamp beginTime = Utils.getTimestamp(channel
							.getBeginTime());
					Timestamp endTime = Utils
							.getTimestamp(channel.getEndTime());
					if (beginTime != null && endTime != null) {
						user.setDialinTimeLength((int) (endTime.getTime() - beginTime
								.getTime()) + user.getDialinTimeLength());
						CallListener.getInstance().userCallsUpdate(
								user.getId(), user);
					}
				}
			}
		}

	}
	
	private static void countDialout(C5Pbx pbx, C5Channel channel) {
		String accountId = channel.getAccount();
		if (channel.getState().equals(Fields.Ring)) {

		} else if (channel.getState().equals(Fields.Ringing)) {
			C5Channel lchannel = channel.getLinkedChannel();
			C5Account account = pbx.getAccount(accountId);
			if (account == null) {
				log.warning("Account [" + accountId + "] not found");
			} else {
				channel.setRingtimestamp(Utils.getDate(Utils.getTimestamp(
						channel.getTimestamp()).getTime()));
				account.getCallReport().outgoingCall(
						Integer.valueOf(channel.getRingtimestamp().substring(
								11, 13)));
				account.getCallReport()
						.outgoingCallStart(channel.getUniqueid());
				CallListener.getInstance().callReportUpdate(
						account.getAccount(),
						account.getCallReport().getStateEvent());
				if (lchannel.getSipPeer() != null
						&& lchannel.getSipPeer().getUser() != null) {
					User user = lchannel.getSipPeer().getUser();
					user.setOutCalls(user.getOutCalls() + 1);
					CallListener.getInstance().userCallsUpdate(user.getId(),
							user);
				}
			}
		} else if (channel.getState().equals(Fields.Link)) {
			if (channel.getSipPeer() != null
					&& channel.getSipPeer().getUser() != null) {
				User user = channel.getSipPeer().getUser();
				user.setOutCallsCompleted(user.getOutCallsCompleted() + 1);
				CallListener.getInstance().userCallsUpdate(user.getId(), user);
			}
			if (channel.getSipPeer() == null) {
				C5Account account = pbx.getAccount(accountId);
				if (account == null) {
					log.warning("Account [" + accountId + "] not found");
				} else {
					account.getCallReport().outgoingCallCompleted(
							Integer.valueOf(channel.getRingtimestamp()
									.substring(11, 13)));
					CallListener.getInstance().callReportUpdate(
							account.getAccount(),
							account.getCallReport().getStateEvent());
				}
			}

		} else if (channel.getState().equals(Fields.Hangup)) {
			if (channel.getSipPeer() != null
					&& channel.getSipPeer().getUser() != null) {
				Timestamp beginTime = Utils
						.getTimestamp(channel.getBeginTime());
				Timestamp endTime = Utils.getTimestamp(channel.getEndTime());
				if (beginTime != null && endTime != null) {
					User user = channel.getSipPeer().getUser();
					user.setDialoutTimeLength((int) (endTime.getTime() - beginTime
							.getTime()) + user.getDialoutTimeLength());
					CallListener.getInstance().userCallsUpdate(user.getId(),
							user);
				}
			}
		}

	}
	
	private static void countTransfer(C5Pbx pbx, C5Channel channel) {
		if (channel.getState().equals(Fields.Ringing)) {
			if (channel.getSipPeer() != null
					&& channel.getSipPeer().getUser() != null) {
				User user = channel.getSipPeer().getUser();
				user.setTransferCalls(user.getTransferCalls() + 1);
				CallListener.getInstance().userCallsUpdate(user.getId(), user);
			}
		} else if (channel.getState().equals(Fields.Link)) {
			if (channel.getSipPeer() != null
					&& channel.getSipPeer().getUser() != null) {
				User user = channel.getSipPeer().getUser();
				user.setTransferCallsCompleted(user.getTransferCallsCompleted() + 1);
				CallListener.getInstance().userCallsUpdate(user.getId(), user);
			}
		}
	}

	private static void setUserAutoBusy(C5Pbx pbx, C5Channel channel) {
		try {
			if (channel.getState().equals(Fields.Link)) {
				if (channel.getChannelType().equals(Fields.normal)
						|| channel.getChannelType().equals(Fields.dialout)
						|| channel.getChannelType().equals(Fields.transfer)
						|| channel.getChannelType().equals(Fields.dialTransfer)) {
					SipPeer peer = channel.getSipPeer();
					if (peer != null) {
						User user = peer.getUser();
						if (user != null) {
							if (user.getBusyType().equals("99")) {
								if (user.getAutoBusyTimerTask() != null) {
									user.getAutoBusyTimerTask().cancel();
									user.setAutoBusyTimerTask(null);
								}
							} else {
								user.setOriginalBusy(user.isBusy());
								user.setOriginalBusyType(user.getBusyType());
								setBusy(user, "99", true);
							}
						}
					}
				}
			} else if (channel.getState().equals(Fields.Hangup)) {
				SipPeer peer = channel.getSipPeer();
				if (peer != null) {
					User user = peer.getUser();
					if (user != null) {
						if (user.getBusyType().equals("99")) {
							if (user.getAutoBusyTime() > 0) {
								int a = user.getAutoBusyTime() * 1000;
								AutoBusyTimerTask task = new AutoBusyTimerTask(
										user);
								user.setAutoBusyTimerTask(task);
								Activator.callTimer.schedule(task, a);
							} else {
								if (user.isLogin()) {
									setBusy(user, user.getOriginalBusyType(),
											user.isOriginalBusy());
								} else {
									setBusy(user, Fields.B00, false);
								}
							}
						}
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public static void setBusy(User u, String busyType, boolean busy)
			throws Exception {
		AMIClient amiClient = AMICore.getInstance().getAMIClient(u.getPbx());
		if (amiClient == null || !amiClient.isAuthenticated()) {
			log.warning("can not find this pbx: " + u.getPbx());
		} else {
			boolean result = true;
			if (u.isBusy() != busy && u.getSipNum() != null
					&& u.getQueues().size() > 0) {
				QueuePause queuePause = new QueuePause("SIP/" + u.getSipNum(),
						busy + "", Utils.getSynActionID("setbusy"));
				AsteriskResponse res = amiClient
						.sendSynchronousAction(queuePause);
				result = res.isSuccessful();
				if (!result) {
					log.warning("Pause member failed: " + res.toString());
				}
			}
			if (!u.getBusyType().equalsIgnoreCase(busyType)) {
				u.setBusy(busy);
				u.setBusyType(busyType);
				if (busy)
					CallListener.getInstance().userBusy(u.getUser(), u);
				else
					CallListener.getInstance().userUnBusy(u.getUser(), u);
			}
		}
	}
	
	private static void dealInRateWarning(ServiceNo sn){
		if(sn.getInCalls() < 10){
			return;
		}
		SimpleDateFormat formatter = new SimpleDateFormat("HH");
//        if(Integer.parseInt(formatter.format(new Date())) <= 8 || Integer.parseInt(formatter.format(new Date())) >= 22){
//            return;
//        }
		if(Integer.parseInt(formatter.format(new Date())) != 17){
			return;
		}
        boolean checkFlag = false;
		int hour = Integer.parseInt(formatter.format(new Date()));
		if(serviceNoInRateWarningMap.containsKey(sn.getExten())){
			int lastHour = serviceNoInRateWarningMap.get(sn.getExten());
			if(lastHour != hour){
				serviceNoInRateWarningMap.put(sn.getExten(), hour);
				checkFlag = true;
			}
		}else{
			serviceNoInRateWarningMap.put(sn.getExten(), hour);
			checkFlag = true;
		}
		if(checkFlag && sn.getInCalls() > 0){
			float rate = (float)sn.getInComplete() / sn.getInCalls();
			if(rate < 0.7f){
				excutor.execute(new CheckInRateLowTask(sn.getAccount(),sn.getExten(),rate*100+"%",hour+""));
				log.log(Level.WARNING, sn.getExten() + " inRate low 70% warning. rate = "+rate);
			}
		}
	}
}
