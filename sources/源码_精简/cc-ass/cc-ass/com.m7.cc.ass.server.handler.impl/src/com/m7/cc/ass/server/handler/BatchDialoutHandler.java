package com.m7.cc.ass.server.handler;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.call.service.ChannelListener;
import com.m7.cc.ass.call.service.OriginateResponseListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.BatchDialoutor;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.C5QueueMember;
import com.m7.cc.ass.model.configuration.DialLine;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class BatchDialoutHandler {
	public static Logger log = Logger.getLogger(BatchDialoutHandler.class
			.getName());

	public static C5Response isBatchDialouting(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID(), false);

		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountId = action.getStringValue(Fields.Account);

			C5Pbx c5pbx = RuntimeData.getInstance().getPbxViaId(pbx);
			if (c5pbx == null) {
				response.setSucceed(false);
				response.setMessage("400:Pbx[" + pbx + "] not found");
				return response;
			}

			C5Account account = c5pbx.getAccount(accountId);
			if (account == null) {
				response.setSucceed(false);
				response.setMessage("404:Account [" + accountId + "] not found");
				return response;
			}

			BatchDialoutor dialoutor = account.getBatchDialoutor();
			if (dialoutor != null && dialoutor.isRunning()) {
				response.addParameter(Fields.IsBatchDialouting, true);
				response.addParameter(Fields.BatchDialoutType,
						dialoutor.getType());
				response.addParameter(Fields.BatchDialoutQueryParam,
						dialoutor.getQueryParam());
				response.addParameter(Fields.BatchDialoutDialCount,
						dialoutor.getDialCount());
				response.addParameter(Fields.BatchDialoutDialedCount,
						dialoutor.getDialedCount());
				response.addParameter(Fields.BatchDialoutDealingCount,
						dialoutor.getDealingCount());
				response.addParameter(Fields.BatchDialoutNotDealCount,
						dialoutor.getNotDealCount());
				response.addParameter(Fields.BatchDialoutBusyCount,
						dialoutor.getBusyCount());
				response.addParameter(Fields.BatchDialoutCongestionCount,
						dialoutor.getCongestionCount());
				response.addParameter(Fields.BatchDialoutInvalidCount,
						dialoutor.getInvalidCount());
				response.addParameter(Fields.BatchDialoutAgentIds,
						dialoutor.getAgentIds());
				response.addParameter(Fields.User, dialoutor.getUserId());
				response.addParameter(Fields.BatchDialoutPaused,
						dialoutor.isPause());
			} else {
				response.addParameter(Fields.IsBatchDialouting, false);
			}
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage("500");
		}
		return response;
	}

	public static C5Response preBatchDialout(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID(), false);

		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountId = action.getStringValue(Fields.Account);

			C5Pbx c5pbx = RuntimeData.getInstance().getPbxViaId(pbx);
			if (c5pbx == null) {
				response.setSucceed(false);
				response.setMessage("400:Pbx[" + pbx + "] not found");
				return response;
			}

			C5Account account = c5pbx.getAccount(accountId);
			if (account == null) {
				response.setSucceed(false);
				response.setMessage("404:Account [" + accountId + "] not found");
				return response;
			}

			DialLine dialLine = account.getDialoutLine();
			if (dialLine == null) {
				response.setSucceed(false);
				response.setMessage("403:Account [" + accountId
						+ "]'s dialout line not config.");
				return response;
			}

			if (!account.getLisence().isCanDialout()) {
				response.setSucceed(false);
				response.setMessage("401:The dialout fee of account ["
						+ accountId + "] has been consumed.");
				return response;
			}

			String batchDialoutType = action
					.getStringValue(Fields.BatchDialoutType);
			String addLicense = "0";
			C5Queue queue = null;
			if (batchDialoutType.equalsIgnoreCase(Fields.BatchDialoutAgentCall)) {
				if (!action.hasKey(Fields.Queue)) {
					response.setSucceed(false);
					response.setMessage("412.1:The batch dialout queue not specified.");
					return response;
				} else {
					String queueNo = action.getStringValue(Fields.Queue);
					Iterator<C5Queue> queueMebers = account.getQueues()
							.values().iterator();
					boolean isQueueFound = false;
					while (queueMebers.hasNext()) {
						queue = queueMebers.next();
						if (queue.getExten().equals(queueNo)) {
							isQueueFound = true;
							break;
						}
					}
					if (!isQueueFound) {
						response.setSucceed(false);
						response.setMessage("412.1:The batch dialout queue not found.");
						return response;
					}
					addLicense = action.getStringValue("AddLicense");
				}
			}

			String originationContext = action.getStringValue(Fields.Context);
			if (originationContext == null || originationContext.equals("")) {
				response.setSucceed(false);
				response.setMessage("412.2:The originate context ["
						+ originationContext + "] is uncatchable.");
				return response;
			}

			String callNumbers = action.getStringValue(Fields.CallNumber);
			if (callNumbers == null) {
				response.setSucceed(false);
				response.setMessage("412.3:The call number [" + callNumbers
						+ "] is uncatchable.");
				return response;
			} else {
				if (callNumbers.equals("")) {
					response.setSucceed(false);
					response.setMessage("412.3:The call number [" + callNumbers
							+ "] is uncatchable.");
					return response;
				}
			}

			// if (account.getBatchDialoutor() != null
			// && account.getBatchDialoutor().isRunning()) {
			// response.setSucceed(false);
			// response.setMessage("The batch dialout is running.");
			// return response;
			// }

			List<String> callNumberList = Arrays.asList(callNumbers.split(","));
			C5BatchDialoutor batchDialoutor = new C5BatchDialoutor(
					action.getActionID(), accountId, pbx, originationContext,
					batchDialoutType, callNumberList);
			account.setBatchDialoutor(batchDialoutor);
			batchDialoutor.setQueue(queue);
			batchDialoutor.setQueryParam(action
					.getStringValue(Fields.BatchDialoutQueryParam));
			batchDialoutor.setUserId(action.getParameters().get(Fields.User)
					.toString());
			batchDialoutor.setAgentIds(action
					.getStringValue(Fields.BatchDialoutAgentIds));
			if (addLicense != null && !addLicense.equals("")) {
				batchDialoutor.setAddLicense(Integer.parseInt(addLicense));
			} else {
				batchDialoutor.setAddLicense(0);
			}
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage("500");
			response.setSucceed(false);
		}
		return response;
	}

	public static C5Response appendBatchDialoutPhones(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID(), false);

		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountId = action.getStringValue(Fields.Account);

			C5Pbx c5pbx = RuntimeData.getInstance().getPbxViaId(pbx);
			if (c5pbx == null) {
				response.setSucceed(false);
				response.setMessage("400:Pbx [" + pbx + "] not found");
				return response;
			}

			C5Account account = c5pbx.getAccount(accountId);
			if (account == null) {
				response.setSucceed(false);
				response.setMessage("404:Account [" + accountId + "] not found");
				return response;
			}

			BatchDialoutor batchDialoutor = account.getBatchDialoutor();
			if (batchDialoutor == null) {
				response.setSucceed(false);
				response.setMessage("405:BatchDialoutor is not ready.");
				return response;
			}

			String callNumbers = action.getStringValue(Fields.CallNumber);
			List<String> callNumberList = Arrays.asList(callNumbers.split(","));
			if (callNumberList != null && callNumberList.size() > 0) {
				batchDialoutor.appendPhones(callNumberList);
			}

			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setSucceed(false);
			response.setMessage("500");
		}
		return response;
	}

	public static C5Response startBatchDialout(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID(), false);

		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountId = action.getStringValue(Fields.Account);

			C5Pbx c5pbx = RuntimeData.getInstance().getPbxViaId(pbx);
			if (c5pbx == null) {
				response.setSucceed(false);
				response.setMessage("400:Pbx [" + pbx + "] not found");
				return response;
			}

			C5Account account = c5pbx.getAccount(accountId);
			if (account == null) {
				response.setSucceed(false);
				response.setMessage("403:Account [" + accountId + "] not found");
				return response;
			}

			BatchDialoutor batchDialoutor = account.getBatchDialoutor();
			if (batchDialoutor == null) {
				response.setSucceed(false);
				response.setMessage("405:BatchDialoutor is not ready.");
				return response;
			}

			if (batchDialoutor.isRunning()) {
				response.setSucceed(false);
				response.setMessage("406:BatchDialoutor is running.");
				return response;
			}

			batchDialoutor.setDialCount(batchDialoutor.getPhones().size());
			batchDialoutor.start();
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage("500");
			response.setSucceed(false);
		}
		return response;
	}

	public static C5Response pauseBatchDialout(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID(), false);

		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountId = action.getStringValue(Fields.Account);

			C5Pbx c5pbx = RuntimeData.getInstance().getPbxViaId(pbx);
			if (c5pbx == null) {
				response.setSucceed(false);
				response.setMessage("400:Pbx [" + pbx + "] not found");
				return response;
			}

			C5Account account = c5pbx.getAccount(accountId);
			if (account == null) {
				response.setSucceed(false);
				response.setMessage("403:Account [" + accountId + "] not found");
				return response;
			}

			BatchDialoutor batchDialoutor = account.getBatchDialoutor();
			if (batchDialoutor == null) {
				response.setSucceed(false);
				response.setMessage("405:BatchDialoutor is not ready.");
				return response;
			}

			batchDialoutor.pause();
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage("500");
			response.setSucceed(false);
		}
		return response;
	}

	public static C5Response unPauseBatchDialout(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID(), false);

		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountId = action.getStringValue(Fields.Account);

			C5Pbx c5pbx = RuntimeData.getInstance().getPbxViaId(pbx);
			if (c5pbx == null) {
				response.setSucceed(false);
				response.setMessage("400:Pbx [" + pbx + "] not found");
				return response;
			}

			C5Account account = c5pbx.getAccount(accountId);
			if (account == null) {
				response.setSucceed(false);
				response.setMessage("403:Account [" + accountId + "] not found");
				return response;
			}

			BatchDialoutor batchDialoutor = account.getBatchDialoutor();
			if (batchDialoutor == null) {
				response.setSucceed(false);
				response.setMessage("405:BatchDialoutor is not ready.");
				return response;
			}

			batchDialoutor.unPause();
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage("500");
			response.setSucceed(false);
		}
		return response;
	}

	public static C5Response stopBatchDialout(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID(), false);

		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountId = action.getStringValue(Fields.Account);

			C5Pbx c5pbx = RuntimeData.getInstance().getPbxViaId(pbx);
			if (c5pbx == null) {
				response.setSucceed(false);
				response.setMessage("400:Pbx [" + pbx + "] not found");
				return response;
			}

			C5Account account = c5pbx.getAccount(accountId);
			if (account == null) {
				response.setSucceed(false);
				response.setMessage("403:Account [" + accountId + "] not found");
				return response;
			}

			BatchDialoutor batchDialoutor = account.getBatchDialoutor();
			if (batchDialoutor == null) {
				response.setSucceed(false);
				response.setMessage("405:BatchDialoutor is not ready.");
				return response;
			}
			batchDialoutor.stop();
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage("500");
			response.setSucceed(false);
		}
		return response;
	}

	public static C5Response closeBatchDialout(C5Action action) {
		C5Response response = new C5Response(action.getActionName(),
				action.getActionID(), false);
		try {
			String pbx = action.getStringValue(Fields.PBX);
			String accountId = action.getStringValue(Fields.Account);

			C5Pbx c5pbx = RuntimeData.getInstance().getPbxViaId(pbx);
			if (c5pbx == null) {
				response.setSucceed(false);
				response.setMessage("400:Pbx [" + pbx + "] not found");
				return response;
			}

			C5Account account = c5pbx.getAccount(accountId);
			if (account == null) {
				response.setSucceed(false);
				response.setMessage("403:Account [" + accountId + "] not found");
				return response;
			}

			BatchDialoutor batchDialoutor = account.getBatchDialoutor();
			if (batchDialoutor == null) {
				response.setSucceed(false);
				response.setMessage("405:BatchDialoutor is not ready.");
				return response;
			}

			if (!batchDialoutor.isRunning()) {
				CallListener.getInstance().removeOriginateListener(
						batchDialoutor.getContext(),
						(C5BatchDialoutor) batchDialoutor);
				CallListener.getInstance().removeChannelListener(accountId,
						(C5BatchDialoutor) batchDialoutor);
				batchDialoutor.destroy();
				account.setBatchDialoutor(null);
			}
			response.setSucceed(true);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			response.setMessage("500");
			response.setSucceed(false);
		}
		return response;
	}
}

class C5BatchDialoutor extends BatchDialoutor implements
		OriginateResponseListener, ChannelListener {
	private static Logger log = Logger.getLogger(C5BatchDialoutor.class
			.getName());

	private Map<String, String> currentCalls = Collections
			.synchronizedMap(new HashMap<String, String>());
	private List<String> currentChannels = Collections
			.synchronizedList(new ArrayList<String>());
	private Map<String, String> customerInfos = Collections
			.synchronizedMap(new HashMap<String, String>());
	private Map<String, String> parallels = Collections
			.synchronizedMap(new HashMap<String, String>());

	public C5BatchDialoutor(String actionId, String account, String pbx,
			String context, String type, List<String> phones) {
		super(actionId, account, pbx, context, type, phones);
	}

	@Override
	public void start() {
		if (dialoutThread == null) {
			dialoutThread = new Thread() {
				public void run() {
					running = true;
					String token = null;
					String customerId = null;
					String phoneNumber = null;
					String callingNum = null;
					int parallel = 0;
					String exten = null;
					Originate originate = null;
					Iterator<C5QueueMember> it = null;
					C5QueueMember member = null;
					Collection<C5QueueMember> queueMebers = null;
					C5Event responseEvent = null;
					SipPeer sipPeer = null;
					AMIClient amiClient = AMICore.getInstance().getAMIClient(
							pbx);
					C5Account c5account = null;
					try {
						C5Pbx c5pbx = RuntimeData.getInstance()
								.getPbxViaId(pbx);
						c5account = RuntimeData.getInstance().getAccount(pbx,
								account);
						log.info("total customer: " + phones.size());
						while (running) {
							parallel = 0;
							if (type.equalsIgnoreCase(Fields.BatchDialoutAnnouncement)) {
								int ivrCount = 0;
								while (true) {
									ivrCount = 0;
									if (!isPause) {
										// 1.Get ivr license count.
										ivrCount = c5account.getLisence()
												.getIvrCount() < 0 ? 2
												: c5account.getLisence()
														.getIvrCount();

										// 2.Minus currentCount to get current
										// count of dialable.
										ivrCount = ivrCount - parallels.size();
										// 3.If ivr count greater then 0, get
										// small one between ivrCount and
										// parallel.
										if (ivrCount > 0) {
											parallel = c5account.getLisence()
													.getMaxIncomingCalls()
													- c5account
															.getCallReport()
															.getCurrentInCalls();
											parallel = ivrCount > parallel ? parallel
													: ivrCount;
										}

										if (parallel > 0)
											break;
									}
									Thread.sleep(1000);
								}
							} else if (type
									.equalsIgnoreCase(Fields.BatchDialoutAgentCall)) {
								queueMebers = queue.getQueueMembers().values();
								int idleAgentCount = 0;
								while (true) {
									idleAgentCount = 0;
									if (!isPause) {
										it = queueMebers.iterator();
										// 1. Get current idle agent count.
										while (it.hasNext()) {
											member = it.next();
											if (!member.isPaused()) {
												sipPeer = c5account
														.getSipPeer(member
																.getExten());
												if (sipPeer != null
														&& sipPeer
																.getPeerStatus()
																.equals(SipPeer.REGISTERED)
														&& sipPeer
																.getChannels()
																.size() < 1) {
													idleAgentCount++;
												}
											}
										}
										// 2.Minus currentCount to get current
										// count of
										// dialable,paraller.size()=dialingCount+enqueueCount
										//System.out.println("A1:======: idle agent count: "+idleAgentCount);
										idleAgentCount -= parallels.size();
										//System.out.println("A2:======: mus current called: "+idleAgentCount);
										// if addLicense set, we should
										// ensure there has a count of addLicese
										// phone enqueue
										if (addLicense > 0) {
											idleAgentCount += addLicense;
										}
										//System.out.println("A3:======: added addition license: "+idleAgentCount);
										// 3.If idle agent count greater than 0,
										// get small one between idleAgentCount
										// and parallel.
										if (idleAgentCount > 0) {
											parallel = c5account.getLisence()
													.getMaxIncomingCalls()
													- c5account
															.getCallReport()
															.getCurrentInCalls();
											parallel = parallel > idleAgentCount ? idleAgentCount
													: parallel;
											//System.out.println("A4:======: real call: "+parallel);
											//System.out.println("---------------------------------------");
											if (parallel > 0)
												break;
										}
									}
									Thread.sleep(1000);
								}
							}

							for (int j = 0; j < parallel; j++) {
								id = null;
								phoneNumber = null;
								token = null;
								if (phones != null) {
									synchronized (phones) {
										if (phones.size() > 0)
											token = phones.remove(0);
									}
								}
								if (token != null) {
									int index = token.indexOf("_");
									customerId = token.substring(0, index);
									phoneNumber = token.substring(index + 1);
									customerInfos.put(customerId, phoneNumber);
									if (phoneNumber.trim().equals("")
											|| !phoneNumber.matches("[0-9]+")) {
										responseEvent = new C5Event(
												Fields.BatchDialout);
										responseEvent.addParameter(
												Fields.State,
												Fields.BatchDialoutDialed);
										responseEvent.addParameter(Fields.PBX,
												pbx);
										responseEvent.addParameter(
												Fields.Account, account);
										responseEvent.addParameter(
												Fields.CustomerID, customerId);
										responseEvent.addParameter(
												Fields.DialState, "-1");
										responseEvent
												.addParameter(
														Fields.BatchDialoutInvalidCount,
														invalidCount
																.incrementAndGet());
										responseEvent.addParameter(
												Fields.CalledNo, phoneNumber);
										responseEvent.addParameter(
												Fields.BatchDialoutDialedCount,
												dialedCount.incrementAndGet());
										customerInfos.remove(customerId);
										CallListener.getInstance()
												.batchDialoutDialed(account,
														responseEvent);
										continue;
									}
									if (ASConfig.getInstance().isMobileNumber(
											phoneNumber)
											&& !ASConfig.getInstance()
													.isLocalMobileNumber(
															phoneNumber)) {
										callingNum = "0" + phoneNumber;
									} else {
										callingNum = phoneNumber;
									}
									exten = "SIP/"
											+ c5account.getSipContact(
													callingNum,
													Fields.DialoutFlag)
											+ "@"
											+ ASConfig.getInstance()
													.getDialoutLine()
											+ ":"
											+ ASConfig.getInstance()
													.getDialoutPort();
									originate = new Originate(
											exten,
											context,
											context,
											"1",
											Utils.getSynActionID(Fields.BatchDialout));
									c5pbx.addParameterCache(
											originate.getActionID(),
											phoneNumber);
									originate.setAsync("true");
									originate.setTimeout("30000");
									originate.setCallerID(c5account
											.getDidNum(Fields.DialoutFlag));
									amiClient.sendAction(originate);
									currentCalls.put(originate.getActionID(),
											customerId);
									parallels.put(customerId, phoneNumber);
									//System.out.println("B1:=============: add parallel: "+ customerId);
									responseEvent = new C5Event(
											Fields.BatchDialout);
									responseEvent.addParameter(Fields.State,
											Fields.BatchDialoutDialing);
									responseEvent.addParameter(Fields.PBX, pbx);
									responseEvent.addParameter(Fields.Account,
											account);
									responseEvent.addParameter(
											Fields.CustomerID, customerId);
									responseEvent.addParameter(Fields.CalledNo,
											phoneNumber);
									responseEvent.addParameter(
											Fields.BatchDialoutDialedCount,
											dialedCount.incrementAndGet());
									CallListener.getInstance()
											.batchDialoutDialing(account,
													responseEvent);
								} else {
									log.info("phoneNumber is null, batch dialout is end.");
									running = false;
									break;
								}
							}
						}

						responseEvent = new C5Event(Fields.BatchDialout);
						responseEvent.addParameter(Fields.State,
								Fields.BatchDialoutFinish);
						responseEvent.addParameter(Fields.PBX, pbx);
						responseEvent.addParameter(Fields.Account, account);
						CallListener.getInstance().batchDialoutFinish(account,
								responseEvent);
					} catch (Exception e) {
						log.log(Level.WARNING, "", e);
						responseEvent = new C5Event(Fields.BatchDialout);
						responseEvent.addParameter(Fields.State,
								Fields.BatchDialoutError);
						responseEvent.addParameter(Fields.PBX, pbx);
						responseEvent.addParameter(Fields.Account, account);
						CallListener.getInstance().batchDialoutError(account,
								responseEvent);
					} finally {
						if (phones != null) {
							phones.clear();
							phones = null;
						}
					}
				}
			};
			CallListener.getInstance().addOriginateListener(context, this);
			CallListener.getInstance().addChannelListener(account, this);
			dialoutThread.start();
		}
	}

	@Override
	public void OriginateResponse(C5Event event) {
		try {
			String actionId = event.getStringValue(Fields.ActionID);
			String reason = event.getStringValue(Fields.Reason);
			String customerId = "";
			String phoneNumber = null;
			synchronized (currentCalls) {
				if (currentCalls.containsKey(actionId)) {
					customerId = currentCalls.get(actionId);
					phoneNumber = customerInfos.get(customerId);

					if (!reason.equals("4")) {
						currentCalls.remove(actionId);
						customerInfos.remove(customerId);
						parallels.remove(customerId);
						//System.out.println("B2:=============: remove parallel when not 4: "+ customerId);
					} else {
						if (event.getParameters().containsKey(Fields.Channel)) {
							currentChannels.add(event.getParameterValue(
									Fields.Uniqueid).toString());
						}
					}
				}
			}

			if (phoneNumber != null) {
				C5Event responseEvent = new C5Event(Fields.BatchDialout);
				responseEvent.addParameter(Fields.State,
						Fields.BatchDialoutDialed);
				responseEvent.addParameter(Fields.PBX, pbx);
				responseEvent.addParameter(Fields.Account, account);
				responseEvent.addParameter(Fields.CustomerID, customerId);
				responseEvent.addParameter(Fields.CalledNo, phoneNumber);
				responseEvent.addParameter(Fields.Response,
						event.getStringValue(Fields.Response));
				responseEvent.addParameter(Fields.DialState, reason);
				if (!reason.equals("4")) {
					if (reason.equals("3"))
						responseEvent.addParameter(
								Fields.BatchDialoutNotDealCount,
								notDealCount.incrementAndGet());
					else if (reason.equals("8"))
						responseEvent.addParameter(
								Fields.BatchDialoutBusyCount,
								busyCount.incrementAndGet());
					else {
						responseEvent.addParameter(Fields.DialState, "0");
						responseEvent.addParameter(
								Fields.BatchDialoutCongestionCount,
								congestionCount.incrementAndGet());
					}
				} else
					responseEvent.addParameter(Fields.BatchDialoutDealingCount,
							dealingCount.incrementAndGet());

				CallListener.getInstance().batchDialoutDialed(account,
						responseEvent);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void channelStatusChanged(C5Channel channel) {
		String actionId = channel.getActionId();
		String customerId = "";
		String phoneNumber = null;
		if (actionId != null) {
			if (channel.getState().equals(Fields.Hangup)) {
				synchronized (currentCalls) {
					if (currentCalls.containsKey(actionId)) {
						customerId = currentCalls.remove(actionId);
						phoneNumber = customerInfos.remove(customerId);
						currentChannels.remove(channel.getUniqueid());
						parallels.remove(customerId);
						//System.out.println("B3:=============: remove parallel when hangup: "+ customerId);
					}
				}

				if (phoneNumber != null) {
					C5Event responseEvent = new C5Event(Fields.BatchDialout);
					responseEvent.addParameter(Fields.State,
							Fields.BatchDialoutHangup);
					responseEvent.addParameter(Fields.PBX, pbx);
					responseEvent.addParameter(Fields.Account, account);
					responseEvent.addParameter(Fields.CustomerID, customerId);
					responseEvent.addParameter(Fields.CalledNo, phoneNumber);
					CallListener.getInstance().batchDialoutDialed(account,
							responseEvent);
				}
			} else if (channel.getState().equals(Fields.Link)) {
				if (type.equalsIgnoreCase(Fields.BatchDialoutAgentCall)) {
					synchronized (currentCalls) {
						customerId = currentCalls.get(actionId);
						parallels.remove(customerId);
						//System.out.println("B4:=============: remove parallel when link: "+ customerId);
					}
				}
			}
		}
	}

	@Override
	public void newExten(C5Event event) {
	}
}