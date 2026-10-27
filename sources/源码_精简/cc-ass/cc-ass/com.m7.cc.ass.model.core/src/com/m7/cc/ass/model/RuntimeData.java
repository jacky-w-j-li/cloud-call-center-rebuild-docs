package com.m7.cc.ass.model;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Vector;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.config.CallInRouteTask;
import com.m7.cc.ass.config.CallNumberInfoTask;
import com.m7.cc.ass.model.configuration.Announcement;
import com.m7.cc.ass.model.configuration.AssignmentNode;
import com.m7.cc.ass.model.configuration.BlackList;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.DialJobNumNode;
import com.m7.cc.ass.model.configuration.DialLine;
import com.m7.cc.ass.model.configuration.DialextenNode;
import com.m7.cc.ass.model.configuration.DynamicRouteNode;
import com.m7.cc.ass.model.configuration.EncryptMD5;
import com.m7.cc.ass.model.configuration.ExtensionPeer;
import com.m7.cc.ass.model.configuration.IVR;
import com.m7.cc.ass.model.configuration.IvrMenu;
import com.m7.cc.ass.model.configuration.IvrValidateNode;
import com.m7.cc.ass.model.configuration.MailAddr;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.RedList;
import com.m7.cc.ass.model.configuration.Room;
import com.m7.cc.ass.model.configuration.Satisfaction;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.SuperDialJobNum;
import com.m7.cc.ass.model.configuration.SwitchBoard;
import com.m7.cc.ass.model.configuration.TextAnnouncement;
import com.m7.cc.ass.model.configuration.TimeCondition;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.model.configuration.Validation;
import com.m7.cc.ass.model.configuration.Voicemail;
import com.m7.cc.ass.model.configuration.WebchatAddr;
import com.m7.cc.ass.model.configuration.WeixinAddr;
import com.m7.cc.asterisk.ami.action.QueueRemove;
import com.m7.cc.configuration.service.ACSStorage;
import com.m7.cc.util.Utils;

public class RuntimeData {

	private Hashtable<String, C5Pbx> pbxs = new Hashtable<String, C5Pbx>();

	protected static ModelTimer timer = new ModelTimer("Model Timer");
	public static WebcallTimer webcallTimer = new WebcallTimer("webcall timer");

	private C5EventInterfaces eventInterfaces; // Aman zhai. 2010.05.14

	private static RuntimeData instance = null;
	private C5LisenceTask lisenceTask = new C5LisenceTask();
	
	private Hashtable<String, String> DispatcherResendMap = new Hashtable<String, String>();
	private Hashtable<String, String> DispatcherAccAndIdMap = new Hashtable<String, String>();
	private Hashtable<String, String> ChannelCdrRecordMap = new Hashtable<String, String>();
	private Hashtable<String, Hashtable<String, String>> webcallChatingIvrPromptCallIDMap = new Hashtable<String, Hashtable<String, String>>();

	private Hashtable<String, HashMap<String, String>> NumCallToManyACCLimit = new Hashtable<String, HashMap<String, String>>();
	private Hashtable<String, String> NumCallToManyLimit = new Hashtable<String, String>();
	
	private RuntimeData() {
		instance = this;
		eventInterfaces = new C5EventInterfaces(); // Aman zhai. 2010.05.14
		RuntimeData.timer.schedule(lisenceTask, 3599000, 3599000);
		Calendar c = Calendar.getInstance();
		c.set(Calendar.DATE, c.get(Calendar.DATE)+1);
		c.set(Calendar.HOUR_OF_DAY, 2);
		c.set(Calendar.MINUTE, 0);
		c.set(Calendar.SECOND, 0);
		RuntimeData.timer.schedule(new CallNumberInfoTask(), c.getTime(), 24 * 3599000);
		RuntimeData.timer.schedule(new CallInRouteTask(), c.getTime(), 24 * 3599000);
		//to delete monitor
		RuntimeData.timer.schedule(new DelMonitorTimeTask(), 60000, 60000);
		RuntimeData.timer.schedule(new LimitTimeTask(), 60000, 60000);
		//record didi channels count
		if(ASConfig.getInstance().getVar("didi.count.channels") != null){
			if(ASConfig.getInstance().getVar("didi.count.channels").equals("yes")){
				RuntimeData.timer.schedule(new DidiChannelsCountTask(), new Date(), 60000);
			}
		}
		//record account channels count
		if(ASConfig.getInstance().getVar("account.count.channels") != null){
			if(!ASConfig.getInstance().getVar("account.count.channels").equals("no")){
				String account = ASConfig.getInstance().getVar("account.count.channels");
				if (account.indexOf(",") != -1) {
					String[] accounts = account.split(",");
					for (int i =0; i < accounts.length; i++) {
						RuntimeData.timer.schedule(new AccountChannelsCountTask(accounts[i]), new Date(), 60000);
					}
				} else {
					RuntimeData.timer.schedule(new AccountChannelsCountTask(account), new Date(), 60000);
				}
				
			}
		}
	}

	public static RuntimeData getInstance() {
		if (instance == null)
			new RuntimeData();
		return instance;
	}

	public void close() {
		try {
			lisenceTask.cancel();
			timer.cancel();
			pbxs.clear();
			eventInterfaces.clear();
			webcallTimer.cancel();
		} catch (Throwable e) {

		}
	}

	// Aman zhai. 2010.05.14
	public void loadC5EventInterfaces() {
		this.eventInterfaces.setEventInterfaces(ACSStorage
				.loadEventInterfaces());
	}

	public void addPbx(String pbx) {
		synchronized (pbxs) {
			C5Pbx c5pbx = new C5Pbx(pbx, ACSStorage.loadAccounts(pbx));
			pbxs.put(pbx, c5pbx);
		}
	}
	
	public boolean isAccountExist(String pbx, String accountID) throws Exception{
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		return c5pbx.getAccount(accountID) != null;
	}

	public C5Account getAccount(String pbxID, String accountID) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbxID);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbxID);
		}
		C5Account account = c5pbx.getAccount(accountID);
		if (account == null) {
			throw new Exception("Account not found: " + accountID);
		}
		return account;
	}

	public C5Pbx getPbxViaId(String pbx) {
		return pbxs.get(pbx);
	}

	public Vector<C5Account> getAccount(String account) {
		Vector<C5Account> accounts = new Vector<C5Account>();
		synchronized (pbxs) {
			Iterator<C5Pbx> ps = pbxs.values().iterator();
			while (ps.hasNext()) {
				C5Pbx pbx = ps.next();
				if (pbx.containAccount(account))
					accounts.add(pbx.getAccount(account));
			}
		}
		return accounts;
	}
	
	public C5Account getAccountViaName(String name) {
		synchronized (pbxs) {
			Iterator<C5Pbx> ps = pbxs.values().iterator();
			while (ps.hasNext()) {
				C5Pbx pbx = ps.next();
				C5Account account = pbx.getAccountViaName(name);
				if(account != null)
					return account;
			}
			return null;
		}
	}
	
	public C5Account getAccountViaNameByUser(String name,String agentName) {
		synchronized (pbxs) {
			Iterator<C5Pbx> ps = pbxs.values().iterator();
			while (ps.hasNext()) {
				C5Pbx pbx = ps.next();
				C5Account account = pbx.getAccountViaName(name);
				if(account != null){
					if(account.getUserViaName(agentName) != null){
						return account;						
					}
				}
			}
			return null;
		}
	}

	public boolean addAccount(String pbx, String accountId,
			Hashtable<String, Object> extenFields) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		if (c5pbx.containAccount(accountId))
			throw new Exception("This account [" + accountId
					+ "] has already exist.");
		else { // Aman zhai. 2010.05.11
			c5pbx.addAccount(accountId, extenFields);
		}
		return true;
	}

	// Aman zhai. 2010.05.12
	public boolean updateExtenAccount(String pbx, String accountId,
			Hashtable<String, Object> extenFields) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}

		if (!c5pbx.containAccount(accountId))
			return false;
		else {
			c5pbx.updateExtenAccount(accountId, extenFields);
		}
		return true;
	}

	public boolean removeExtenAccount(String pbx, String accountId,
			Vector<String> extenFields) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}

		if (!c5pbx.containAccount(accountId))
			return false;
		else {
			c5pbx.removeExtenAccount(accountId, extenFields);
		}
		return true;
	}

	public boolean addEventInterface(String pbx, String accountId,
			EventInterface eventInterface) throws Exception {
		boolean result = false;
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}

		if (!c5pbx.containAccount(accountId))
			return false;
		else {
			C5EventInterfaces _eventInterfaces = getEventInterfaces();
			result = _eventInterfaces.addEventInterface(eventInterface);
		}
		return result;
	}

	private C5EventInterfaces getEventInterfaces() {
		// TODO Aman zhai. 2010.05.14 Auto-generated method stub
		return eventInterfaces;
	}

	public boolean updateEventInterface(String pbx, String accountId,
			EventInterface eventInterface) throws Exception {
		boolean result = false;
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}

		if (!c5pbx.containAccount(accountId))
			return false;
		else {
			C5EventInterfaces _eventInterfaces = getEventInterfaces();
			result = _eventInterfaces.updateEventInterface(eventInterface);
		}
		return result;
	}

	public boolean removeEventInterface(String pbx, String accountId,
			String name) throws Exception {
		boolean result = false;
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}

		if (!c5pbx.containAccount(accountId))
			return false;
		else {
			C5EventInterfaces _eventInterfaces = getEventInterfaces();
			result = _eventInterfaces
					.removeEventInterface(pbx, accountId, name);
		}
		return result;
	}

	public boolean addSatisfaction(String pbx, String accountID,
			Vector<Satisfaction> satisfactions) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addSatisfaction(satisfactions);
		return true;
	}
	
	public boolean addAnnouncement(String pbx, String accountID,
			Vector<Announcement> announcements) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addAnnouncement(announcements);
		return true;
	}

	public boolean addBlacklist(String pbx, String accountID,
			Vector<BlackList> list) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addBlacklist(list);
		return true;
	}

	public boolean addQueue(String pbx, String accountID, C5Queue queue)
			throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.addQueue(accountID, queue);
		c5pbx.reloadQueue();
		return true;
	}

	public boolean addServiceNo(String pbx, String accountID,
			ServiceNo serviceNo) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.addServiceNo(accountID, serviceNo);
		return true;
	}

	public boolean addSipPeer(String pbx, String accountID, SipPeer peer)
			throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.addSipPeer(accountID, peer);
		return true;
	}
	
	public boolean bindSipPeer(String pbx, String accountID, SipPeer peer,
			String[] userIDs) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.bindSipPeer(accountID, peer, userIDs);
		return true;
	}
	
	public boolean unbindSipPeer(String pbx, String accountID, SipPeer peer,
			String[] userIDs) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.unbindSipPeer(accountID, peer, userIDs);
		return true;
	}

	public boolean addHoldMusic(String pbx, String accountID, String holdMusic)
			throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.addHoldMusic(accountID, holdMusic);
		return true;
	}

	public boolean removeHoldMusic(String pbx, String accountID,
			String holdMusic) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.removeHoldMusic(accountID, holdMusic);
		return true;
	}

	public boolean removeAccount(String pbx, String accountId) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			return true;
		}
		if (!c5pbx.containAccount(accountId))
			return false;
		else {
			c5pbx.removeAccount(accountId);
		}
		return true;
	}
//---------------
	public boolean removeSatisfaction(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeSatisfactions(extens);
		return true;
	}
	
	public boolean removeSuperDialJobNum(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeSuperDialJobNum(extens);
		return true;
	}
	
	public boolean removeIvrMenu(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeIvrMenus(extens);
		return true;
	}
	public boolean removeAnnouncement(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeAnnouncements(extens);
		return true;
	}

	public boolean removeBlacklist(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		if (account == null)
			return true;
		account.removeBlackList(extens);
		return true;
	}

	public boolean removePeer(String pbx, String accountID,
			Vector<String> _peers) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		//Remove sip peer from queues of this account
		AMIClient amiClient = AMICore.getInstance().getAMIClient(pbx);
		List<String> queues = c5pbx.getAccount(accountID).getQueueExtens();
		if(queues != null && queues.size() > 0) {
			for(int i=0;i<_peers.size();i++) {
				String sipNo = _peers.get(i);
				for (int j = 0; j < queues.size(); j++) {
					QueueRemove queueRemove = new QueueRemove(queues.get(j),
							"SIP/" + sipNo, Utils.getSynActionID("SipRemove"));
					amiClient.sendAction(queueRemove);
				}
			}
		}
		c5pbx.removeSipPeer(accountID, _peers);
		c5pbx.reloadSip();
		return true;
	}

	public boolean removeQueue(String pbx, String accountID,
			Vector<String> _queues) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.removeQueue(accountID, _queues);
		c5pbx.reloadQueue();
		return true;
	}
	
	public boolean removeMailQueue(String pbx, String accountID,
			Vector<String> _mqueues) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.removeMailQueue(accountID, _mqueues);
		return true;
	}

	public boolean removeServiceNo(String pbx, String accountID,
			Vector<String> serviceNos) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.removeServiceNo(accountID, serviceNos);
		return true;
	}
	
	public boolean removeMailAddr(String pbx, String accountID,
			Vector<String> mailAddrs) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.removeMailAddr(accountID, mailAddrs);
		return true;
	}
	
	public boolean removeWeixinAddr(String pbx, String accountID,
			Vector<String> weixinAddrs) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.removeWeixinAddr(accountID, weixinAddrs);
		return true;
	}
	
	public boolean removeWebchatAddr(String pbx, String accountID,
			Vector<String> webchatAddrs) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.removeWebchatAddr(accountID, webchatAddrs);
		return true;
	}

	public boolean removeUser(String pbx, String accountID,
			Vector<String> _users) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeUser(_users);
		return true;
	}

	public boolean updateSatisfaction(String pbx, String accountID,
			Vector<Satisfaction> satisfactions) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateSatisfaction(satisfactions);
		return true;
	}
	
	public boolean updateSuperDialJobNum(String pbx, String accountID,
			Vector<SuperDialJobNum> superDialJobNums) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateSuperDialJobNum(superDialJobNums);
		return true;
	}
	
	public boolean updateIvrMenu(String pbx, String accountID,
			Vector<IvrMenu> IvrMenus) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateIvrMenu(IvrMenus);
		return true;
	}

	public boolean updateAnnouncement(String pbx, String accountID,
			Vector<Announcement> announcements) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateAnnouncement(announcements);
		return true;
	}

	public void updateSwitchBoard(String pbx, String accountID,
			SwitchBoard switchBoard) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateSwitchBoard(pbx, accountID, switchBoard);
	}

	public boolean updateBlacklist(String pbx, String accountID,
			Vector<BlackList> list) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateBlackList(list);
		return true;
	}
	
	public boolean updateRedlist(String pbx, String accountID,
			RedList redList) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateRedList(redList);
		return true;
	}

	public boolean updateQueue(String pbx, String accountID, C5Queue queue)
			throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.updateQueue(accountID, queue);
		c5pbx.reloadQueue();
		return true;
	}

	public boolean updateMailQueue(String pbx, String accountID, MailQueue mqueue)
			throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.updateMailQueue(accountID, mqueue);
		return true;
	}
	
	public boolean updateMailAddr(String pbx, String accountID,
			MailAddr mailAddr) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.updateMailAddr(accountID, mailAddr);
		return true;
	}
	
	public boolean updateWeixinAddr(String pbx, String accountID,
			WeixinAddr weixinAddr) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.updateWeixinAddr(accountID, weixinAddr);
		return true;
	}
	
	public boolean updateWebchatAddr(String pbx, String accountID,
			WebchatAddr webchatAddr) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.updateWebchatAddr(accountID, webchatAddr);
		return true;
	}
	
	public boolean updateServiceNo(String pbx, String accountID,
			ServiceNo serviceNo) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.updateServiceNo(accountID, serviceNo);
		return true;
	}

	public boolean updateUser(String pbx, String accountID, Vector<User> _users)
			throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateUser(_users);
		return true;
	}
	
	public boolean addRoom(String pbx, String accountID, Room room)
			throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addRoom(room);
		return true;
	}
	
	public boolean addEncryptMD5(String pbx, String accountID,
			EncryptMD5 encryptMD5) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addEncryptMD5(encryptMD5);
		return true;
	}
	
	public boolean addTextAnnouncement(String pbx, String accountID,
			TextAnnouncement textAnnouncement) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addTextAnnouncement(textAnnouncement);
		return true;
	}

	public boolean addTimeCondition(String pbx, String accountID,
			Vector<TimeCondition> timeConditions) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addTimeCondition(timeConditions);
		return true;
	}

	public boolean removeTimeCondition(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeTimeCondition(extens);
		return true;
	}

	public boolean updateTimeCondition(String pbx, String accountID,
			Vector<TimeCondition> timeConditions) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateTimeCondition(timeConditions);
		return true;
	}
	
	public boolean addAssignmentNodes(String pbx, String accountID, 
			Vector<AssignmentNode> assignmentNodes) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addAssignmentNodes(assignmentNodes);
		return true;
	}

	public boolean removeAssignmentNodes(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeAssignmentNodes(extens);
		return true;
	}

	public boolean updateAssignmentNodes(String pbx, String accountID,
			Vector<AssignmentNode> assignmentNodes) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateAssignmentNodes(assignmentNodes);
		return true;
	}
	
	public boolean addDialJobNumNodes(String pbx, String accountID, 
			Vector<DialJobNumNode> dialJobNumNodes) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addDialJobNumNodes(dialJobNumNodes);
		return true;
	}

	public boolean removeDialJobNumNodes(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeDialJobNumNodes(extens);
		return true;
	}

	public boolean updateDialJobNumNodes(String pbx, String accountID,
			Vector<DialJobNumNode> dialJobNumNodes) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateDialJobNumNodes(dialJobNumNodes);
		return true;
	}
	
	//add by chenguang2012-11-8
	public boolean addIvrValidateNodes(String pbx, String accountID, 
			Vector<IvrValidateNode> ivrValidateNodes) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addIvrValidateNodes(ivrValidateNodes);
		return true;
	}
	public boolean updateIvrValidateNodes(String pbx, String accountID,
			Vector<IvrValidateNode> ivrValidateNodes) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateIvrValidateNodes(ivrValidateNodes);
		return true;
	}

	
	// Aman zhai. 2010.06.11
	public boolean addDynamicRouteNodes(String pbx, String accountID,
			Vector<DynamicRouteNode> dynamicRouteNodes) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addDynamicRouteNodes(dynamicRouteNodes);
		return true;
	}

	public boolean removeDynamicRouteNodes(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeDynamicRouteNodes(extens);
		return true;
	}

	public boolean updateDynamicRouteNodes(String pbx, String accountID,
			Vector<DynamicRouteNode> dynamicRouteNodes) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateDynamicRouteNodes(dynamicRouteNodes);
		return true;
	}
	// <--
	
	// Aman zhai. 2010.06.09
	public boolean addDialextenNodes(String pbx, String accountID,
			Vector<DialextenNode> dialextenNodes) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addDialextenNodes(dialextenNodes);
		return true;
	}

	public boolean removeDialextenNodes(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeDialextenNodes(extens);
		return true;
	}

	public boolean updateDialextenNodes(String pbx, String accountID,
			Vector<DialextenNode> dialextenNodes) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateDialextenNodes(dialextenNodes);
		return true;
	}

	// <--

	public boolean addIVR(String pbx, String accountID, Vector<IVR> ivrs)
			throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addIVR(ivrs);
		return true;
	}

	public boolean removeIVR(String pbx, String accountID, Vector<String> extens)
			throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeIVR(extens);
		return true;
	}

	public boolean updateIVR(String pbx, String accountID, Vector<IVR> ivrs)
			throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateIVR(ivrs);
		return true;
	}

	public boolean deleteMusicFile(String pbx, String accountID, String file)
			throws Exception {
		return false;
	}

	public boolean uploadMuiscFile(String pbx, String accountID, String file)
			throws Exception {
		return false;
	}

	public boolean effectAll(String pbx, String account) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.effectAll(account);
		return true;
	}

	public boolean activeAccount(String pbx, String accountId) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.activeAccount(accountId, true);
		return true;
	}

	public boolean freezeAccount(String pbx, String accountId) throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.activeAccount(accountId, false);
		return true;
	}

	public boolean setDialoutLine(String pbx, String accountId, DialLine line)
			throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.updateDialoutLine(accountId, line);
		return true;
	}

	public void setInvestigateMusic(String pbx, String accountId, String file)
			throws Exception {
		C5Account account = getAccount(pbx, accountId);
		account.setInvestigateMusic(file);
	}

	public boolean setXferLine(String pbx, String accountId, DialLine line)
			throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.updateXferLine(accountId, line);
		return true;
	}

	public ServiceNo[] getServiceNos(String pbx, String accountID)
			throws Exception {
		C5Account account = getAccount(pbx, accountID);
		return account.getServiceNoArray();
	}

	public ServiceNo getServiceNo(String pbx, String exten) throws Exception {
		C5Pbx c5pbx = this.getPbxViaId(pbx);
		if (c5pbx != null) {
			return c5pbx.getServiceNo(exten);
		} else
			throw new Exception("PBX [" + pbx + "] not found");
	}
	
	public MailAddr getMailAddr(String pbx, String exten) throws Exception {
		C5Pbx c5pbx = this.getPbxViaId(pbx);
		if (c5pbx != null) {
			return c5pbx.getMailAddr(exten);
		} else
			throw new Exception("PBX [" + pbx + "] not found");
	}

	public WeixinAddr getWeixinAddr(String pbx, String exten) throws Exception {
		C5Pbx c5pbx = this.getPbxViaId(pbx);
		if (c5pbx != null) {
			return c5pbx.getWeixinAddr(exten);
		} else
			throw new Exception("PBX [" + pbx + "] not found");
	}
	
	public WebchatAddr getWebchatAddr(String pbx, String exten) throws Exception {
		C5Pbx c5pbx = this.getPbxViaId(pbx);
		if (c5pbx != null) {
			return c5pbx.getWebchatAddr(exten);
		} else
			throw new Exception("PBX [" + pbx + "] not found");
	}

	public List<String> getAccounts(String pbx) throws Exception {
		C5Pbx c5pbx = this.getPbxViaId(pbx);
		if (c5pbx != null) {
			return c5pbx.getAccountNameList();
		} else
			throw new Exception("PBX [" + pbx + "] not found");
	}

	public Hashtable<String, Announcement> getAnnouncements(String pbx,
			String accountID) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		return account.getAnnouncements();
	}

	public Hashtable<String, BlackList> getBlackLists(String pbx,
			String accountID) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		return account.getBlackLists();
	}

	public Hashtable<String, IVR> getIVR(String pbx, String accountID)
			throws Exception {
		C5Account account = getAccount(pbx, accountID);
		return account.getIvrs();
	}

	public Vector<String> getMusicFile(String pbx, String accountID)
			throws Exception {
		// TODO Auto-generated method stub
		return null;
	}

	public Vector<String> getPbxs() throws Exception {
		Vector<String> _pbxs = new Vector<String>();
		Iterator<String> a = pbxs.keySet().iterator();
		while (a.hasNext()) {
			_pbxs.add(a.next());
		}
		return _pbxs;
	}

	public List<C5Pbx> getPbxVos() throws Exception {
		List<C5Pbx> _pbxs = new ArrayList<C5Pbx>();
		Iterator<String> a = pbxs.keySet().iterator();
		while (a.hasNext()) {
			_pbxs.add(pbxs.get(a.next()));
		}
		return _pbxs;
	}
	/**
	 * Get the first pbx of this account
	 * 
	 * @param account
	 * @return
	 */
	public String getPbxViaAccount(String account) {
		Iterator<C5Pbx> a = pbxs.values().iterator();
		while (a.hasNext()) {
			C5Pbx pbx = a.next();
			if (pbx.getAccount(account) != null) {
				return pbx.getPbx();
			}
		}
		return null;
	}

	/**
	 * Get pbxs of this account
	 * 
	 * @param account
	 * @return
	 */
	public List<String> getPbxs(String account) {
		List<String> list = new ArrayList<String>();
		Iterator<C5Pbx> a = pbxs.values().iterator();
		while (a.hasNext()) {
			C5Pbx pbx = a.next();
			if (pbx.getAccount(account) != null) {
				list.add(pbx.getPbx());
			}
		}
		return list;
	}

	public MailQueue getMailQueue(String pbx,String accountId, String exten) throws Exception {
		C5Pbx c5pbx = this.getPbxViaId(pbx);
		if (c5pbx != null) {
			if(c5pbx.getAccount(accountId) != null){
				return c5pbx.getAccount(accountId).getMailQueues().get(exten);				
			}else{
				throw new Exception("PBX [" + pbx + "] not found");
			}
		} else
			throw new Exception("PBX [" + pbx + "] not found");
	}

	public C5Queue getQueue(String pbx, String exten) throws Exception {
		C5Pbx c5pbx = this.getPbxViaId(pbx);
		if (c5pbx != null) {
			return c5pbx.getQueue(exten);
		} else
			throw new Exception("PBX [" + pbx + "] not found");
	}

	public List<String> getQueuesOfUser(String pbx, String accountID,
			String userID) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		return account.getQueuesOfUser(userID);
	}

	public SipPeer getSipPeer(String pbx, String exten) throws Exception {
		C5Pbx c5pbx = this.getPbxViaId(pbx);
		if (c5pbx != null) {
			return c5pbx.getPeer(exten);
		} else
			throw new Exception("PBX [" + pbx + "] not found");
	}

	public Hashtable<String, TimeCondition> getTimeCondition(String pbx,
			String accountID) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		return account.getTimeConditions();
	}

	public Hashtable<String, User> getUsers(String pbx, String accountID)
			throws Exception {
		C5Account account = getAccount(pbx, accountID);
		return account.getUsers();
	}

	public boolean addValidate(String pbx, String accountID,
			Vector<Validation> validations) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addValidations(validations);
		return true;
	}

	public boolean removeValidate(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeValidations(extens);
		return true;
	}

	public boolean updateValidate(String pbx, String accountID,
			Vector<Validation> validations) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateValidations(validations);
		return true;
	}

	public void addVoicemail(String pbx, String accountID, Voicemail voicemail)
			throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addVoicemail(voicemail);
	}

	public void removeVoicemail(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeVoicemails(extens);
	}

	public void addExtensionPeer(String pbx, String accountID, ExtensionPeer ep)
			throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addExtensionPeer(ep);
	}

	public void updateExtensionPeer(String pbx, String accountID,
			ExtensionPeer ep) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.updateExtensionPeer(ep);
	}

	public void removeExtensionPeer(String pbx, String accountID,
			Vector<String> extens) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeExtensionPeer(extens);
	}

	public void effectPeer(String pbx, String accountID, String name)
			throws Exception {
		C5Pbx c5pbx = pbxs.get(pbx);
		if (c5pbx == null) {
			throw new Exception("PBX not found: " + pbx);
		}
		c5pbx.effectPeer(accountID, name);
	}

	public String getUrl(String accountId, String key) {
		return this.eventInterfaces.getUrl(accountId, key);
	}

	public void updateNum(String pbx, String accountID, String type, String num, String oldNum) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.addNum(type, num, oldNum);
	}

	public void removeNum(String pbx, String accountID, Vector<String> extens, String type) throws Exception {
		C5Account account = getAccount(pbx, accountID);
		account.removeNum(extens, type);
	}
	
	public Hashtable<String, String> getDispatcherResendMap() {
		return DispatcherResendMap;
	}

	public void setDispatcherResendMap(Hashtable<String, String> dispatcherResendMap) {
		DispatcherResendMap = dispatcherResendMap;
	}

	public Hashtable<String, HashMap<String, String>> getNumCallToManyACCLimit() {
		return NumCallToManyACCLimit;
	}

	public void setNumCallToManyACCLimit(
			Hashtable<String, HashMap<String, String>> numCallToManyACCLimit) {
		NumCallToManyACCLimit = numCallToManyACCLimit;
	}

	public Hashtable<String, String> getNumCallToManyLimit() {
		return NumCallToManyLimit;
	}

	public void setNumCallToManyLimit(Hashtable<String, String> numCallToManyLimit) {
		NumCallToManyLimit = numCallToManyLimit;
	}

	public Hashtable<String, String> getChannelCdrRecordMap() {
		return ChannelCdrRecordMap;
	}

	public void setChannelCdrRecordMap(Hashtable<String, String> channelCdrRecordMap) {
		ChannelCdrRecordMap = channelCdrRecordMap;
	}

	public Hashtable<String, String> getDispatcherAccAndIdMap() {
		return DispatcherAccAndIdMap;
	}

	public void setDispatcherAccAndIdMap(
			Hashtable<String, String> dispatcherAccAndIdMap) {
		DispatcherAccAndIdMap = dispatcherAccAndIdMap;
	}

	public Hashtable<String, Hashtable<String, String>> getWebcallChatingIvrPromptCallIDMap() {
		return webcallChatingIvrPromptCallIDMap;
	}

	public void setWebcallChatingIvrPromptCallIDMap(
			Hashtable<String, Hashtable<String, String>> webcallChatingIvrPromptCallIDMap) {
		this.webcallChatingIvrPromptCallIDMap = webcallChatingIvrPromptCallIDMap;
	}

	
}
