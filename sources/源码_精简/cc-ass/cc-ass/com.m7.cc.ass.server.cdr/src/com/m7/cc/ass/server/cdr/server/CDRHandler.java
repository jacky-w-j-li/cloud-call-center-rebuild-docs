package com.m7.cc.ass.server.cdr.server;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.service.BatchDialoutListener;
import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.call.service.ChannelListener;
import com.m7.cc.ass.call.service.OriginateResponseListener;
import com.m7.cc.ass.call.service.PeerListener;
import com.m7.cc.ass.call.service.QueueListener;
import com.m7.cc.ass.call.service.UserListener;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.model.CallNumberInfo;
import com.m7.cc.ass.config.model.District;
import com.m7.cc.ass.config.model.Province;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.cdr.impl.C5BatchDialoutRecord;
import com.m7.cc.ass.model.cdr.impl.C5CallRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.C5QueueEntry;
import com.m7.cc.ass.model.configuration.C5QueueMember;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

/**
 * This class converts ami event to cdr, and then asks cdr server to dispatch or
 * save it. Every handler indicate to one PBX.
 * 
 * @author Cai Zhibin 2009-7-15
 * 
 */
public class CDRHandler implements ChannelListener, PeerListener,
		QueueListener, UserListener, BatchDialoutListener, OriginateResponseListener {
	private String pbx;
	private CDRServer server;
	private Logger log = Logger.getLogger(CDRHandler.class.getName());
	// private static Logger logger =
	// IceLogger.getLogger(ASConfig.getInstance().getLogDir(),
	// "cdrhandler", "FINE", false);
	private Logger cdrLog;
	private boolean destructing = false;

	private Hashtable<String, C5CallRecord> callCdrs = new Hashtable<String, C5CallRecord>();
	private Hashtable<String, C5PeerCallRecord> peerCallCdrs = new Hashtable<String, C5PeerCallRecord>();
	private Hashtable<String, String> voicemailTimestamp = new Hashtable<String, String>();

	private Hashtable<String, C5PeerRecord> peerBusys = new Hashtable<String, C5PeerRecord>();
	private Hashtable<String, C5PeerRecord> peerLogins = new Hashtable<String, C5PeerRecord>();
	private Hashtable<String, C5PeerRecord> peerRegisters = new Hashtable<String, C5PeerRecord>();

	private Hashtable<String, C5ChannelRecord> channelCdrs = new Hashtable<String, C5ChannelRecord>();

	private Vector<CdrListener> listeners = new Vector<CdrListener>();

	private Map<String, C5Event> autoCalls = new HashMap<String, C5Event>();
	
	public CDRHandler(CDRServer server, String pbx) {
		this.server = server;
		this.pbx = pbx;
		cdrLog = IceLogger.getLogger(ASConfig.getInstance().getLogDir(),
				CDRServer.logName + pbx, "ALL", false);
	}

	public void stop() {
		destructing = false;
		CallListener.getInstance().removeChannelListener(pbx, this);
		CallListener.getInstance().removePeerListener(pbx, this);
		CallListener.getInstance().removeQueueListenerr(pbx, this);
		CallListener.getInstance().removeUserListener(pbx, this);
		CallListener.getInstance().removeBatchDialoutListener(pbx, this);
		listeners.clear();
		cleanBusyRecord();
		cleanLoginRecord();
	}

	public void destruct() {
		log.warning("close cdrhandler " + pbx);
		if (destructing)
			return;
		destructing = true;
		server = null;

		try {
			callCdrs.clear();
			callCdrs = null;

			peerBusys.clear();
			peerBusys = null;

			peerLogins.clear();
			peerLogins = null;

			peerRegisters.clear();
			peerRegisters = null;

			channelCdrs.clear();
			channelCdrs = null;

			listeners.clear();
			listeners = null;

			voicemailTimestamp.clear();
			voicemailTimestamp = null;
		} catch (Exception e) {
			log.log(Level.WARNING, "Destruct handler failed.", e);
		}
	}

	private void cleanBusyRecord() {
		synchronized (peerBusys) {
			Iterator<C5PeerRecord> prs = peerBusys.values().iterator();
			while (prs.hasNext()) {
				C5PeerRecord pr = prs.next();
				pr.setEnd_time(Utils.getCurrentTimestamp());
				pr.setOpType(C5PeerRecord.update);
				server.updatePeerCdr(pr);
				this.notifyPeerCdrUpdate(pr);
			}
		}
	}

	private void cleanLoginRecord() {
		synchronized (peerLogins) {
			Iterator<C5PeerRecord> prs = peerLogins.values().iterator();
			while (prs.hasNext()) {
				C5PeerRecord peerLogin = prs.next();
				peerLogin.setEnd_time(Utils.getCurrentTimestamp());
				peerLogin.setOpType(C5PeerRecord.update);
				peerLogin.setComments("unknow");
				server.updatePeerCdr(peerLogin);
				notifyPeerCdrUpdate(peerLogin);
			}
		}
	}

	public String getPbx() {
		return pbx;
	}

	public void channelStatusChanged(C5Channel channel) {
		if (destructing)
			return;
		doPeerCallCdr(channel);
		doChannelCdr(channel);
	}

	private void doChannelCdr(C5Channel channel) {
		try {
			if(channel.getState().equalsIgnoreCase(Fields.Hangup)
					&& autoCalls.containsKey(channel.getUniqueid())) {
				C5Account account = RuntimeData.getInstance().getPbxViaId(pbx).getAccount(channel.getAccount());
				account.getAutoCalls().remove(channel.getUniqueid());
				C5Event event = autoCalls.remove(channel.getUniqueid());
				event.addParameter(Fields.EndTime, channel.getEndTime());
				event.addParameter(Fields.KeyPress, channel.getQueue()!=null && !channel.getQueue().equals(""));
				this.notifyAutoCall(event);
			}
			
			if (channel.getState().equalsIgnoreCase(Fields.Down)
					|| channel.getState().equalsIgnoreCase(Fields.Ring)) {
				// this is a new channel
				C5ChannelRecord cdr = channelCdrs.get(channel.getUniqueid());
				if (cdr == null)
					cdr = new C5ChannelRecord();
				cdr.setAsterisk(channel.getPbx());
				cdr.setChannel(channel.getChannelName());
				if (channel.getVar("REFUNIQUEID") != null) {
					cdr.setUniqueid(channel.getVar("REFUNIQUEID"));
					cdr.setSequence(1000);
				} else {
					cdr.setUniqueid(channel.getUniqueid());
				}
				cdr.setChannelType(channel.getChannelType());
				cdr.setTimestamp(channel.getTimestamp());
				cdr.setFromCid(channel.getFromCid());
				cdr.setFromDid(channel.getFromDid());
				cdr.setAccount(channel.getAccount());
				cdr.setLinked(false);
				channelCdrs.put(cdr.getUniqueid(), cdr);
			}
			if (channel.getState().equalsIgnoreCase(Fields.Hangup)) {
				if (!channel.getChannelType().equals(Fields.normal)) {
					channelCdrs.remove(channel.getUniqueid());
					return;
				}
				C5ChannelRecord cdr = channelCdrs.get(channel.getUniqueid());
				if (cdr == null)
					return;
				cdr.setAccount(channel.getAccount());
				cdr.setTimestamp(channel.getTimestamp());
				cdr.setLocation("hangup");
				cdr.setLocationId("");
				cdr.setSequence(cdr.getSequence() + 1);
				cdr.setLocationName("Hangup");
				server.processChannelCdr(cdr);
				//cdrLog.finest(cdr.getJsonString());
				notifyChannelCdrNew(cdr);
				channelCdrs.remove(channel.getUniqueid());
			}
		} catch (Exception e) {

		}
	}

	/**
	 * Caller channel transfer Callee channel transfer will create new call cdr
	 * and ring event
	 * 
	 * @param channel
	 */
	private void doPeerCallCdr(C5Channel channel) {
		// System.out.println(channel.getAllStatusString().replaceAll(",",
		// "\r\n")+"\r\n");

		/**
		 * We don't record inner and listen call.
		 */
		if (channel.getChannelType().equals(Fields.inner)
				|| channel.getChannelType().equals(Fields.listen))
			return;

		if (channel.getState().equalsIgnoreCase(Fields.Down)) {

		} else if (channel.getState().equalsIgnoreCase(Fields.Ring)) {
			processRing(channel);
		} else if (channel.getState().equalsIgnoreCase(Fields.Ringing)) {
			processRinging(channel);
		} else if (channel.getState().equalsIgnoreCase(Fields.Up)) {

		} else if (channel.getState().equalsIgnoreCase(Fields.Link)) {
			C5PeerCallRecord callCdr = peerCallCdrs.get(channel.getUniqueid());
			if (callCdr != null) {
				callCdr.getVars().putAll(channel.getC5Vars());
				callCdr.setBegin_time(channel.getTimestamp());
				callCdr.setStatus(C5PeerCallRecord.dealing);
				channel.addC5Var(Fields.CallStatus, C5PeerCallRecord.dealing);
				callCdr.setChannelState(Fields.Link);
				// callCdr.setLocation(channel.getLocation());
				callCdr.setRecord_file_name(getRecordFileName(
						channel.getMonitorFilename(), pbx));
				callCdr.setOpType(C5PeerCallRecord.update);

				if (callCdr.getDisposal_agent() == null) {
					if (channel.getSipPeer() != null
							&& channel.getSipPeer().getUser() != null) {
						callCdr.setDisposal_agent(channel.getSipPeer()
								.getUser().getId());
					} else if (channel.getLinkedChannel() != null
							&& channel.getLinkedChannel().getSipPeer() != null
							&& channel.getLinkedChannel().getSipPeer()
									.getUser() != null) {
						callCdr.setDisposal_agent(channel.getLinkedChannel()
								.getSipPeer().getUser().getId());
					} else {
						// TODO
						 if(channel.getChannelType().equals(Fields.dialTransfer)
							|| channel.getChannelType().equals(Fields.transfer)) {
							 callCdr.setDisposal_agent(channel.getVar(Fields.DisposalAgent));
						 }
					}
				}else{
					//for offline lootcal.
					if(channel.getLinkedChannel()!=null){
						if(channel.getLinkedChannel().getSipPeer()!=null){
							if(channel.getLinkedChannel().getSipPeer().getUser()!=null){
								String newDisposalAgent = channel.getLinkedChannel()
										.getSipPeer().getUser().getId();
								if(!callCdr.getDisposal_agent().equals(newDisposalAgent)){
									callCdr.setDisposal_agent(newDisposalAgent);
								}
							}
						}
					}
				}

				// TODO add for guo fu tong
				channel.addC5Var(Fields.BeginTime, channel.getTimestamp());
				channel.addC5Var(
						Fields.MonitorFilename,
						callCdr.getFileServer() + "/"
								+ callCdr.getRecord_file_name());

				if (channel.getQueue() != null) {
					callCdr.setError_memo(channel.getQueue());
					callCdr.setQueue_name(channel.getQueueName());
					callCdr.setQueue_time(channel.getQueueTimestamp());
				}
				cdrLog.finest(callCdr.getJsonString());
				saveChannelCdr(callCdr, channel);
				notifyPeerCallCdrUpdate(callCdr);
			}
		} else if (channel.getState().equalsIgnoreCase(Fields.Unlink)) {
			processUnlink(channel);
		} else if (channel.getState().equalsIgnoreCase(Fields.Hangup)) {
			voicemailTimestamp.remove(channel.getUniqueid());
			C5PeerCallRecord callCdr = peerCallCdrs.get(channel.getUniqueid());
			if (callCdr != null) {
				// callCdr.setLocation(channel.getLocation());
				peerCallCdrs.remove(callCdr.getCall_id());
			} else if (callCdr == null && channel.getSipPeer() != null) {
//				callCdr = peerCallCdrs.get(channel.getSipPeer()
//						.getLinkedChannel());
				return;
			}
			if (callCdr != null) {
				callCdr.getVars().putAll(channel.getC5Vars());
				callCdr.setEnd_time(channel.getTimestamp());
				callCdr.setOpType(C5PeerCallRecord.end);
				callCdr.setChannelState(Fields.Hangup);
				callCdr.setRecord_file_name(getRecordFileName(
						channel.getMonitorFilename(), pbx));
				log.warning("WHEN HANGUP,channel's Label is " + channel.getLabels());
				callCdr.setLabels(channel.getLabels());
				// callCdr.setLocation(channel.getLocation());

				// TODO add for guo fu tong
				channel.addC5Var(Fields.EndTime, channel.getTimestamp());
				channel.addC5Var(
						Fields.MonitorFilename,
						callCdr.getFileServer() + "/"
								+ callCdr.getRecord_file_name());

				if (channel.getQueue() != null) {
					callCdr.setError_memo(channel.getQueue());
					callCdr.setQueue_name(channel.getQueueName());
					callCdr.setQueue_time(channel.getQueueTimestamp());
					if (callCdr.getStatus().equals(Fields.leak)) {
						callCdr.setStatus(Fields.queueLeak);
					}
				}
				if ((callCdr.getLocation() != null && callCdr.getLocation()
						.endsWith(Fields.blacklist))
						|| (channel.getLocation() != null && channel
								.getLocation().equalsIgnoreCase(
										Fields.OutboundBlackList)))
					callCdr.setStatus("blackList");
				callCdr.setLocation("");

				if (channel.getVar(Fields.Statistic) != null) {
					callCdr.setStatistic(channel.getVar(Fields.Statistic));
				}
				
				if (channel.getChannelType().equals(Fields.normal)
						|| channel.getChannelType().equals(Fields.transfer)) {
					callCdr.setProvince(channel.getCallerProvince());
					callCdr.setProvinceCode(channel.getCallerProvinceCode());
					callCdr.setDistrict(channel.getCallerCity());
					callCdr.setDistrictCode(channel.getCallerCityCode());
					
					String serviceNoType = channel.getVar("SERVICE_NO_TYPE");
					if (serviceNoType != null && !serviceNoType.equals(Fields.normal)) {
						callCdr.setServiceNoType(serviceNoType);
					}
				} else if (channel.getChannelType().equals(Fields.dialout)
						|| channel.getChannelType().equals(Fields.dialTransfer)) {
					callCdr.setProvince(channel.getCalleeProvince());
					callCdr.setProvinceCode(channel.getCalleeProvinceCode());
					callCdr.setDistrict(channel.getCalleeCity());
					callCdr.setDistrictCode(channel.getCalleeCityCode());
				}
				//for an jian biao ji ke hu.20140812
				String keyTag = channel.getVar("KEY_TAG");
				if (keyTag != null) {
					callCdr.setKeyTag(true);
				}
				//for dialout cdrVar
				String cdrVar = channel.getVar(Fields.CdrVar);
				if (cdrVar != null) {
					callCdr.setCdrVar(cdrVar);
				}
				if(channel.getVar(Fields.IsAutoCall) != null){
					callCdr.setAutoCall(true);
				}

				cdrLog.finest(callCdr.getJsonString());
				notifyPeerCallCdrUpdate(callCdr);
				callCdr.getVars().clear();
			}
		}
	}

	private void processRing(C5Channel channel) {
		//for offline lootcall,don't record cdr.
		if(channel.getFromDid().startsWith("*")){
			return;
		}
		C5PeerCallRecord callCdr = new C5PeerCallRecord();
		callCdr.getVars().putAll(channel.getC5Vars());
		callCdr.setCall_sheet_id(Utils.getUniqueid());
		callCdr.setCall_id(channel.getUniqueid());
		callCdr.setOffering_time(channel.getTimestamp());
		callCdr.setOrigin_id(channel.getUniqueid());
		callCdr.setConnect_type(channel.getChannelType());
		callCdr.setStatus(Fields.leak);
		channel.addC5Var(Fields.CallStatus, Fields.leak);
		callCdr.setChannelState(Fields.Ring);
		callCdr.setCall_no(channel.getFromCid());
		callCdr.setCalled_no(channel.getFromDid());
		callCdr.setPbx(channel.getPbx());
		callCdr.setFileServer(ASConfig.getInstance().getFileServer());
		// if the variables of channel contained REFUNIQUEID, that means this
		// channel
		// was transfered from another PBX. We should update cdr.
		if (channel.getVar("REFUNIQUEID") != null) {
			callCdr.setRefUniqueid(channel.getVar("REFUNIQUEID"));
		}

		if (channel.getQueue() != null) {
			callCdr.setError_memo(channel.getQueue());
			callCdr.setQueue_name(channel.getQueueName());
			callCdr.setQueue_time(channel.getQueueTimestamp());
		}

		if (channel.isLooting()) {
			callCdr.setRef_call_sheet_id(channel.getVar(Fields.CallSheetID));
			channel.setLooting(false);
			callCdr.setAccount(channel.getAccount());
			if (channel.getChannelType().equals(Fields.normal)
					|| channel.getChannelType().equals(Fields.webcall)) {
				callCdr.setDirection(C5PeerCallRecord.in);
			} else if (channel.getChannelType().equals(Fields.dialout)
					|| channel.getChannelType().equals(Fields.dialTransfer)
					|| channel.getChannelType().equals(Fields.transfer)) {
				callCdr.setDirection(C5PeerCallRecord.out);
			}
		} else {
			if (channel.getChannelType().equals(Fields.normal)) {
				callCdr.setAccount(channel.getAccount());
				callCdr.setDirection(C5PeerCallRecord.in);
				callCdr.setConnect_type(Fields.normal);
			} else if (channel.getChannelType().equals(Fields.dialout)) {
				if (channel.getSipPeer() != null
						&& channel.getSipPeer().getUser() != null) {
					callCdr.setExtenType(channel.getSipPeer().getUser()
							.getExtenType());
				}
				callCdr.setAccount(channel.getAccount());
				callCdr.setDirection(C5PeerCallRecord.out);
				callCdr.setDisposal_agent(channel.getVar(Fields.DisposalAgent));
				callCdr.setAction_id(channel.getActionId());
			} else if (channel.getChannelType().equals(Fields.transfer)) {
				callCdr.setAccount(channel.getAccount());
				callCdr.setDirection(C5PeerCallRecord.in);
				callCdr.setRef_call_sheet_id(channel.getVar(Fields.CallSheetID));
				callCdr.setTransferMode(channel.getC5Var(Fields.TransferMode));
				callCdr.setTransferNum(channel.getC5Var(Fields.TransferNum));
				callCdr.setTransferAgent(channel.getC5Var(Fields.TransferAgent));
			} else if (channel.getChannelType().equals(Fields.dialTransfer)) {
				callCdr.setAccount(channel.getAccount());
				callCdr.setDirection(C5PeerCallRecord.out);
				callCdr.setRef_call_sheet_id(channel.getVar(Fields.CallSheetID));
				callCdr.setTransferMode(channel.getC5Var(Fields.TransferMode));
				callCdr.setTransferNum(channel.getC5Var(Fields.TransferNum));
				callCdr.setTransferAgent(channel.getC5Var(Fields.TransferAgent));
			} else if (channel.getChannelType().equals(Fields.webcall)) {
				if (channel.getSipPeer() != null) {
					callCdr.setAccount(channel.getAccount());
					if (channel.getSipPeer().getUser() != null) {
						callCdr.setExtenType(channel.getSipPeer().getUser()
								.getExtenType());
					}
					callCdr.setDisposal_agent(channel
							.getVar(Fields.DisposalAgent));
				} else
					callCdr.setAccount(channel.getAccount());
				callCdr.setDirection(C5PeerCallRecord.out);
				callCdr.setRef_call_sheet_id(channel.getVar(Fields.CallSheetID));
			} else {

			}
		}

		channel.addVar(Fields.CallSheetID, callCdr.getCall_sheet_id());
		channel.addC5Var(Fields.CallSheetID, callCdr.getCall_sheet_id());
		peerCallCdrs.put(channel.getUniqueid(), callCdr);
		cdrLog.finest(callCdr.getJsonString());
		notifyPeerCallCdrNew(callCdr);
	}

	private void processRinging(C5Channel channel) {
		C5Channel linkedChannel = channel.getLinkedChannel();
		
		/*if(linkedChannel.getC5Vars().get(Fields.TransferMode) != null && linkedChannel.getC5Vars().get(Fields.TransferNum) != null){
			C5PeerCallRecord callCdr = peerCallCdrs
					.get(linkedChannel.getUniqueid());
			callCdr.setTransferMode(linkedChannel.getC5Vars().get(Fields.TransferMode));
			callCdr.setTransferNum(linkedChannel.getC5Vars().get(Fields.TransferNum));
		}*/
		
		if (linkedChannel == null
				|| channel.getChannelType().equals(Fields.transfer)
				|| channel.getChannelType().equals(Fields.dialTransfer)) {
			return;
		} 
		// All cdr will be created when the channel ring. Channel will always
		// rings when
		// making a new connetion.
		if (!peerCallCdrs.containsKey(linkedChannel.getUniqueid())) {
			return;
		}

		C5PeerCallRecord callCdr = peerCallCdrs
				.get(linkedChannel.getUniqueid());
		callCdr.getVars().putAll(channel.getC5Vars());
		if(channel.getLinkedChannel() != null){
			callCdr.getVars().putAll(channel.getLinkedChannel().getC5Vars());
		}
		callCdr.setChannelState(Fields.Ringing);
		callCdr.setRingingTimestamp(channel.getTimestamp());
		// callCdr.setLocation(channel.getLocation());
		channel.addVar(Fields.CallSheetID, callCdr.getCall_sheet_id());
		channel.addC5Var(Fields.CallSheetID, callCdr.getCall_sheet_id());
		channel.addVar(Fields.Account, callCdr.getAccount());
		if (linkedChannel.getQueue() != null) {
			callCdr.setError_memo(linkedChannel.getQueue());
			callCdr.setQueue_name(linkedChannel.getQueueName());
			callCdr.setQueue_time(linkedChannel.getQueueTimestamp());
		} else if (channel.getQueue() != null) {
			callCdr.setError_memo(channel.getQueue());
			callCdr.setQueue_name(channel.getQueueName());
			callCdr.setQueue_time(channel.getQueueTimestamp());
		}

		if (channel.getChannelType().equals(Fields.normal)
				|| channel.getChannelType().equals(Fields.transfer)
				|| channel.getChannelType().equals(Fields.dialTransfer)
				|| channel.getChannelType().equals(Fields.webcall)) {
			if (channel.getSipPeer() != null
					&& channel.getSipPeer().getUser() != null) {
				// This call it not dispatched to any peer
				if (callCdr.getDisposal_agent() == null) {
					callCdr.setDisposal_agent(channel.getSipPeer().getUser()
							.getId());
					callCdr.setExtenType(channel.getSipPeer().getUser()
							.getExtenType());
					linkedChannel.addVar(Fields.DisposalAgent,
							callCdr.getDisposal_agent());
					// TODO add for guo fu tong
					channel.addC5Var(Fields.RingTime, channel.getTimestamp());
					linkedChannel.addC5Var(Fields.RingTime,
							channel.getTimestamp());
					channel.addC5Var(Fields.Agent, channel.getSipPeer()
							.getUser().getExten());
					linkedChannel.addC5Var(Fields.Agent, channel.getSipPeer()
							.getUser().getExten());

					channel.addVar(Fields.DisposalAgent,
							callCdr.getDisposal_agent());
					channel.getSipPeer().setLinkedChannel(
							linkedChannel.getUniqueid());
					channel.getSipPeer().setCallSheetId(
							callCdr.getCall_sheet_id());
					saveChannelCdr(callCdr, channel);
					updatePeerCall(callCdr, channel);
				}
				// It's dispatched again by queue
				else {
					// The current channel of the peer is this channel, that
					// means it ringing this peer
					// again.
					// Update the cdr of this peer
					if (channel.getSipPeer().getLinkedChannel()
							.equals(linkedChannel.getUniqueid())) {
						callCdr.setCall_sheet_id(channel.getSipPeer()
								.getCallSheetId());
						callCdr.setDisposal_agent(channel.getSipPeer()
								.getUser().getId());
						callCdr.setExtenType(channel.getSipPeer().getUser()
								.getExtenType());

						// TODO add for guo fu tong
						channel.addC5Var(Fields.RingTime,
								channel.getTimestamp());
						linkedChannel.addC5Var(Fields.RingTime,
								channel.getTimestamp());
						channel.addC5Var(Fields.Agent, channel.getSipPeer()
								.getUser().getExten());
						linkedChannel.addC5Var(Fields.Agent, channel
								.getSipPeer().getUser().getExten());

						linkedChannel.addVar(Fields.DisposalAgent,
								callCdr.getDisposal_agent());
						channel.addVar(Fields.DisposalAgent,
								callCdr.getDisposal_agent());
						saveChannelCdr(callCdr, channel);
						updatePeerCall(callCdr, channel);
					}
					// It's the first ringing of this peer
					// 1. create cdr.
					else {
						callCdr.setDisposal_agent(channel.getSipPeer()
								.getUser().getId());
						callCdr.setExtenType(channel.getSipPeer().getUser()
								.getExtenType());

						// TODO add for guo fu tong
						channel.addC5Var(Fields.RingTime,
								channel.getTimestamp());
						linkedChannel.addC5Var(Fields.RingTime,
								channel.getTimestamp());
						channel.addC5Var(Fields.Agent, channel.getSipPeer()
								.getUser().getExten());
						linkedChannel.addC5Var(Fields.Agent, channel
								.getSipPeer().getUser().getExten());

						linkedChannel.addVar(Fields.DisposalAgent,
								callCdr.getDisposal_agent());
						channel.addVar(Fields.DisposalAgent,
								callCdr.getDisposal_agent());

						// Omit belows for new Cdr recorder
						// String csid = Utils.getUniqueid();
						// callCdr.setCall_sheet_id(csid);

						channel.getSipPeer().setLinkedChannel(
								linkedChannel.getUniqueid());
						channel.getSipPeer().setCallSheetId(
								callCdr.getCall_sheet_id());
						saveChannelCdr(callCdr, channel);
						updatePeerCall(callCdr, channel);
					}
				}
			}
			// This call is transfered to outbound
			else {
				callCdr.setDisposal_agent(linkedChannel
						.getVar(Fields.DisposalAgent));
				updatePeerCall(callCdr, channel);
			}
		} else if (channel.getChannelType().equals(Fields.dialout)) {
			// It is a looted call
			if (callCdr.getDisposal_agent() == null) {
				if (channel.getSipPeer() != null
						&& channel.getSipPeer().getUser() != null) {
					callCdr.setDisposal_agent(channel.getSipPeer().getUser()
							.getId());
					callCdr.setExtenType(channel.getSipPeer().getUser()
							.getExtenType());
					// TODO add for guo fu tong
					channel.addC5Var(Fields.RingTime, channel.getTimestamp());
					linkedChannel.addC5Var(Fields.RingTime,
							channel.getTimestamp());
					channel.addC5Var(Fields.Agent, channel.getSipPeer()
							.getUser().getExten());
					linkedChannel.addC5Var(Fields.Agent, channel.getSipPeer()
							.getUser().getExten());

				} else {
					callCdr.setDisposal_agent("");
					log.warning("Null disposalAgent process dialout channel,"
							+ " this should never happen");
				}
			}
			channel.addVar(Fields.DisposalAgent, callCdr.getDisposal_agent());
			updatePeerCall(callCdr, channel);
		}
	}

	private void saveChannelCdr(C5PeerCallRecord callCdr, C5Channel channel) {
		if (!callCdr.getConnect_type().equals(Fields.normal))
			return;
		C5ChannelRecord cdr = channelCdrs.get(callCdr.getCall_id());
		if (cdr == null)
			return;
		cdr.setAccount(callCdr.getAccount());
		cdr.setTimestamp(channel.getTimestamp());
		cdr.setLocation("peer");
		cdr.setLocationId(callCdr.getDisposal_agent());

		cdr.setSequence(cdr.getSequence() + 1);
		if (channel.getState().equals(Fields.Link)) {
			cdr.setLinked(true);
			cdr.setLocationName("Link");
		} else {
			cdr.setLocationName("Ringing");
		}
		server.processChannelCdr(cdr);
		//cdrLog.finest(cdr.getJsonString());
		notifyChannelCdrNew(cdr);
	}

	private void processUnlink(C5Channel channel) {
		if (channel.getSipPeer() != null) {
			channel.getSipPeer().setLinkedChannel("");
			channel.getSipPeer().setCallSheetId("");
		}
		C5PeerCallRecord callCdr = peerCallCdrs.remove(channel.getUniqueid());
		if (callCdr != null) {
			callCdr.getVars().putAll(channel.getC5Vars());
			callCdr.setEnd_time(channel.getTimestamp());

			// TODO add for guo fu tong
			channel.addC5Var(Fields.EndTime, channel.getTimestamp());

			callCdr.setOpType(C5PeerCallRecord.end);
			callCdr.setChannelState(Fields.Unlink);
			log.warning("WHEN UNLINK,channel's Label is " + channel.getLabels());
			callCdr.setLabels(channel.getLabels());
			log.warning("AFTER UNLINK SET LABEL,callCdr's Label is " + callCdr.getLabels());
			// callCdr.setLocation(channel.getLocation());
			if (channel.getQueue() != null) {
				callCdr.setError_memo(channel.getQueue());
				callCdr.setQueue_name(channel.getQueueName());
				callCdr.setQueue_time(channel.getQueueTimestamp());
				if (callCdr.getStatus().equals(Fields.leak)) {
					callCdr.setStatus(Fields.queueLeak);
				}
			}

			if (channel.getVar(Fields.Statistic) != null) {
				callCdr.setStatistic(channel.getVar(Fields.Statistic));
			}
			
			if (channel.getChannelType().equals(Fields.normal)
					|| channel.getChannelType().equals(Fields.transfer)) {
				callCdr.setProvince(channel.getCallerProvince());
				callCdr.setProvinceCode(channel.getCallerProvinceCode());
				callCdr.setDistrict(channel.getCallerCity());
				callCdr.setDistrictCode(channel.getCallerCityCode());
				
				String serviceNoType = channel.getVar("SERVICE_NO_TYPE");
				if (serviceNoType != null && !serviceNoType.equals(Fields.normal)) {
					callCdr.setServiceNoType(serviceNoType);
				}
			} else if (channel.getChannelType().equals(Fields.dialout)
					|| channel.getChannelType().equals(Fields.dialTransfer)) {
				callCdr.setProvince(channel.getCalleeProvince());
				callCdr.setProvinceCode(channel.getCalleeProvinceCode());
				callCdr.setDistrict(channel.getCalleeCity());
				callCdr.setDistrictCode(channel.getCalleeCityCode());
			}
			//for an jian biao ji ke hu.20140812
			String keyTag = channel.getVar("KEY_TAG");
			if (keyTag != null) {
				callCdr.setKeyTag(true);
			}
			//for dialout cdrVar
			String cdrVar = channel.getVar(Fields.CdrVar);
			if (cdrVar != null) {
				callCdr.setCdrVar(cdrVar);
			}
			if(channel.getVar(Fields.IsAutoCall) != null){
				callCdr.setAutoCall(true);
			}
			log.warning("BEFORE CDRLOG,callCdr's Label is " + callCdr.getLabels());
			cdrLog.finest(callCdr.getJsonString());
			notifyPeerCallCdrUpdate(callCdr);
			callCdr.getVars().clear();
		}
	}

	private void updatePeerCall(C5PeerCallRecord callCdr, C5Channel channel) {
		if (callCdr.getOffering_time() == null){
			callCdr.setOffering_time(channel.getTimestamp());
		}
		//for gua hao wang 20160531
		if(!callCdr.getStatus().equalsIgnoreCase(Fields.dealing)){
			callCdr.setBegin_time(null);
			callCdr.setEnd_time(null);
			callCdr.setChannelState(Fields.Ringing);
			callCdr.setStatus(Fields.notDeal);			
			channel.addC5Var(Fields.CallStatus, Fields.notDeal);
		}
		callCdr.setCall_no(channel.getFromCid());
		callCdr.setCalled_no(channel.getFromDid());
		callCdr.setConnect_type(channel.getChannelType());
		channel.addVar(Fields.CallSheetID, callCdr.getCall_sheet_id());
		channel.addC5Var(Fields.CallSheetID, callCdr.getCall_sheet_id());
		callCdr.setOpType(C5PeerCallRecord.update);
		cdrLog.finest(callCdr.getJsonString());
		notifyPeerCallCdrUpdate(callCdr);
	}

	public void newExten(C5Event event) {
		if (destructing)
			return;
		try {
			String channel = (String) event.getParameterValue(Fields.Channel);
			String context = (String) event.getParameterValue(Fields.Context);
			String timestamp = (String) event
					.getParameterValue(Fields.Timestamp);
			String extension = (String) event
					.getParameterValue(Fields.Extension);
			String uniqueid = (String) event.getParameterValue(Fields.Uniqueid);
			String pbx = event.getStringValue(Fields.PBX);
			String channelType = event.getStringValue(Fields.ChannelType);
			String account = event.getStringValue(Fields.Account);
			
			if (channelType.equals(Fields.normal)
					&& (context.endsWith("queue")
							|| context.endsWith("announcement")
							|| context.endsWith("voicemail")
							|| context.endsWith("ivr")
							|| context.endsWith("assignment")
							|| context.endsWith("callurl")
							|| context.endsWith("match-blacklist")
							|| context.endsWith("dialjobnum")
							|| context.endsWith("dynamic-route")
							|| context.endsWith("satisfaction")
							|| context.endsWith("time") 
							|| context.endsWith("validate")
							|| context.endsWith("textannouncement")
							|| context.endsWith("encryptmd5")
							|| context.endsWith("room")
							|| context.endsWith("ExtensionPeer")
							|| context.endsWith("superDialJobNum")
							|| context.endsWith("ivr-menu"))) {

				C5ChannelRecord cdr = channelCdrs.get(uniqueid);
				if (cdr == null)
					return;

				String[] locations = context.split("-");
				if (locations.length < 3)
					return;
				cdr.setAccount(account);
				cdr.setAsterisk(pbx);
				// cdr.setUniqueid(uniqueid);
				cdr.setChannel(channel);
				cdr.setTimestamp(timestamp);
				cdr.setConnect_type(channelType);
				cdr.setLocation(locations[locations.length - 1]);
				cdr.setLocationId(locations[1]);
				String name = "";
				try {
					name = RuntimeData.getInstance().getAccount(pbx, account)
							.getServicePeer(locations[1]).getDisplayName();
				} catch (Exception e) {
				}
				cdr.setLocationName(Utils.toUnicode(name));
				cdr.setSequence(cdr.getSequence() + 1);
				//cdrLog.finest(cdr.getJsonString());
				notifyChannelCdrNew(cdr);

				C5PeerCallRecord callCdr = peerCallCdrs.get(uniqueid);
				if (callCdr != null) {
					callCdr.setLocation(context);
					callCdr.setLocationId(locations[1]);
					callCdr.setLocationName(name);
				}
			} else if (context.endsWith(Fields.investigate_result)) {
				String channel1 = channel;
				C5Channel c5channel = RuntimeData.getInstance()
						.getPbxViaId(pbx).getChannel(channel1);
				if (c5channel == null) {
					log.warning("Cannot find channel with newexten event: "
							+ event.getJsonString());
				} else {
//					C5Investigate icdr = new C5Investigate();
//					icdr.setSurvey_id(Utils.getUniqueid());
//					icdr.setAccount_id(account);
//					icdr.setAgent_id(c5channel.getVar(Fields.UserID));
//					icdr.setCall_sheet_id(c5channel.getVar(Fields.CallSheetID));
//					icdr.setSurver_content(extension);
//					icdr.setSurvey_time(timestamp);
					C5Investigate icdr = this.setIcdr(account,c5channel,extension,timestamp);
					cdrLog.finest(icdr.getJsonString());
					notifyInvestigateCdrNew(icdr);
				}
			} else if (context.endsWith(Fields.satisfaction_result)) {
				String channel1 = channel;
				C5Channel c5channel = RuntimeData.getInstance()
						.getPbxViaId(pbx).getChannel(channel1);
				if (c5channel == null) {
					log.warning("Cannot find channel with newexten event: "
							+ event.getJsonString());
				} else {
					C5Investigate icdr = this.setIcdr(account,c5channel,extension,timestamp);
					cdrLog.finest(icdr.getJsonString());
					notifyInvestigateCdrNew(this.setIcdr(account,c5channel,extension,timestamp));
				}
			}else if (context.endsWith(Fields.voicemail_start)) {
				if (extension.equals("s"))
					voicemailTimestamp.put(uniqueid, timestamp);
			} else if (context.endsWith(Fields.voicemail_end)) {
				C5PeerCallRecord callCdr = peerCallCdrs.get(uniqueid);
				String beginTime = voicemailTimestamp.remove(uniqueid);
				if (callCdr != null) {
					callCdr.setBegin_time(beginTime);
					callCdr.setEnd_time(timestamp);

					callCdr.setChannelState(Fields.Unlink);
					callCdr.setStatus(Fields.voicemail);
					// callCdr.setLocation(context);
					callCdr.setOpType(C5PeerCallRecord.update);
					// String name = "";
					// try{
					// String[] locations = context.split("-");
					// name = RuntimeData.getInstance().getAccount(pbx,
					// account).getServicePeer(locations[1]).getDisplayName();
					// } catch (Exception e) {}
//					callCdr.setDisposal_agent("");
					cdrLog.finest(callCdr.getJsonString());
					notifyPeerCallCdrUpdate(callCdr);
				}
			} else if (context.endsWith("dialpbx")) {
				peerCallCdrs.remove(uniqueid);
				channelCdrs.remove(uniqueid);
			}else if (context.endsWith("dialout")) {
				String channel1 = channel;
				C5Channel c5channel = RuntimeData.getInstance()
						.getPbxViaId(pbx).getChannel(channel1);
				if (c5channel != null) {
					if(c5channel.getVar("calledPhone") != null){
						C5PeerCallRecord callCdr = peerCallCdrs.get(uniqueid);
						callCdr.setCalled_no(c5channel.getVar("calledPhone"));
					}
				}
			}
			if (event.getStringValue(Fields.Application).equalsIgnoreCase("Set")) {
				if(event.getStringValue(Fields.AppData) != null){
					String[] appData = event.getStringValue(Fields.AppData).split("=", 2);
					String key = appData[0];
					String value = appData[1].replaceAll("\"", "");
					if(key.equals(Fields.DisposalAgent)){
						String channel1 = channel;
						C5Channel c5channel = RuntimeData.getInstance().getPbxViaId(pbx).getChannel(channel1);
						if (c5channel != null) {
							C5PeerCallRecord callCdr = peerCallCdrs.get(uniqueid);
							callCdr.setDisposal_agent(value);
						}
					}	
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	private C5Investigate setIcdr(String accId,C5Channel channel,
									String content,String time){
		C5Investigate icdr = new C5Investigate();
		icdr.setSurvey_id(Utils.getUniqueid());
		icdr.setAccount_id(accId);
		icdr.setAgent_id(channel.getVar(Fields.UserID));
		icdr.setCall_sheet_id(channel.getVar(Fields.CallSheetID));
		icdr.setSurver_content(content);
		icdr.setSurvey_time(time);
		icdr.setPbx(channel.getPbx());
		return icdr;
	}

	private String getRecordFileName(String file, String pbx) {
		if (file == null) {
			return null;
		}
		String date = file.substring(0, file.indexOf('-'));
		return "monitor/" + pbx + "/" + date + "/" + file
				+ C5CallRecord.record_format;
	}

	public void queueCallerAbandon(C5Event event) {

	}

	public void queueJoin(C5QueueEntry event) {
	}

	public void queueLeave(C5QueueEntry event) {
	}

	public void queueMemberAdded(C5QueueMember event) {
	}

	public void queueMemberPaused(C5QueueMember event) {
	}

	public void queueMemberRemoved(C5QueueMember event) {
	}

	private void notifyInvestigateCdrNew(C5Investigate cdr) {
		synchronized (listeners) {
			for (int i = 0; i < listeners.size(); i++)
				try {
					listeners.get(i).investigateNew(cdr);
				} catch (Exception e) {
					log.log(Level.WARNING, e.getMessage(), e);
				}
		}
	}

	private void notifyChannelCdrNew(C5ChannelRecord cdr) {
		synchronized (listeners) {
			for (int i = 0; i < listeners.size(); i++)
				try {
					listeners.get(i).channelCdrNew(cdr);
				} catch (Exception e) {
					log.log(Level.WARNING, e.getMessage(), e);
				}
		}
	}

	private void notifyPeerCallCdrNew(C5PeerCallRecord cdr) {
		synchronized (listeners) {
			for (int i = 0; i < listeners.size(); i++)
				try {
					listeners.get(i).peerCallCdrNew(cdr);
				} catch (Exception e) {
					log.log(Level.WARNING, e.getMessage(), e);
				}
		}
	}

	private void notifyPeerCallCdrUpdate(C5PeerCallRecord cdr) {
		synchronized (listeners) {
			for (int i = 0; i < listeners.size(); i++)
				try {
					listeners.get(i).peerCallCdrUpdate(cdr);
				} catch (Exception e) {
					log.log(Level.WARNING, e.getMessage(), e);
				}
		}
	}

	private void notifyPeerCdrNew(C5PeerRecord cdr) {
		synchronized (listeners) {
			for (int i = 0; i < listeners.size(); i++)
				try {
					listeners.get(i).peerCdrNew(cdr);
				} catch (Exception e) {
					log.log(Level.WARNING, e.getMessage(), e);
				}
		}
	}

	private void notifyPeerCdrUpdate(C5PeerRecord cdr) {
		synchronized (listeners) {
			for (int i = 0; i < listeners.size(); i++)
				try {
					listeners.get(i).peerCdrUpdate(cdr);
				} catch (Exception e) {
					log.log(Level.WARNING, e.getMessage(), e);
				}
		}
	}
	
	private void nofityBatchDialoutCdrNew(C5BatchDialoutRecord cdr){
		synchronized (listeners) {
			for (int i = 0; i < listeners.size(); i++)
				try {
					listeners.get(i).batchDialoutCdrNew(cdr);
				} catch (Exception e) {
					log.log(Level.WARNING, e.getMessage(), e);
				}
		}
	}

	// private void notifyQueueEntryCdrNew(C5QueueEntryRecord cdr) {
	// synchronized (listeners) {
	// for (int i = 0; i < listeners.size(); i++)
	// try {
	// listeners.get(i).queueEntryCdrNew(cdr);
	// } catch (Exception e) {
	// log.log(Level.WARNING, e.getMessage(), e);
	// }
	// }
	// }

	// private void notifyQueueMemberCdrNew(C5QueueMemberRecord cdr) {
	// synchronized (listeners) {
	// for (int i = 0; i < listeners.size(); i++)
	// try {
	// listeners.get(i).queueMemberCdrNew(cdr);
	// } catch (Exception e) {
	// log.log(Level.WARNING, e.getMessage(), e);
	// }
	// }
	// }

	public void addCdrListener(CdrListener listener) {
		if (destructing)
			return;
		if (listeners.contains(listener))
			return;
		synchronized (listeners) {
			listeners.add(listener);
		}
	}

	public void removeCdrListener(CdrListener listener) {
		if (destructing)
			return;
		if (!listeners.contains(listener))
			return;
		synchronized (listeners) {
			listeners.remove(listener);
		}
	}

	@Override
	public void phoneRegister(C5Event event) {
		if (destructing)
			return;
		try {
			String exten = event.getStringValue(Fields.Exten);
			if (peerRegisters.containsKey(exten))
				return;
			C5PeerRecord peerRegister = new C5PeerRecord(C5PeerRecord.register);
			peerRegisters.put(exten, peerRegister);
			peerRegister.setOpType(C5PeerRecord.insert);
			peerRegister.setExten(exten);
			peerRegister.setAsterisk(pbx);
			server.savePeerCdr(peerRegister);
			this.notifyPeerCdrNew(peerRegister);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void phoneUnregister(C5Event event) {
		if (destructing)
			return;
		try {
			String exten = event.getStringValue(Fields.Exten);
			C5PeerRecord peerRegister = null;
			if (peerRegisters.containsKey(exten)) {
				peerRegister = peerRegisters.remove(exten);
				peerRegister.setEnd_time(Utils.getCurrentTimestamp());
				peerRegister.setOpType(C5PeerRecord.update);
				peerRegister.setExten(exten);
				peerRegister.setAsterisk(pbx);
				server.updatePeerCdr(peerRegister);
				notifyPeerCdrUpdate(peerRegister);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void SipRemoved(C5Event event) {
	}

	@Override
	public void queueParams(C5Event event) {
	}

	@Override
	public void queueRemoved(C5Event event) {
	}

	@Override
	public void userAdded(User event) {
	}

	@Override
	public void userBusy(User event) {
		if (destructing)
			return;
		try {
			String userId = event.getId();
			String user = event.getUser();
			if (user.startsWith("admin"))
				return;
			synchronized (peerBusys) {
				if (peerBusys.containsKey(userId)) {
					C5PeerRecord peerBusy = peerBusys.remove(userId);
					peerBusy.setEnd_time(Utils.getCurrentTimestamp());
					peerBusy.setOpType(C5PeerRecord.update);
					server.updatePeerCdr(peerBusy);
					cdrLog.fine(peerBusy.getJsonString());
					this.notifyPeerCdrUpdate(peerBusy);
				}

				C5PeerRecord peerBusy = new C5PeerRecord(C5PeerRecord.busy);
				peerBusy.setAsterisk(pbx);
				peerBusy.setAccount(event.getAccount());
				peerBusy.setExten(event.getExten());
				peerBusy.setExtenType(event.getExtenType());
				peerBusy.setAgent(userId);
				peerBusy.setUserID(user);
				// add by yweili
				peerBusy.setBusyType(event.getBusyType());
				peerBusys.put(userId, peerBusy);
				cdrLog.fine(peerBusy.getJsonString());
				this.notifyPeerCdrNew(peerBusy);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void userLogin(User event) {
		if (destructing)
			return;
		try {
			String userId = event.getId();
			String user = event.getUser();
			if (user.startsWith("admin"))
				return;
			if (peerLogins.containsKey(userId))
				return;
			C5PeerRecord peerLogin = new C5PeerRecord(C5PeerRecord.login);
			peerLogin.setAsterisk(event.getPbx());
			peerLogin.setAccount(event.getAccount());
			peerLogin.setExten(event.getExten());
			peerLogin.setExtenType(event.getExtenType());
			peerLogin.setAgent(userId);
			peerLogin.setUserID(user);
			synchronized (peerLogins) {
				peerLogins.put(userId, peerLogin);
			}
			server.savePeerCdr(peerLogin);
			cdrLog.fine(peerLogin.getJsonString());
			this.notifyPeerCdrNew(peerLogin);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}

	}

	@Override
	public void userLogoff(User event) {
		if (destructing)
			return;
		try {
			String userId = event.getId();
			String user = event.getUser();
			if (user.startsWith("admin"))
				return;
			synchronized (peerBusys) {
				if (peerBusys.containsKey(userId)) {
					C5PeerRecord peerBusy = peerBusys.remove(userId);
					peerBusy.setEnd_time(Utils.getCurrentTimestamp());
					peerBusy.setOpType(C5PeerRecord.update);
					server.updatePeerCdr(peerBusy);
					cdrLog.fine(peerBusy.getJsonString());
					this.notifyPeerCdrUpdate(peerBusy);
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}

		try {
			String userId = event.getId();
			synchronized (peerLogins) {
				C5PeerRecord peerLogin = null;
				if (peerLogins.containsKey(userId)) {
					peerLogin = peerLogins.remove(userId);
					peerLogin.setEnd_time(Utils.getCurrentTimestamp());
					peerLogin.setOpType(C5PeerRecord.update);
					String comments = null;
					if (event.getLogoffComments() != null)
						comments = event.getLogoffComments();
					peerLogin.setComments(comments);
					server.updatePeerCdr(peerLogin);
					cdrLog.fine(peerLogin.getJsonString());
					notifyPeerCdrUpdate(peerLogin);
				} else {
					log.warning("Get logoff event when there is no login record, this should"
							+ " nerver happen: \r\n" + event.getId());
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void userRemoved(User event) {
	}

	@Override
	public void userStatus(User event) {
	}

	@Override
	public void userUnbusy(User event) {
		if (destructing)
			return;
		try {
			String userId = event.getId();
			String user = event.getUser();
			if (user.startsWith("admin"))
				return;
			synchronized (peerBusys) {
				if (peerBusys.containsKey(userId)) {
					C5PeerRecord peerBusy = peerBusys.remove(userId);
					peerBusy.setEnd_time(Utils.getCurrentTimestamp());
					peerBusy.setOpType(C5PeerRecord.update);
					server.updatePeerCdr(peerBusy);
					cdrLog.fine(peerBusy.getJsonString());
					this.notifyPeerCdrUpdate(peerBusy);
				} else {
					log.warning("Get unbusy event when there is no busy record, this should"
							+ " nerver happen: \r\n" + event.getId());
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void phoneUpdate(C5Event event) {
	}

	@Override
	public void queueComplete(C5Event event) {
	}

	@Override
	public void queueConnect(C5Event event) {
	}

	@Override
	public void queueAgentCalled(C5Event event) {
	}

	@Override
	public void newEvent(C5Event event) {
	}

	@Override
	public void userCallsUpdate(User user) {
	}

	@Override
	public void userSignIn(User user) {

	}

	@Override
	public void userSignOut(User user) {
	}

	@Override
	public void batchDialoutDialed(C5Event event) {
		if (destructing)
			return;
		
		try {
			if (event.getParameters().containsKey(Fields.DialState)) {
				String account = event.getStringValue(Fields.Account);
				String customerId = event.getStringValue(Fields.CustomerID);
				String dialState = event.getStringValue(Fields.DialState);
				String pbx = event.getStringValue(Fields.PBX);
				C5BatchDialoutRecord batchDialoutRecord = new C5BatchDialoutRecord(
						pbx, account, customerId, dialState);
				this.nofityBatchDialoutCdrNew(batchDialoutRecord);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void batchDialoutDialing(C5Event event) {

	}

	@Override
	public void batchDialoutError(C5Event event) {

	}

	@Override
	public void batchDialoutFinish(C5Event event) {

	}
	
	@Override
	public void OriginateResponse(C5Event event) {
		try {
			String actionID = event.getStringValue(Fields.ActionID);
			String uniqueid = event.getStringValue(Fields.Uniqueid);
			String timestamp = event.getStringValue(Fields.Timestamp);
			String reason = event.getStringValue(Fields.Reason);
//			String callerID = event.getStringValue(Fields.CallerID);
			if(actionID.startsWith("auto")){
				String[] a = actionID.split(",");
				String accountId = a[1];
				String calledNo = a[2];
				String _id = a[3];
				C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(this.pbx);
				C5Account account = pbx.getAccount(accountId);
				String taskIdAndNumType = account.getAutoCallUniqueidTaskIdMap().get(_id);
				account.getAutoCallUniqueidTaskIdMap().remove(_id);
				C5Event autoCall = new C5Event("AutoCall");
				autoCall.addParameter(Fields.PBX, this.pbx);
				autoCall.addParameter(Fields.Account, accountId);
				autoCall.addParameter(Fields.CalledNo, calledNo);
				autoCall.addParameter("_id", _id);
				autoCall.addParameter(Fields.BeginTime, timestamp);
				autoCall.addParameter(Fields.Reason, reason);
				if(taskIdAndNumType != null){
					autoCall.addParameter(Fields.TaskId, taskIdAndNumType.split(",")[0]);
					autoCall.addParameter(Fields.NumType, taskIdAndNumType.split(",")[1]);
				}
				CallNumberInfo numberInfo = ASConfig.getInstance()
						.getNumberInfoViaNumber(calledNo);
				if (numberInfo != null) {
					District d = ASConfig.getInstance().getDistrictViaCode(numberInfo.getDistrictNo());
					if(d != null){
						autoCall.addParameter(Fields.District, d.getName());
						autoCall.addParameter(Fields.DistrictCode, d.getCode());
						Province p = ASConfig.getInstance().getProvinceViaCode(d.getProvinceCode());
						if(p != null){
							autoCall.addParameter(Fields.Province, p.getName());
						}
					}
				}
				if(event.getStringValue(Fields.Response).equals("Success") 
						&& reason.equals("4")){
					account.getAutoCalls().add(uniqueid);
					autoCalls.put(uniqueid, autoCall);
				} else {
					notifyAutoCall(autoCall);
				}
				account.getAutoCalls().remove(actionID);
			}else if(actionID.startsWith("CdrVar")){
				if(event.getStringValue(Fields.Response).equals("Success") 
						&& reason.equals("4")){
					String channelName = event.getStringValue(Fields.Channel);
					C5Pbx pbx = RuntimeData.getInstance().getPbxViaId(this.pbx);
					C5Channel channel = pbx.getChannel(channelName);
					channel.addVar(Fields.CdrVar, actionID.substring(7));
					channel.addC5Var(Fields.CdrVar, actionID.substring(7));
				}
			}
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	private void notifyAutoCall(C5Event cdr) {
		synchronized (listeners) {
			for (int i = 0; i < listeners.size(); i++)
				try {
					listeners.get(i).autoCall(cdr);
				} catch (Exception e) {
					log.log(Level.WARNING, e.getMessage(), e);
				}
		}
	}
}
