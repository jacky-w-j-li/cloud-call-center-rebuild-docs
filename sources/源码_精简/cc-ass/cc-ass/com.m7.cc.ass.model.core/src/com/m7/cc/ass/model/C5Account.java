package com.m7.cc.ass.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.configuration.Announcement;
import com.m7.cc.ass.model.configuration.AssignmentNode;
import com.m7.cc.ass.model.configuration.AutoCallTask;
import com.m7.cc.ass.model.configuration.BlackList;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.CallUrl;
import com.m7.cc.ass.model.configuration.TwowayCall;
import com.m7.cc.ass.model.configuration.DialJobNumNode;
import com.m7.cc.ass.model.configuration.DialLine;
import com.m7.cc.ass.model.configuration.DialextenNode;
import com.m7.cc.ass.model.configuration.DynamicRouteNode;
import com.m7.cc.ass.model.configuration.EncryptMD5;
import com.m7.cc.ass.model.configuration.ExtensionPeer;
import com.m7.cc.ass.model.configuration.HoldMusic;
import com.m7.cc.ass.model.configuration.IVR;
import com.m7.cc.ass.model.configuration.IvrMenu;
import com.m7.cc.ass.model.configuration.IvrValidateNode;
import com.m7.cc.ass.model.configuration.MailAddr;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.Music;
import com.m7.cc.ass.model.configuration.PhonebarConfig;
import com.m7.cc.ass.model.configuration.RedList;
import com.m7.cc.ass.model.configuration.Room;
import com.m7.cc.ass.model.configuration.Satisfaction;
import com.m7.cc.ass.model.configuration.SatisfactionOptions;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.SuperDialJobNum;
import com.m7.cc.ass.model.configuration.SwitchBoard;
import com.m7.cc.ass.model.configuration.TextAnnouncement;
import com.m7.cc.ass.model.configuration.TimeCondition;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.model.configuration.Validation;
import com.m7.cc.ass.model.configuration.Voicemail;
import com.m7.cc.ass.model.configuration.WebCall;
import com.m7.cc.ass.model.configuration.WebchatAddr;
import com.m7.cc.ass.model.configuration.WeixinAddr;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.ACSStorage;
import com.m7.cc.configuration.service.AELProvider;
import com.m7.cc.configuration.service.ServicePeer;
import com.m7.cc.util.Utils;

public class C5Account {
	private String pbx;
	private String account;
	private String name;

	private boolean active = true;
	private C5Lisence lisence;

	private Hashtable<String, User> users = new Hashtable<String, User>();
	private Hashtable<String, C5Queue> queues = new Hashtable<String, C5Queue>();
	private Hashtable<String, SipPeer> peers = new Hashtable<String, SipPeer>();
	private Hashtable<String, ServiceNo> serviceNos = new Hashtable<String, ServiceNo>();
	private Hashtable<String, WebCall> webCalls = new Hashtable<String, WebCall>();
	private Hashtable<String, BlackList> blackLists = new Hashtable<String, BlackList>();
	private Hashtable<String, Music> musics = new Hashtable<String, Music>();
	private Hashtable<String, Announcement> announcements = new Hashtable<String, Announcement>();
	private Hashtable<String, Satisfaction> satisfactions = new Hashtable<String, Satisfaction>();
	private Hashtable<String, SuperDialJobNum> superDialJobNums = new Hashtable<String, SuperDialJobNum>();
	private SatisfactionOptions satisfactionOptions = new SatisfactionOptions();
	private Hashtable<String, IvrMenu> ivrMenus = new Hashtable<String, IvrMenu>();
	
	private Hashtable<String, Validation> validations = new Hashtable<String, Validation>();
	private Hashtable<String, HoldMusic> holdMusics = new Hashtable<String, HoldMusic>();
	private Hashtable<String, TimeCondition> timeConditions = new Hashtable<String, TimeCondition>();
	private Hashtable<String, IVR> ivrs = new Hashtable<String, IVR>();
	private Hashtable<String, CallUrl> callUrls = new Hashtable<String, CallUrl>();
	private Hashtable<String, TwowayCall> twowayCalls = new Hashtable<String, TwowayCall>();
	private Hashtable<String, DialextenNode> dialextenNodes = new Hashtable<String, DialextenNode>();
	private Hashtable<String, List<String>> nums = new Hashtable<String, List<String>>();

	private Hashtable<String, DynamicRouteNode> dynamicRouteNodes = new Hashtable<String, DynamicRouteNode>();

	private Hashtable<String, AssignmentNode> assignmentNodes = new Hashtable<String, AssignmentNode>();
	private Hashtable<String, DialJobNumNode> dialJobNumNodes = new Hashtable<String, DialJobNumNode>();
	private Hashtable<String, IvrValidateNode> ivrValidateNodes = new Hashtable<String, IvrValidateNode>();

	private Hashtable<String, Voicemail> vms = new Hashtable<String, Voicemail>();

	private Hashtable<String, ExtensionPeer> extenpeers = new Hashtable<String, ExtensionPeer>();

	private Hashtable<String, ServicePeer> servicePeers = new Hashtable<String, ServicePeer>();
	/*
	 * Add by yangwl
	 * 2011-03-10
	 */
	private Hashtable<String, TextAnnouncement> textAnnouncements = new Hashtable<String, TextAnnouncement>();
	private Hashtable<String, EncryptMD5> encryptMD5s = new Hashtable<String, EncryptMD5>(); 
	private Hashtable<String, Room> rooms = new Hashtable<String, Room>();
	private Hashtable<String, SwitchBoard> switchBoards = new Hashtable<String, SwitchBoard>();

	private Vector<String> didNumbers = new Vector<String>();

	private DialLine dialoutLine = null;
	private DialLine transferLine = null;

	// Aman zhai. 2010.05.06 interfaces (http-dialout & http-transfer)
	private ActionExtenFields extenFields;
	// <--

	private String investigateMusic;
	
	private PhonebarConfig phonebarConfig = new PhonebarConfig();

	private CallReport callReport;
	
	private BatchDialoutor batchDialoutor;

	private List<String> autoCalls = new ArrayList<String>();
	
	private Hashtable<String, AutoCallTask> autoCallTasks = new Hashtable<String, AutoCallTask>();
	
	private Map<String, String> autoCallUniqueidTaskIdMap = new HashMap<String, String>();
	private HashMap<String, String> webcallTtsGenerateMap = new HashMap<String, String>();
	private HashMap<String, HashMap<String,String>> chatingIvrPlayVarMap = new HashMap<String, HashMap<String,String>>();
	private RedList redList = null;
	
	private int monitorDuration = -1;
	//====mail
	private Hashtable<String, MailAddr> mailAddrs = new Hashtable<String, MailAddr>();
	public Hashtable<String, MailAddr> getMailAddrs() {
		return mailAddrs;
	}
	private Hashtable<String, MailQueue> mailQueues = new Hashtable<String, MailQueue>();
	public Hashtable<String, MailQueue> getMailQueues() {
		return mailQueues;
	}
	//=====weixin
	private Hashtable<String, WeixinAddr> weixinAddrs = new Hashtable<String, WeixinAddr>();
	public Hashtable<String, WeixinAddr> getWeixinAddrs() {
		return weixinAddrs;
	}
	//=====webchat
	private Hashtable<String, WebchatAddr> webchatAddrs = new Hashtable<String, WebchatAddr>();
	public Hashtable<String, WebchatAddr> getWebchatAddrs() {
		return webchatAddrs;
	}

	public C5Account(String pbx, String account) {
		this.pbx = pbx;
		this.account = account;
		this.name = account;
		callReport = new CallReport(pbx, account);
		// Aman zhai. 2010.05.07 interfaces (http-dialout & http-transfer)
		extenFields = new ActionExtenFields();
		// <--
		lisence = new C5Lisence(account);
	}

	public C5Lisence getLisence() {
		return lisence;
	}

	// Aman zhai. 2010.05.07
	public synchronized void addExtenFields(Hashtable<String, Object> map)
			throws Exception {
		if (null == map)
			return;
		if (map.containsKey(Fields.DisplayName))
			this.name = map.get(Fields.DisplayName).toString();
		if (map.containsKey(Fields.DispatcherResend)){
			if(map.get(Fields.DispatcherResend).toString().equals("true")){
				RuntimeData.getInstance().getDispatcherResendMap().put(account, "true");
			}
		}
		if (map.containsKey(Fields.IsRecordChannelCdr)){
			if(map.get(Fields.IsRecordChannelCdr).toString().equals("true")){
				RuntimeData.getInstance().getChannelCdrRecordMap().put(account+"@"+pbx, "true");
			}
		}
		if (map.containsKey(Fields.DispatcherAccAndId)){
			if(map.get(Fields.DispatcherAccAndId).toString().equals("true")){
				RuntimeData.getInstance().getDispatcherAccAndIdMap().put(account+"@"+pbx, name);
			}
		}
		this.extenFields.addOrUpdateParameters(map);
	}

	public synchronized void setExtenFields(Hashtable<String, String> peerExten) {
		if (null == peerExten)
			return;
		if (peerExten.containsKey(Fields.DisplayName))
			this.name = peerExten.get(Fields.DisplayName).toString();
		//add by chenguang
		if(peerExten.get(Fields.SatisfactionOptions)!=null){
			if(this.satisfactionOptions == null ){
				this.satisfactionOptions = new SatisfactionOptions();
			}
			this.satisfactionOptions.clear();
			this.satisfactionOptions.setValue(peerExten.get(Fields.SatisfactionOptions).toString());			
		}
		if(peerExten.get(Fields.MonitorDuration)!=null){
			this.monitorDuration = Integer.parseInt(peerExten.get(Fields.MonitorDuration).toString());
		}
		if (peerExten.get(Fields.DispatcherResend)!=null){
			if(peerExten.get(Fields.DispatcherResend).toString().equals("true")){
				RuntimeData.getInstance().getDispatcherResendMap().put(account, "true");				
			}else{
				RuntimeData.getInstance().getDispatcherResendMap().remove(account);			
			}
		}
		if (peerExten.get(Fields.IsRecordChannelCdr)!=null){
			if(peerExten.get(Fields.IsRecordChannelCdr).toString().equals("true")){
				RuntimeData.getInstance().getChannelCdrRecordMap().put(account+"@"+pbx, "true");				
			}else{
				RuntimeData.getInstance().getChannelCdrRecordMap().remove(account+"@"+pbx);			
			}
		}
		if (peerExten.containsKey(Fields.DispatcherAccAndId)){
			if(peerExten.get(Fields.DispatcherAccAndId).toString().equals("true")){
				RuntimeData.getInstance().getDispatcherAccAndIdMap().put(account+"@"+pbx, name);
			}else{
				RuntimeData.getInstance().getDispatcherAccAndIdMap().remove(account+"@"+pbx);			
			}
		}
		if (peerExten.containsKey(Fields.PbxCustomArea)){
			if(!peerExten.get(Fields.PbxCustomArea).toString().equals("")){
				ASConfig.getInstance().getPbxCustomAreaAccMap().put(account, peerExten.get(Fields.PbxCustomArea).toString());
			}else{
				ASConfig.getInstance().getPbxCustomAreaAccMap().remove(account);			
			}
		}
		Hashtable<String, Object> passParam = extenFields
				.getHashtableStringObject(peerExten);

		this.extenFields.addOrUpdateParameters(passParam);
	}

	public synchronized void updateExtenFields(Hashtable<String, Object> map) {
		if (null == map || map.isEmpty())
			return;
		//satisfaction add by chenguang 2012-9-19
		if (map.containsKey(Fields.SatisfactionOptions)){
			if(this.satisfactionOptions == null ){
				this.satisfactionOptions = new SatisfactionOptions();
			}
			this.satisfactionOptions.clear();
			this.satisfactionOptions.setValue(map.get(Fields.SatisfactionOptions).toString());
		}

		if (map.containsKey(Fields.DisplayName))
			this.name = map.get(Fields.DisplayName).toString();
		
		if (map.containsKey(Fields.PhonebarConfigKey)){
			if(this.phonebarConfig == null){
				this.phonebarConfig = new PhonebarConfig();
			}
			this.phonebarConfig.setValue(map.get(Fields.PhonebarConfigKey).toString());
			map.remove(Fields.PhonebarConfigKey);
		}
		
		if (map.containsKey(Fields.MonitorDuration)){
			this.monitorDuration = Integer.parseInt(map.get(Fields.MonitorDuration).toString());
		}
		if (map.containsKey(Fields.DispatcherResend)){
			if(map.get(Fields.DispatcherResend).toString().equals("true")){
				RuntimeData.getInstance().getDispatcherResendMap().put(account, "true");				
			}else{
				RuntimeData.getInstance().getDispatcherResendMap().remove(account);			
			}
		}
		if (map.containsKey(Fields.IsRecordChannelCdr)){
			if(map.get(Fields.IsRecordChannelCdr).toString().equals("true")){
				RuntimeData.getInstance().getChannelCdrRecordMap().put(account+"@"+pbx, "true");				
			}else{
				RuntimeData.getInstance().getChannelCdrRecordMap().remove(account+"@"+pbx);			
			}
		}
		if (map.containsKey(Fields.DispatcherAccAndId)){
			if(map.get(Fields.DispatcherAccAndId).toString().equals("true")){
				RuntimeData.getInstance().getDispatcherAccAndIdMap().put(account+"@"+pbx, name);
			}else{
				RuntimeData.getInstance().getDispatcherAccAndIdMap().remove(account+"@"+pbx);			
			}
		}
		if (map.containsKey(Fields.PbxCustomArea)){
			if(!map.get(Fields.PbxCustomArea).toString().equals("")){
				ASConfig.getInstance().getPbxCustomAreaAccMap().put(account, map.get(Fields.PbxCustomArea).toString());
			}else{
				ASConfig.getInstance().getPbxCustomAreaAccMap().remove(account);			
			}
		}
		this.extenFields.addOrUpdateParameters(map);
		/*
		 * Iterator<String> iterator = map.keySet().iterator();
		 * while(iterator.hasNext()) { String key = iterator.next(); if
		 * (this.extenFields.containKey(key)) { extenFields.setParameter(key,
		 * map.get(key)); } else { this.extenFields.addParameter(key,
		 * map.get(key)); } }
		 */
	}

	public synchronized void removeExtenFields(Vector<String> array)
			throws Exception {
		if (null == array)
			return;

		this.extenFields.removeParameters(array);
	}

	public synchronized ActionExtenFields getExtenFields() {
		return extenFields;
	}

	// <--

	public synchronized void setUsers(Hashtable<String, User> users) {
		this.users.clear();
		this.users.putAll(users);
		Iterator<User> _users = users.values().iterator();
		while (_users.hasNext()) {
			User user = _users.next();
			if (user.getExten() != null)
				this.servicePeers.put(user.getId(), user);
			if (user.getLocalNumber() != null) 
				this.addDidNum(user.getLocalNumber());
		}
	}
	
	public synchronized void setPhonebarConfig(String configString){
		this.phonebarConfig.setValue(configString);
	}

	public synchronized void setQueues(Hashtable<String, C5Queue> queues) {
		this.queues.clear();
		this.queues.putAll(queues);
		servicePeers.putAll(queues);
	}
	
	public synchronized void setMailQueues(Hashtable<String, MailQueue> mailQueues) {
		this.mailQueues.clear();
		this.mailQueues.putAll(mailQueues);
//		servicePeers.putAll(mailQueues);
	}
	
	public synchronized void setMailAddrs(Hashtable<String, MailAddr> mas) {
		this.mailAddrs.clear();
		this.mailAddrs.putAll(mas);
//		servicePeers.putAll(mas);
	}
	
	public synchronized void setWeixinAddrs(Hashtable<String, WeixinAddr> was) {
		this.weixinAddrs.clear();
		this.weixinAddrs.putAll(was);
//		servicePeers.putAll(was);
	}
	
	public synchronized void setWebchatAddrs(Hashtable<String, WebchatAddr> wbs) {
		this.webchatAddrs.clear();
		this.webchatAddrs.putAll(wbs);
	}

	public synchronized void setSipPeer(Hashtable<String, SipPeer> peers) {
		this.peers.clear();
		this.peers.putAll(peers);
		servicePeers.putAll(peers);
	}

	public synchronized void setServiceNo(Hashtable<String, ServiceNo> sns) {
		this.serviceNos.clear();
		this.serviceNos.putAll(sns);
		servicePeers.putAll(sns);
	}

	public synchronized void setBlackList(Hashtable<String, BlackList> bls) {
		this.blackLists.clear();
		this.blackLists.putAll(bls);
		servicePeers.putAll(bls);
	}

	public void setRedList(RedList redList) {
		this.redList = redList;
	}

	public synchronized void setNums(Hashtable<String, List<String>> nums) {
		this.nums.clear();
		this.nums.putAll(nums);
	}
	
	public synchronized void setTimeCondition(
			Hashtable<String, TimeCondition> tcs) {
		this.timeConditions.clear();
		this.timeConditions.putAll(tcs);
		servicePeers.putAll(tcs);
	}

	// Aman zhai. 2010.06.09
	public synchronized void setDialextenNodes(
			Hashtable<String, DialextenNode> dialextenNodes) {
		this.dialextenNodes.clear();
		this.dialextenNodes.putAll(dialextenNodes);
		servicePeers.putAll(dialextenNodes);
	}

	// Aman zhai. 2010.06.11
	public synchronized void setDynamicRouteNodes(
			Hashtable<String, DynamicRouteNode> dynamicRouteNodes) {
		this.dynamicRouteNodes.clear();
		this.dynamicRouteNodes.putAll(dynamicRouteNodes);
		servicePeers.putAll(dynamicRouteNodes);
	}

	// <--
	public synchronized void setAssignmentNodes(
			Hashtable<String, AssignmentNode> assignmentNodes) {
		this.assignmentNodes.clear();
		this.assignmentNodes.putAll(assignmentNodes);
		servicePeers.putAll(assignmentNodes);
	}

	public synchronized void setDialJobNumNodes(
			Hashtable<String, DialJobNumNode> dialJobNumNodes) {
		this.dialJobNumNodes.clear();
		this.dialJobNumNodes.putAll(dialJobNumNodes);
		servicePeers.putAll(dialJobNumNodes);
	}

	public void setIvrValidateNodes(
			Hashtable<String, IvrValidateNode> ivrValidateNodes) {
		this.ivrValidateNodes.clear();
		this.ivrValidateNodes.putAll(ivrValidateNodes);
		servicePeers.putAll(ivrValidateNodes);
	}

	public synchronized void setIVR(Hashtable<String, IVR> ivrs) {
		this.ivrs.clear();
		this.ivrs.putAll(ivrs);
		servicePeers.putAll(ivrs);
	}

	public synchronized void setCallUrl(Hashtable<String, CallUrl> callurls) {
		this.callUrls.clear();
		this.callUrls.putAll(callurls);
		servicePeers.putAll(callurls);
	}
	
	public synchronized void setTwowayCall(Hashtable<String, TwowayCall> twowayCalls) {
		this.twowayCalls.clear();
		this.twowayCalls.putAll(twowayCalls);
		servicePeers.putAll(twowayCalls);
	}

	public synchronized void setSatisfactions(
			Hashtable<String, Satisfaction> ants){
		this.satisfactions.clear();
		this.satisfactions.putAll(ants);
		servicePeers.putAll(ants);
	}
	
	public synchronized void setSuperDialJobNum(
			Hashtable<String, SuperDialJobNum> ants){
		this.superDialJobNums.clear();
		this.superDialJobNums.putAll(ants);
		servicePeers.putAll(ants);
	}
	
	public synchronized void setAutoCallTasks(
			Hashtable<String, AutoCallTask> tasks){
		this.autoCallTasks.clear();
		this.autoCallTasks.putAll(tasks);
//		servicePeers.putAll(tasks);
	}
	
	public Hashtable<String, AutoCallTask> getAutoCallTasks() {
		return autoCallTasks;
	}

	public Map<String, String> getAutoCallUniqueidTaskIdMap() {
		return autoCallUniqueidTaskIdMap;
	}

	public void setAutoCallUniqueidTaskIdMap(
			Map<String, String> autoCallUniqueidTaskIdMap) {
		this.autoCallUniqueidTaskIdMap = autoCallUniqueidTaskIdMap;
	}

	public synchronized void setIvrMenus(
			Hashtable<String, IvrMenu> ants){
		this.ivrMenus.clear();
		this.ivrMenus.putAll(ants);
		servicePeers.putAll(ants);
	}
	
	public synchronized void setAnnouncement(
			Hashtable<String, Announcement> ants) {
		this.announcements.clear();
		this.announcements.putAll(ants);
		servicePeers.putAll(ants);
	}
	
	public synchronized void setSwitchBoard(
			Hashtable<String, SwitchBoard> sbs) {
		this.switchBoards.clear();
		this.switchBoards.putAll(sbs);
		servicePeers.putAll(sbs);
	}
	
	public synchronized void setTextAnnouncement(Hashtable<String, TextAnnouncement> tas){
		this.textAnnouncements.clear();
		this.textAnnouncements.putAll(tas);
		servicePeers.putAll(tas);
	}
	
	public synchronized void setEncryptMD5(Hashtable<String, EncryptMD5> ems){
		this.encryptMD5s.clear();
		this.encryptMD5s.putAll(ems);
		servicePeers.putAll(ems);
	}
	
	public synchronized void setRoom(Hashtable<String, Room> rooms) {
		this.rooms.clear();
		this.rooms.putAll(rooms);
		servicePeers.putAll(rooms);
	}

	public synchronized void setValidate(Hashtable<String, Validation> vds) {
		this.validations.clear();
		this.validations.putAll(vds);
		servicePeers.putAll(vds);
	}

	public synchronized void setVoicemail(Hashtable<String, Voicemail> vms) {
		this.vms.clear();
		this.vms.putAll(vms);
		servicePeers.putAll(vms);
	}

	public synchronized void setExtensionPeer(
			Hashtable<String, ExtensionPeer> eps) {
		this.extenpeers.clear();
		this.extenpeers.putAll(eps);
		servicePeers.putAll(extenpeers);
	}

	public synchronized void setHoldMusic(Hashtable<String, HoldMusic> hms) {
		this.holdMusics.clear();
		this.holdMusics.putAll(hms);
	}

	public synchronized void setDialoutLine(DialLine line) {
		this.dialoutLine = line;
	}

	public synchronized void setXferLine(DialLine line) {
		this.transferLine = line;
	}

	public synchronized boolean active(boolean active) throws Exception {
		if (this.active == active) {
			return true;
		} else {
			this.active = active;
			if (active)
				AELProvider.addInclude(pbx, account);
			else
				AELProvider.removeInclude(pbx, account);
		}
		return true;
	}

	/**
	 * This method will create default context for every serviceNo; See ivr.vm
	 * for more infomations about the default context; ivr.vm is reachable in
	 * ACS directory.
	 * 
	 * @param serviceNos
	 * @return
	 * @throws Exception
	 */
	public synchronized boolean addServiceNo(ServiceNo serviceNo)
			throws Exception {
		if (serviceNo == null)
			return false;

		serviceNos.put(serviceNo.getExten(), serviceNo);
		servicePeers.put(serviceNo.getExten(), serviceNo);
		ACSStorage.updateServiceNo(pbx, account, serviceNos);
		return true;
	}

	public synchronized boolean updateServiceNo(ServiceNo serviceNo)
			throws Exception {
		serviceNos.put(serviceNo.getExten(), serviceNo);
		servicePeers.put(serviceNo.getExten(), serviceNo);
		ACSStorage.updateServiceNo(pbx, account, serviceNos);
		return true;
	}

	public synchronized boolean removeServiceNo(Vector<String> serviceNos)
			throws Exception {
		if (serviceNos == null)
			return false;
		for (int i = 0; i < serviceNos.size(); i++) {
			this.serviceNos.remove(serviceNos.get(i));
			servicePeers.remove(serviceNos.get(i));
		}
		ACSStorage.updateServiceNo(pbx, account, this.serviceNos);
		return true;
	}

	public synchronized boolean addMailAddr(MailAddr mailAddr)
			throws Exception {
		if (mailAddr == null)
			return false;

		mailAddrs.put(mailAddr.getExten(), mailAddr);
//		servicePeers.put(mailAddr.getExten(), mailAddr);
		ACSStorage.updateMailAddr(pbx, account, mailAddrs);
		return true;
	}

	public synchronized boolean updateMailAddr(MailAddr mailAddr)
			throws Exception {
		mailAddrs.put(mailAddr.getExten(), mailAddr);
//		servicePeers.put(mailAddr.getExten(), mailAddr);
		ACSStorage.updateMailAddr(pbx, account, mailAddrs);
		return true;
	}

	public synchronized boolean removeMailAddr(Vector<String> mailAddrs)
			throws Exception {
		if (mailAddrs == null)
			return false;
		for (int i = 0; i < mailAddrs.size(); i++) {
			this.mailAddrs.remove(mailAddrs.get(i));
//			servicePeers.remove(mailAddrs.get(i));
		}
		ACSStorage.updateMailAddr(pbx, account, this.mailAddrs);
		return true;
	}
	
	public synchronized boolean addWeixinAddr(WeixinAddr weixinAddr)
			throws Exception {
		if (weixinAddr == null)
			return false;

		weixinAddrs.put(weixinAddr.getExten(), weixinAddr);
//		servicePeers.put(weixinAddr.getExten(), weixinAddr);
		ACSStorage.updateWeixinAddr(pbx, account, weixinAddrs);
		return true;
	}

	public synchronized boolean updateWeixinAddr(WeixinAddr weixinAddr)
			throws Exception {
		weixinAddrs.put(weixinAddr.getExten(), weixinAddr);
//		servicePeers.put(weixinAddr.getExten(), weixinAddr);
		ACSStorage.updateWeixinAddr(pbx, account, weixinAddrs);
		return true;
	}

	public synchronized boolean removeWeixinAddr(Vector<String> weixinAddrs)
			throws Exception {
		if (weixinAddrs == null)
			return false;
		for (int i = 0; i < weixinAddrs.size(); i++) {
			this.weixinAddrs.remove(weixinAddrs.get(i));
//			servicePeers.remove(weixinAddrs.get(i));
		}
		ACSStorage.updateWeixinAddr(pbx, account, this.weixinAddrs);
		return true;
	}
	
	public synchronized boolean updateWebchatAddr(WebchatAddr webchatAddr)
			throws Exception {
		webchatAddrs.put(webchatAddr.getExten(), webchatAddr);
		ACSStorage.updateWebchatAddr(pbx, account, webchatAddrs);
		return true;
	}
	
	public synchronized boolean removeWebchatAddr(Vector<String> webchatAddrs)
			throws Exception {
		if (webchatAddrs == null)
			return false;
		for (int i = 0; i < webchatAddrs.size(); i++) {
			this.webchatAddrs.remove(webchatAddrs.get(i));
		}
		ACSStorage.updateWebchatAddr(pbx, account, this.webchatAddrs);
		return true;
	}
	
	public synchronized void updateUser(Vector<User> _users) {
		if (_users == null)
			return;
		for (int i = 0; i < _users.size(); i++) {
			User user = _users.get(i);
			users.put(user.getId(), user);
			if (user.getExten() != null)
				servicePeers.put(user.getId(), user);
		}
		ACSStorage.updateUsers(pbx, account, users);
		updateDidNum();
	}
	
	public synchronized void updateUser() {
		ACSStorage.updateUsers(pbx, account, users);
	}

	public synchronized boolean removeUser(Vector<String> _users) {
		if (_users == null)
			return false;
		boolean removed = false;
		for (int i = 0; i < _users.size(); i++) {
			User user = users.remove(_users.get(i));
			if (user != null && user.getExten() != null) {
				servicePeers.remove(user.getId());
				removed = true;
				String gatewaySip = user.getOwnSipNums().get(Fields.gateway);
				if (gatewaySip != null) {
					SipPeer peer = this.getSipPeer(gatewaySip);
					if (peer != null) {
						peer.setUser(null);
					}
				}
			}
		}
		updateDidNum();
		if (removed)
			return ACSStorage.updateUsers(pbx, account, users);
		return true;
	}

	public synchronized boolean addSipPeer(SipPeer peer) {
		if (peer == null)
			return false;

		if (this.transferLine != null) {
			String dn = transferLine.getDidNum();
			if (transferLine.isNeedPrefix() && !Utils.isMobileNo(dn) && !dn.startsWith("0")){
				dn = ASConfig.getInstance().getDistrictNo(account) + dn;
			}
			peer.setFromuser(dn);
			if (peer.isLocal() && peer.getLocalNum() != null
					&& !peer.getLocalNum().equalsIgnoreCase("")) {
				String number = peer.getLocalNum();
				if (transferLine.getExten().length() > 1 && number.startsWith(transferLine.getExten()))
					number = number.substring(transferLine.getExten().length());
				number = getFixedNumber(number, transferLine.isNeedPrefix());
				peer.setUsername(peer.getAccount() + Fields.XferFlag + transferLine.getExten() + number);
			}
		}
		peers.put(peer.getExten(), peer);
		servicePeers.put(peer.getExten(), peer);
		updateDidNum();
		return ACSStorage.updateSip(account, pbx, peers);
	}
	
	public synchronized boolean bindSipPeer(SipPeer peer, String[] userIDs) {
		if (peer == null)
			return false;

		if (userIDs == null || userIDs.length < 1)
			return false;

		User user = null;
		for (String userID : userIDs) {
			user = getUser(userID);
			if (user == null) {
				continue;
			}
			user.getOwnSipNums().put(peer.getExtenType(), peer.getExten());
		}
		return ACSStorage.updateUsers(pbx, account, users);
	}
	
	public synchronized boolean unbindSipPeer(SipPeer peer, String[] userIDs) {
		if (peer == null)
			return false;

		if (userIDs == null || userIDs.length < 1)
			return false;

		User user = null;
		for (String userID : userIDs) {
			user = getUser(userID);
			if (user == null) {
				continue;
			}
			if (user.getOwnSipNums().containsKey(peer.getExtenType())) {
				user.getOwnSipNums().remove(peer.getExtenType());
			}
		}
		return ACSStorage.updateUsers(pbx, account, users);
	}
	
	public synchronized void updateSippeers(){
		ACSStorage.updateSip(account, pbx, peers);
	}

	public synchronized boolean removePeer(Vector<String> _peers) {
		if (_peers == null)
			return false;
		for (int i = 0; i < _peers.size(); i++) {
			peers.remove(_peers.get(i));
			servicePeers.remove(_peers.get(i));
		}
		return ACSStorage.updateSip(account, pbx, peers);
	}

	public synchronized boolean addQueue(C5Queue queue) throws Exception {
		if (queue == null)
			return false;
		// String exten = queue.getExten();
		// if (servicePeers.containsKey(exten))
		// throw new Exception("This exten has already exist [" + exten + "]");
		queues.put(queue.getExten(), queue);
		servicePeers.put(queue.getExten(), queue);
		ACSStorage.updateQueue(account, pbx, queues);
		return true;
	}

	public synchronized void updateQueue(C5Queue queue) throws Exception {
		if (queue == null)
			return;
		queues.put(queue.getExten(), queue);
		servicePeers.put(queue.getExten(), queue);
		ACSStorage.updateQueue(account, pbx, queues);
	}

	public synchronized boolean removeQueue(Vector<String> _queues)
			throws Exception {
		if (_queues == null)
			return false;

		for (int i = 0; i < _queues.size(); i++) {
			queues.remove(_queues.get(i));
			servicePeers.remove(_queues.get(i));
		}
		ACSStorage.updateQueue(account, pbx, queues);
		return true;
	}
	
	public synchronized void updateMailQueue(MailQueue mqueue) throws Exception {
		if (mqueue == null)
			return;
		mailQueues.put(mqueue.getExten(), mqueue);
//		servicePeers.put(mqueue.getExten(), mqueue);
		ACSStorage.updateMailQueue(account, pbx, mailQueues);
	}

	public synchronized boolean removeMailQueue(Vector<String> _queues)
			throws Exception {
		if (_queues == null)
			return false;

		for (int i = 0; i < _queues.size(); i++) {
			mailQueues.remove(_queues.get(i));
//			servicePeers.remove(_queues.get(i));
		}
		ACSStorage.updateMailQueue(account, pbx, mailQueues);
		return true;
	}

	public synchronized boolean addBlacklist(Vector<BlackList> _blackList)
			throws Exception {
		if (_blackList == null)
			return false;
		for (int i = 0; i < _blackList.size(); i++) {
			String exten = _blackList.get(i).getExten();
			if (servicePeers.containsKey(exten))
				throw new Exception("Exten [" + exten
						+ "] has already been used");
		}
		for (int i = 0; i < _blackList.size(); i++) {
			BlackList bl = _blackList.get(i);
			blackLists.put(bl.getExten(), bl);
			servicePeers.put(bl.getExten(), bl);
		}
		ACSStorage.updateBlackList(pbx, account, blackLists);
		return true;
	}
	
	public synchronized boolean addNum(String type, String num, String oldNum) throws Exception {
		if (type == null || type.equals("") || num == null || num.equals(""))
			return false;

		List<String> numList = nums.get(type);
		if (numList == null) {
			numList = new ArrayList<String>();
			nums.put(type, numList);
		}
		if(oldNum != null && numList != null){
			numList.remove(oldNum);
		}
		if (!numList.contains(num)) {
			numList.add(num);
			numList.add(ASConfig.getInstance().getOtherNum(num));
		}	
		ACSStorage.updateNum(pbx, account, nums);
		return true;
	}
	
	public synchronized boolean removeNum(Vector<String> extens, String type) throws Exception {
		if(type == null || type.equals("") || extens == null || extens.size()<1)
			return false;
		
		List<String> numList = nums.get(type);
		if (numList == null) {
			return true;
		}
		for(String exten : extens){
			numList.remove(exten);
			numList.remove(ASConfig.getInstance().getOtherNum(exten));
		}
		ACSStorage.updateNum(pbx, account, nums);
		return true;
	}
	
	public List<String> getNumViaType(String type){
		return nums.get(type);
	}
	
	public boolean hasNum(String type){
		List<String> numList = nums.get(type);
		if (numList == null) {
			return false;
		}
		if(numList.size() < 1){
			return false;
		}
		return true;
	}

	public boolean updateBlackList(Vector<BlackList> blackList)
			throws Exception {
		if (blackList == null)
			return false;
		for (int i = 0; i < blackList.size(); i++) {
			BlackList bl = blackList.get(i);
			blackLists.put(bl.getExten(), bl);
			servicePeers.put(bl.getExten(), bl);
		}
		ACSStorage.updateBlackList(pbx, account, blackLists);
		return true;
	}
	
	public boolean updateRedList(RedList redList)
			throws Exception {
		if (redList == null)
			return false;
		this.setRedList(redList);
		ACSStorage.updateRedList(pbx, account, redList);
		return true;
	}

	public synchronized boolean removeBlackList(Vector<String> extens)
			throws Exception {

		for (int i = 0; i < extens.size(); i++) {
			String exten = extens.get(i);
			blackLists.remove(exten);
			servicePeers.remove(exten);
		}
		ACSStorage.updateBlackList(pbx, account, blackLists);
		return true;
	}

	protected synchronized void effectServicePeer(String name) throws Exception {
		if (name.equals(BlackList.NAME)) {
			AELProvider.updateBlackList(blackLists, this);
		}

		else if (name.equals(C5Queue.NAME)) {
			AELProvider.updateQueue(queues, this);
		}

		else if (name.equals(IVR.NAME)) {
			AELProvider.updateIVR(ivrs, this);
		}

		else if (name.equals(ServiceNo.NAME)) {
			AELProvider.updateServiceNo(serviceNos, this);
		}

		else if (name.equals(TimeCondition.NAME)) {
			AELProvider.updateTimeCondition(timeConditions, this);
		}

		else if (name.equals(Announcement.NAME)) {
			AELProvider.updateAnnouncement(announcements, this);
		}

		else if (name.equals(Satisfaction.NAME)) {
			AELProvider.updateSatisfaction(satisfactions, this);
		}

		else if (name.equals(SuperDialJobNum.NAME)) {
			AELProvider.updateSuperDialJobNum(superDialJobNums, this);
		}
		
		else if (name.equals(Validation.NAME)) {
			AELProvider.updateValidate(validations, this);
		}

		else if (name.equals(Voicemail.NAME)) {
			AELProvider.updateVoicemail(vms, this);
		}

		else if (name.equals(ExtensionPeer.NAME)) {
			AELProvider.updateExtensionPeer(extenpeers, this);
		}

		else if (name.equals(DialextenNode.NAME)) {
			AELProvider.updateDialextenNodes(dialextenNodes, this);
		}

		else if (name.equals(DynamicRouteNode.NAME)) {
			AELProvider.updateDynamicRouteNodes(dynamicRouteNodes, this);
		}

		else if (name.equals(AssignmentNode.NAME)) {
			AELProvider.updateAssignmentNodes(assignmentNodes, this);
		}

		else if (name.equals(DialJobNumNode.NAME)) {
			AELProvider.updateDialJobNumNodes(dialJobNumNodes, this);
		}

		else if (name.equals(Fields.callurl)) {
			AELProvider.updateCallUrl(callUrls, this);
		}
		else if (name.equals(Fields.twowaycall)) {
			AELProvider.updateTwowayCall(twowayCalls, this);
		}

		else if (name.equals("extension")) {
			AELProvider.updateExtension(pbx, this);
		}

		else if (name.equals(Fields.TextAnnouncement)){
			AELProvider.updateTextAnnouncement(textAnnouncements, this);
		}
		
		else if (name.equals(Fields.EncryptMD5)){
			AELProvider.updateEncryptMD5(encryptMD5s, this);
		}
		AELProvider.updateCallRoute(pbx, account, servicePeers);
	}

	protected synchronized void effectServicePeer() throws Exception {

		AELProvider.updateInclude(pbx, account);
		AELProvider.updateExtension(pbx, this);
		AELProvider.updateBlackList(blackLists, this);
		AELProvider.updateQueue(queues, this);
		AELProvider.updateIVR(ivrs, this);
		AELProvider.updateServiceNo(serviceNos, this);
		AELProvider.updateTimeCondition(timeConditions, this);
		AELProvider.updateAnnouncement(announcements, this);
		AELProvider.updateSatisfaction(satisfactions, this);
		AELProvider.updateValidate(validations, this);
		AELProvider.updateVoicemail(vms, this);
		AELProvider.updateCallRoute(pbx, account, servicePeers);
		AELProvider.updateDialout(dialoutLine, this);
		AELProvider.updateExtensionPeer(extenpeers, this);
		AELProvider.updateCallUrl(callUrls, this);
		AELProvider.updateTwowayCall(twowayCalls, this);
		AELProvider.updateDynamicRouteNodes(dynamicRouteNodes, this);
		AELProvider.updateAssignmentNodes(assignmentNodes, this);
		AELProvider.updateDialJobNumNodes(dialJobNumNodes, this);
		AELProvider.updateTextAnnouncement(textAnnouncements, this);
		AELProvider.updateEncryptMD5(encryptMD5s, this);
		AELProvider.updateRoom(rooms, this);
		//ivrValidate add by chenguang 2012-11-8
		AELProvider.updateIvrValidateNodes(ivrValidateNodes, this);
		AELProvider.updateIvrMenu(ivrMenus, this);
		AELProvider.updateSuperDialJobNum(superDialJobNums, this);

		ACSStorage.updateQueue(account, pbx, queues);
		ACSStorage.updateSip(account, pbx, peers);
	}

	protected synchronized void effectDialout() throws Exception {
		AELProvider.updateDialout(dialoutLine, this);
	}

	public synchronized boolean addHoldMusic(String holdMusic) throws Exception {
		if (holdMusics.containsKey(holdMusic))
			return true;
		HoldMusic hm = new HoldMusic(pbx, account, holdMusic);
		this.holdMusics.put(holdMusic, hm);
		ACSStorage.updateHoldMusic(pbx, account, holdMusics);
		return true;
	}

	public synchronized boolean removeHoldMusic(String holdMusic)
			throws Exception {
		if (!holdMusics.containsKey(holdMusic))
			return true;
		holdMusics.remove(holdMusic);
		ACSStorage.updateHoldMusic(pbx, account, holdMusics);
		return true;
	}

	public synchronized boolean addTimeCondition(
			Vector<TimeCondition> timeConditions) throws Exception {
		if (timeConditions == null)
			return false;
		for (int i = 0; i < timeConditions.size(); i++) {
			String exten = timeConditions.get(i).getExten();
			if (servicePeers.containsKey(exten))
				throw new Exception("This exten has already exist [" + exten
						+ "]");
		}
		for (int i = 0; i < timeConditions.size(); i++) {
			TimeCondition tc = timeConditions.get(i);
			this.timeConditions.put(tc.getExten(), tc);
			servicePeers.put(tc.getExten(), tc);
		}
		ACSStorage.updateTimeCondition(pbx, account, this.timeConditions);
		return true;
	}

	public synchronized boolean updateTimeCondition(
			Vector<TimeCondition> timeConditions) throws Exception {
		if (timeConditions == null)
			return false;
		for (int i = 0; i < timeConditions.size(); i++) {
			TimeCondition tc = timeConditions.get(i);
			this.timeConditions.put(tc.getExten(), tc);
			servicePeers.put(tc.getExten(), tc);
		}
		ACSStorage.updateTimeCondition(pbx, account, this.timeConditions);
		return true;
	}

	public synchronized boolean removeTimeCondition(Vector<String> extens)
			throws Exception {
		for (int i = 0; i < extens.size(); i++) {
			String exten = extens.get(i);
			timeConditions.remove(exten);
			servicePeers.remove(exten);
		}
		ACSStorage.updateTimeCondition(pbx, account, this.timeConditions);
		return true;
	}

	public synchronized boolean addAssignmentNodes(
			Vector<AssignmentNode> assignmentNodes) throws Exception {
		if (assignmentNodes == null)
			return false;
		for (int i = 0; i < assignmentNodes.size(); i++) {
			String exten = assignmentNodes.get(i).getExten();
			if (servicePeers.containsKey(exten))
				throw new Exception("This exten has already exist [" + exten
						+ "]");
		}

		for (int i = 0; i < assignmentNodes.size(); i++) {
			AssignmentNode assignmentNode = assignmentNodes.get(i);
			this.assignmentNodes.put(assignmentNode.getExten(), assignmentNode);
			servicePeers.put(assignmentNode.getExten(), assignmentNode);
		}
		ACSStorage.updateAssignmentNodes(pbx, account, this.assignmentNodes);
		return true;
	}

	public synchronized boolean updateAssignmentNodes(
			Vector<AssignmentNode> assignmentNodes) throws Exception {
		if (assignmentNodes == null)
			return false;

		for (int i = 0; i < assignmentNodes.size(); i++) {
			AssignmentNode assignmentNode = assignmentNodes.get(i);
			this.assignmentNodes.put(assignmentNode.getExten(), assignmentNode);
			servicePeers.put(assignmentNode.getExten(), assignmentNode);
		}
		ACSStorage.updateAssignmentNodes(pbx, account, this.assignmentNodes);
		return true;
	}

	public synchronized void removeAssignmentNodes(
			Vector<String> assignmentNodes) throws Exception {
		for (int i = 0; i < assignmentNodes.size(); i++) {
			String exten = assignmentNodes.get(i);
			this.assignmentNodes.remove(exten);
			servicePeers.remove(exten);
		}
		ACSStorage.updateAssignmentNodes(pbx, account, this.assignmentNodes);
	}

	public synchronized boolean addDialJobNumNodes(
			Vector<DialJobNumNode> dialJobNumNodes) throws Exception {
		if (dialJobNumNodes == null)
			return false;
		for (int i = 0; i < dialJobNumNodes.size(); i++) {
			String exten = dialJobNumNodes.get(i).getExten();
			if (servicePeers.containsKey(exten))
				throw new Exception("This exten has already exist [" + exten
						+ "]");
		}

		for (int i = 0; i < dialJobNumNodes.size(); i++) {
			DialJobNumNode dialJobNumNode = dialJobNumNodes.get(i);
			this.dialJobNumNodes.put(dialJobNumNode.getExten(), dialJobNumNode);
			servicePeers.put(dialJobNumNode.getExten(), dialJobNumNode);
		}
		ACSStorage.updateDialJobNumNodes(pbx, account, this.dialJobNumNodes);
		return true;
	}

	public synchronized boolean updateDialJobNumNodes(
			Vector<DialJobNumNode> dialJobNumNodes) throws Exception {
		if (dialJobNumNodes == null)
			return false;

		for (int i = 0; i < dialJobNumNodes.size(); i++) {
			DialJobNumNode dialJobNumNode = dialJobNumNodes.get(i);
			this.dialJobNumNodes.put(dialJobNumNode.getExten(), dialJobNumNode);
			servicePeers.put(dialJobNumNode.getExten(), dialJobNumNode);
		}
		ACSStorage.updateDialJobNumNodes(pbx, account, this.dialJobNumNodes);
		return true;
	}

	public synchronized void removeDialJobNumNodes(
			Vector<String> dialJobNumNodes) throws Exception {
		for (int i = 0; i < dialJobNumNodes.size(); i++) {
			String exten = dialJobNumNodes.get(i);
			this.dialJobNumNodes.remove(exten);
			servicePeers.remove(exten);
		}
		ACSStorage.updateDialJobNumNodes(pbx, account, this.dialJobNumNodes);
	}
	
	//add by chenguang 2012-11-8
	public synchronized boolean addIvrValidateNodes(
			Vector<IvrValidateNode> ivrValidateNodes) throws Exception {
		if (ivrValidateNodes == null)
			return false;
		for (int i = 0; i < ivrValidateNodes.size(); i++) {
			String exten = ivrValidateNodes.get(i).getExten();
			if (servicePeers.containsKey(exten))
				throw new Exception("This exten has already exist [" + exten
						+ "]");
		}

		for (int i = 0; i < ivrValidateNodes.size(); i++) {
			IvrValidateNode ivrValidateNode = ivrValidateNodes.get(i);
			this.ivrValidateNodes.put(ivrValidateNode.getExten(), ivrValidateNode);
			servicePeers.put(ivrValidateNode.getExten(), ivrValidateNode);
		}
		ACSStorage.updateIvrValidates(pbx, account, this.ivrValidateNodes);
		return true;
	}

	public synchronized boolean updateIvrValidateNodes(
			Vector<IvrValidateNode> ivrValidateNodes) throws Exception {
		if (ivrValidateNodes == null)
			return false;

		for (int i = 0; i < ivrValidateNodes.size(); i++) {
			IvrValidateNode ivrValidateNode = ivrValidateNodes.get(i);
			this.ivrValidateNodes.put(ivrValidateNode.getExten(), ivrValidateNode);
			servicePeers.put(ivrValidateNode.getExten(), ivrValidateNode);
		}
		ACSStorage.updateIvrValidates(pbx, account, this.ivrValidateNodes);
		return true;
	}

	// Aman zhai. 2010.06.11
	public synchronized boolean addDynamicRouteNodes(
			Vector<DynamicRouteNode> dynamicRouteNodes) throws Exception {
		if (dynamicRouteNodes == null)
			return false;
		for (int i = 0; i < dynamicRouteNodes.size(); i++) {
			String exten = dynamicRouteNodes.get(i).getExten();
			if (servicePeers.containsKey(exten))
				throw new Exception("This exten has already exist [" + exten
						+ "]");
		}

		for (int i = 0; i < dynamicRouteNodes.size(); i++) {
			DynamicRouteNode dynamicRouteNode = dynamicRouteNodes.get(i);
			this.dynamicRouteNodes.put(dynamicRouteNode.getExten(),
					dynamicRouteNode);
			servicePeers.put(dynamicRouteNode.getExten(), dynamicRouteNode);
		}
		ACSStorage
				.updateDynamicRouteNodes(pbx, account, this.dynamicRouteNodes);
		return true;
	}

	public synchronized boolean updateDynamicRouteNodes(
			Vector<DynamicRouteNode> dynamicRouteNodes) throws Exception {
		if (dynamicRouteNodes == null)
			return false;

		for (int i = 0; i < dynamicRouteNodes.size(); i++) {
			DynamicRouteNode dynamicRouteNode = dynamicRouteNodes.get(i);
			this.dynamicRouteNodes.put(dynamicRouteNode.getExten(),
					dynamicRouteNode);
			servicePeers.put(dynamicRouteNode.getExten(), dynamicRouteNode);
		}
		ACSStorage
				.updateDynamicRouteNodes(pbx, account, this.dynamicRouteNodes);
		return true;
	}

	public synchronized void removeDynamicRouteNodes(
			Vector<String> dynamicRouteNodes) throws Exception {
		for (int i = 0; i < dynamicRouteNodes.size(); i++) {
			String exten = dynamicRouteNodes.get(i);
			this.dynamicRouteNodes.remove(exten);
			servicePeers.remove(exten);
		}
		ACSStorage
				.updateDynamicRouteNodes(pbx, account, this.dynamicRouteNodes);
	}

	public synchronized boolean addDialextenNodes(
			Vector<DialextenNode> dialextenNodes) throws Exception {
		if (dialextenNodes == null)
			return false;
		for (int i = 0; i < dialextenNodes.size(); i++) {
			String exten = dialextenNodes.get(i).getExten();
			if (servicePeers.containsKey(exten))
				throw new Exception("This exten has already exist [" + exten
						+ "]");

			String toPeerWhenTimeout = dialextenNodes.get(i)
					.getToPeerWhenTimeout();
			if (!"".equals(toPeerWhenTimeout) && null != toPeerWhenTimeout
					&& !servicePeers.containsKey(toPeerWhenTimeout)) {
				throw new Exception("This toPeerWhenTimeout does not exist ["
						+ exten + ":" + toPeerWhenTimeout + "]");
			}

		}
		for (int i = 0; i < dialextenNodes.size(); i++) {
			DialextenNode dialextenNode = dialextenNodes.get(i);
			this.dialextenNodes.put(dialextenNode.getExten(), dialextenNode);
			servicePeers.put(dialextenNode.getExten(), dialextenNode);
		}
		ACSStorage.updateDialextenNodes(pbx, account, this.dialextenNodes);
		return true;
	}

	public synchronized boolean updateDialextenNodes(
			Vector<DialextenNode> dialextenNodes) throws Exception {
		if (dialextenNodes == null)
			return false;
		for (int i = 0; i < dialextenNodes.size(); i++) {
			String toPeerWhenTimeout = dialextenNodes.get(i)
					.getToPeerWhenTimeout();
			if (!"".equals(toPeerWhenTimeout) && null != toPeerWhenTimeout
					&& !servicePeers.containsKey(toPeerWhenTimeout)) {
				throw new Exception("This toPeerWhenTimeout does not exist ["
						+ toPeerWhenTimeout + "]");
			}
		}

		for (int i = 0; i < dialextenNodes.size(); i++) {
			DialextenNode dialextenNode = dialextenNodes.get(i);
			this.dialextenNodes.put(dialextenNode.getExten(), dialextenNode);
			servicePeers.put(dialextenNode.getExten(), dialextenNode);
		}
		ACSStorage.updateDialextenNodes(pbx, account, this.dialextenNodes);
		return true;
	}

	public synchronized void removeDialextenNodes(Vector<String> dialextenNodes)
			throws Exception {
		for (int i = 0; i < dialextenNodes.size(); i++) {
			String exten = dialextenNodes.get(i);
			this.dialextenNodes.remove(exten);
			servicePeers.remove(exten);
		}
		ACSStorage.updateDialextenNodes(pbx, account, this.dialextenNodes);
	}

	public synchronized boolean addIVR(Vector<IVR> ivrs) throws Exception {
		if (ivrs == null)
			return false;
		for (int i = 0; i < ivrs.size(); i++) {
			IVR ivr = ivrs.get(i);
			this.ivrs.put(ivr.getExten(), ivr);
			servicePeers.put(ivr.getExten(), ivr);
		}
		ACSStorage.updateIVR(pbx, account, this.ivrs);
		return true;
	}

	public synchronized boolean updateIVR(Vector<IVR> ivrs) throws Exception {
		if (ivrs == null)
			return false;
		for (int i = 0; i < ivrs.size(); i++) {
			IVR ivr = ivrs.get(i);
			this.ivrs.put(ivr.getExten(), ivr);
			servicePeers.put(ivr.getExten(), ivr);
		}
		ACSStorage.updateIVR(pbx, account, this.ivrs);
		return true;
	}

	public synchronized void removeIVR(Vector<String> ivrs) throws Exception {
		for (int i = 0; i < ivrs.size(); i++) {
			String exten = ivrs.get(i);
			this.ivrs.remove(exten);
			servicePeers.remove(exten);
		}
		ACSStorage.updateIVR(pbx, account, this.ivrs);
	}

	public synchronized void addCallUrl(CallUrl callUrl) throws Exception {
		if (callUrl == null)
			return;
		this.callUrls.put(callUrl.getExten(), callUrl);
		servicePeers.put(callUrl.getExten(), callUrl);
		ACSStorage.updateCallUrl(pbx, account, callUrls);
	}
	public synchronized void removeCallUrl(String exten) throws Exception {
		if (callUrls.containsKey(exten)) {
			callUrls.remove(exten);
			servicePeers.remove(exten);
			ACSStorage.updateCallUrl(pbx, account, callUrls);
		}
	}
	
	public synchronized void addTwowayCall(TwowayCall twowayCall) throws Exception {
		if (twowayCall == null)
			return;
		this.twowayCalls.put(twowayCall.getExten(), twowayCall);
		servicePeers.put(twowayCall.getExten(), twowayCall);
		ACSStorage.updateTwowayCall(pbx, account, twowayCalls);
	}

	public synchronized void removeTwowayCall(String exten) throws Exception {
		if (twowayCalls.containsKey(exten)) {
			twowayCalls.remove(exten);
			servicePeers.remove(exten);
			ACSStorage.updateTwowayCall(pbx, account, twowayCalls);
		}
	}
	
	public synchronized void addTextAnnouncement(TextAnnouncement textAnnouncement) throws Exception{
		if(textAnnouncement == null){
			return;
		}
		
		this.textAnnouncements.put(textAnnouncement.getExten(), textAnnouncement);
		this.servicePeers.put(textAnnouncement.getExten(), textAnnouncement);
		ACSStorage.updateTextAnnouncement(pbx, account, textAnnouncements);
	}
	
	public synchronized void removeTextAnnouncement(Vector<String> textAnnouncementExten) throws Exception {
		for(String exten : textAnnouncementExten){
			if (this.textAnnouncements.containsKey(exten)) {
				textAnnouncements.remove(exten);
				servicePeers.remove(exten);
				ACSStorage.updateTextAnnouncement(pbx, account, textAnnouncements);
			}
		}
	}
	
	public synchronized void addEncryptMD5(EncryptMD5 encryptMD5) throws Exception{
		if(encryptMD5 == null){
			return;
		}
		
		this.encryptMD5s.put(encryptMD5.getExten(), encryptMD5);
		this.servicePeers.put(encryptMD5.getExten(), encryptMD5);
		ACSStorage.updateEncryptMD5(pbx, account, encryptMD5s);
	}
	
	public synchronized void removeEncryptMD5(Vector<String> encryptMD5Exten) throws Exception {
		for(String exten : encryptMD5Exten){
			if (this.encryptMD5s.containsKey(exten)) {
				this.encryptMD5s.remove(exten);
				servicePeers.remove(exten);
				ACSStorage.updateEncryptMD5(pbx, account, this.encryptMD5s);
			}
		}
	}
	
	public synchronized void addRoom(Room room) throws Exception {
		if (room == null)
			return;

		this.rooms.put(room.getExten(), room);
		this.servicePeers.put(room.getExten(), room);
		ACSStorage.updateRoom(pbx, account, this.rooms);
	}
	
	public synchronized void removeRoom(Vector<String> roomExten)
			throws Exception {
		for (String exten : roomExten) {
			if (this.rooms.containsKey(exten)) {
				this.rooms.remove(exten);
				servicePeers.remove(exten);
				ACSStorage.updateRoom(pbx, account, this.rooms);
			}
		}
	}
//------------------satisfaction----------------------------
	public synchronized void addSatisfaction(Vector<Satisfaction> satisfactions)
			throws Exception {
		if (satisfactions == null)
			return;
		for (int i = 0; i < satisfactions.size(); i++) {
			String exten = satisfactions.get(i).getExten();
			if (servicePeers.containsKey(exten))
				throw new Exception("This exten has already exist [" + exten
						+ "]");
		}
		for (int i = 0; i < satisfactions.size(); i++) {
			Satisfaction ant = satisfactions.get(i);
			String exten = ant.getExten();
			this.satisfactions.put(exten, ant);
			this.servicePeers.put(exten, ant);
		}
		ACSStorage.updateSatisfaction(pbx, account, this.satisfactions);
	}
	
	public synchronized void updateSatisfaction(
			Vector<Satisfaction> satisfactions) throws Exception {
		if (satisfactions == null)
			return;
		for (int i = 0; i < satisfactions.size(); i++) {
			Satisfaction ant = satisfactions.get(i);
			String exten = ant.getExten();
			this.satisfactions.put(exten, ant);
			this.servicePeers.put(exten, ant);
		}
		ACSStorage.updateSatisfaction(pbx, account, this.satisfactions);
	}
	
	public synchronized void updateSuperDialJobNum(
			Vector<SuperDialJobNum> superDialJobNums) throws Exception {
		if (superDialJobNums == null)
			return;
		for (int i = 0; i < superDialJobNums.size(); i++) {
			SuperDialJobNum ant = superDialJobNums.get(i);
			String exten = ant.getExten();
			this.superDialJobNums.put(exten, ant);
			this.servicePeers.put(exten, ant);
		}
		ACSStorage.updateSuperDialJobNum(pbx, account, this.superDialJobNums);
	}
	
	public synchronized void removeSatisfactions(Vector<String> peers)
		throws Exception {
		if (peers == null)
			return;
		for (int i = 0; i < peers.size(); i++) {
			String exten = peers.get(i);
			servicePeers.remove(exten);
			satisfactions.remove(exten);
		}
		ACSStorage.updateSatisfaction(pbx, account, this.satisfactions);
	}
	
	public synchronized void removeSuperDialJobNum(Vector<String> peers)
			throws Exception {
			if (peers == null)
				return;
			for (int i = 0; i < peers.size(); i++) {
				String exten = peers.get(i);
				servicePeers.remove(exten);
				superDialJobNums.remove(exten);
			}
			ACSStorage.updateSuperDialJobNum(pbx, account, this.superDialJobNums);
		}
	
	//----------------------ivrmenu------------------------------------
	public synchronized void updateIvrMenu(Vector<IvrMenu> ivrMenus) throws Exception {
		if (ivrMenus == null)
			return;
		for (int i = 0; i < ivrMenus.size(); i++) {
			IvrMenu ant = ivrMenus.get(i);
			String exten = ant.getExten();
			this.ivrMenus.put(exten, ant);
			this.servicePeers.put(exten, ant);
		}
		ACSStorage.updateIvrMenu(pbx, account, this.ivrMenus);
	}
	public synchronized void removeIvrMenus(Vector<String> peers)
		throws Exception {
		if (peers == null)
			return;
		for (int i = 0; i < peers.size(); i++) {
			String exten = peers.get(i);
			servicePeers.remove(exten);
			ivrMenus.remove(exten);
		}
		ACSStorage.updateIvrMenu(pbx, account, this.ivrMenus);
	}
//----------------announcement------------------------------
	
	public synchronized void addAnnouncement(Vector<Announcement> announcements)
			throws Exception {
		if (announcements == null)
			return;
		for (int i = 0; i < announcements.size(); i++) {
			String exten = announcements.get(i).getExten();
			if (servicePeers.containsKey(exten))
				throw new Exception("This exten has already exist [" + exten
						+ "]");
		}
		for (int i = 0; i < announcements.size(); i++) {
			Announcement ant = announcements.get(i);
			String exten = ant.getExten();
			this.announcements.put(exten, ant);
			this.servicePeers.put(exten, ant);
		}
		ACSStorage.updateAnnouncement(pbx, account, this.announcements);
	}

	public synchronized void updateAnnouncement(
			Vector<Announcement> announcements) throws Exception {
		if (announcements == null)
			return;
		for (int i = 0; i < announcements.size(); i++) {
			Announcement ant = announcements.get(i);
			String exten = ant.getExten();
			this.announcements.put(exten, ant);
			this.servicePeers.put(exten, ant);
		}
		ACSStorage.updateAnnouncement(pbx, account, this.announcements);
	}
	
	public void updateSwitchBoard(String pbx, String accountID, SwitchBoard switchBoard) {
		if (switchBoard == null)
			return;
		String exten = switchBoard.getExten();
		this.switchBoards.put(exten, switchBoard);
		this.servicePeers.put(exten, switchBoard);
		ACSStorage.updateSwitchBoard(pbx, account, this.switchBoards);
	}

	public synchronized void removeAnnouncements(Vector<String> peers)
			throws Exception {
		if (peers == null)
			return;
		for (int i = 0; i < peers.size(); i++) {
			String exten = peers.get(i);
			servicePeers.remove(exten);
			announcements.remove(exten);
		}
		ACSStorage.updateAnnouncement(pbx, account, this.announcements);
	}
//------------------------------------
	public synchronized void addValidations(Vector<Validation> validations)
			throws Exception {
		if (validations == null)
			return;
		for (int i = 0; i < validations.size(); i++) {
			String exten = validations.get(i).getExten();
			if (servicePeers.containsKey(exten))
				throw new Exception("This exten has already exist [" + exten
						+ "]");
		}
		for (int i = 0; i < validations.size(); i++) {
			Validation validation = validations.get(i);
			this.validations.put(validation.getExten(), validation);
			this.servicePeers.put(validation.getExten(), validation);
		}
		ACSStorage.updateValidate(pbx, account, this.validations);
	}

	public synchronized void updateValidations(Vector<Validation> validations)
			throws Exception {
		if (validations == null)
			return;
		for (int i = 0; i < validations.size(); i++) {
			Validation validation = validations.get(i);
			this.validations.put(validation.getExten(), validation);
			this.servicePeers.put(validation.getExten(), validation);
		}
		ACSStorage.updateValidate(pbx, account, this.validations);
	}

	public synchronized void removeValidations(Vector<String> extens)
			throws Exception {
		if (extens == null)
			return;
		for (int i = 0; i < extens.size(); i++) {
			String exten = extens.get(i);
			validations.remove(exten);
			servicePeers.remove(exten);
		}
		ACSStorage.updateValidate(pbx, account, this.validations);
	}

	public synchronized void addVoicemail(Voicemail voicemail) throws Exception {
		if (voicemail == null)
			return;
		vms.put(voicemail.getExten(), voicemail);
		servicePeers.put(voicemail.getExten(), voicemail);
		ACSStorage.updateVoicemail(pbx, account, vms);
	}

	public Hashtable<String, Voicemail> getVms() {
		return vms;
	}

	public synchronized void removeVoicemails(Vector<String> extens)
			throws Exception {
		if (extens == null)
			return;
		for (int i = 0; i < extens.size(); i++) {
			String exten = extens.get(i);
			vms.remove(exten);
			servicePeers.remove(exten);
		}
		ACSStorage.updateVoicemail(pbx, account, this.vms);
	}

	public synchronized void addExtensionPeer(ExtensionPeer ep)
			throws Exception {
		if (ep == null)
			return;
		if (servicePeers.containsKey(ep.getExten()))
			throw new Exception("This exten has already exist ["
					+ ep.getExten() + "]");
		this.extenpeers.put(ep.getExten(), ep);
		this.servicePeers.put(ep.getExten(), ep);
		ACSStorage.updateExtensionPeer(pbx, account, extenpeers);
	}

	public synchronized void updateExtensionPeer(ExtensionPeer ep)
			throws Exception {
		if (ep == null)
			return;
		this.extenpeers.put(ep.getExten(), ep);
		this.servicePeers.put(ep.getExten(), ep);
		ACSStorage.updateExtensionPeer(pbx, account, extenpeers);
	}

	public synchronized void removeExtensionPeer(Vector<String> extens)
			throws Exception {
		if (extens == null)
			return;
		for (int i = 0; i < extens.size(); i++) {
			String exten = extens.get(i);
			extenpeers.remove(exten);
			servicePeers.remove(exten);
		}
		ACSStorage.updateExtensionPeer(pbx, account, extenpeers);
	}

	public DialLine getDialoutLine() {
		return dialoutLine;
	}

	public synchronized void updateDialoutLine(DialLine dialoutLine)
			throws Exception {
		this.dialoutLine = dialoutLine;
		ACSStorage.updateDialoutLine(pbx, account, dialoutLine);
		AELProvider.updateDialout(dialoutLine, this);
	}

	public DialLine getTransferLine() {
		return transferLine;
	}

	public String getFixedXferNumber(String number) {
		return getFixedNumber(number, this.transferLine.isNeedPrefix());
	}

	private String getFixedNumber(String number, boolean needPrefix) {
		if (number == null)
			return "";
//		if (number.startsWith("0") && Utils.isMobileNo(number.substring(1))) {
//			if (!needPrefix
//					&& ASConfig.getInstance().isLocalMobileNumber(
//							number.substring(1)))
//				number = number.substring(1);
//		} else 
		if (Utils.isMobileNo(number)) {
			if (needPrefix
					|| !ASConfig.getInstance().isLocalMobileNumber(number, null, account))
				number = "0" + number;
		} else if (number.startsWith(ASConfig.getInstance().getDistrictNo(account))) {
			if (!needPrefix) {
				number = number.substring(ASConfig.getInstance()
						.getDistrictNo(account).length());
			}
		} else if (number.matches("[0-9]{9,}")) {
			// do nothing
		} else {
			if (needPrefix && !number.startsWith("0")) {
				number = ASConfig.getInstance().getDistrictNo(account) + number;
			}
		}
		return number;
	}

	public synchronized void updateXferLine(DialLine transferLine)
			throws Exception {
		if (peers.size() > 0) {
			String dn = transferLine.getDidNum();
			if (transferLine.isNeedPrefix() && !Utils.isMobileNo(dn) && !dn.startsWith("0")){
				dn = ASConfig.getInstance().getDistrictNo(account) + dn;				
			}
			Iterator<SipPeer> _peers = peers.values().iterator();
			while (_peers.hasNext()) {
				SipPeer peer = _peers.next();
				peer.setFromuser(dn);
				if (peer.isLocal()) {
					String number = peer.getLocalNum();
					if (number != null && this.transferLine != null
							&& this.transferLine.getExten().length() > 1
							&& number.startsWith(this.transferLine.getExten()))
						number = number.substring(this.transferLine.getExten()
								.length());
					number = getFixedNumber(number, transferLine.isNeedPrefix());
					peer.setUsername(peer.getAccount() + Fields.XferFlag + transferLine.getExten() + number);
				}
			}
			ACSStorage.updateSip(account, pbx, peers);
		}
		this.transferLine = transferLine;
		ACSStorage.updateXferLine(pbx, account, transferLine);
		// AELProvider.updateXfer(transferLine, this);
	}

	public ServicePeer getServicePeer(String exten) {
		if (exten == null)
			return null;
		return servicePeers.get(exten);
	}

	public String getPbx() {
		return pbx;
	}

	public String getName() {
		return name;
	}
	
	public void setName(String name){
		this.name = name;
	}

	public String getAccount() {
		return account;
	}

	public Hashtable<String, User> getUsers() {
		return users;
	}

	public synchronized List<User> getUserList() {
		Iterator<User> it = users.values().iterator();
		List<User> list = new ArrayList<User>();
		while (it.hasNext()) {
			list.add(it.next());
		}
		return list;
	}

	public synchronized List<String> getUserIds() {
		Iterator<String> it = users.keySet().iterator();
		List<String> list = new ArrayList<String>();
		while (it.hasNext()) {
			list.add(it.next());
		}
		return list;
	}

	public synchronized List<User> getSortedUserIds() {
		Iterator<User> it = users.values().iterator();
		List<User> list = new ArrayList<User>();
		while (it.hasNext()) {
			User user = it.next();
			if (list.size() == 0)
				list.add(user);
			else if (user.getExten() != null 
					&& !user.getExten().equals("")
					&& Utils.isNumeric(user.getExten())) {
				for (int j = 0; j < list.size(); j++) {
					if(list.get(j).getExten() != null 
							&& !list.get(j).getExten().equals("")
							&& Utils.isNumeric(list.get(j).getExten())) {
						if (Integer.valueOf(user.getExten()).intValue() < Integer
								.valueOf(list.get(j).getExten()).intValue()) {
							list.add(j, user);
							break;
						} else if ((j+1) == list.size()){
							list.add(user);
							break;
						}
					} else {
						list.add(j, user);
						break;
					}
				}
			} else
				list.add(user);
		}
		return list;
	}

	public Hashtable<String, C5Queue> getQueues() {
		return queues;
	}

	public synchronized List<String> getQueueExtens() {
		Iterator<String> it = queues.keySet().iterator();
		List<String> list = new ArrayList<String>();
		while (it.hasNext()) {
			list.add(it.next());
		}
		return list;
	}

	public synchronized List<String> getQueuesOfUser(String userID) {
		Iterator<C5Queue> it = queues.values().iterator();
		List<String> list = new ArrayList<String>();
		while (it.hasNext()) {
			C5Queue queue = it.next();
			if (queue.hasMember(userID)) {
				list.add(queue.getExten());
			}

		}
		return list;
	}

	public Hashtable<String, SipPeer> getPeers() {
		return peers;
	}

	public synchronized List<String> getSipPeers() {
		List<String> list = new ArrayList<String>();
		Iterator<String> it = peers.keySet().iterator();
		while (it.hasNext()) {
			list.add(it.next());
		}
		return list;
	}

	protected Hashtable<String, ServiceNo> getServiceNos() {
		return serviceNos;
	}

	public synchronized ServiceNo[] getServiceNoArray() {
		ServiceNo[] sns = new ServiceNo[serviceNos.size()];
		serviceNos.values().toArray(sns);
		return sns;
	}

	public Hashtable<String, BlackList> getBlackLists() {
		return blackLists;
	}
	
	public RedList getRedList() {
		return redList;
	}

	public Hashtable<String, AssignmentNode> getAssignmentNodes() {
		return assignmentNodes;
	}
	
	public Hashtable<String, DynamicRouteNode> getDynamicRouteNodes() {
		return dynamicRouteNodes;
	}
	
	public Hashtable<String, ExtensionPeer> getExtensionPeerNodes() {
		return extenpeers;
	}

	public Hashtable<String, Music> getMusics() {
		return musics;
	}

	public Hashtable<String, Announcement> getAnnouncements() {
		return announcements;
	}
	
	public Hashtable<String, SwitchBoard> getSwitchBoards() {
		return switchBoards;
	}
	
	public Hashtable<String, DialJobNumNode> getDialJobNumNodes() {
		return dialJobNumNodes;
	}

	public Hashtable<String, IvrValidateNode> getIvrValidateNodes() {
		return ivrValidateNodes;
	}

	public Hashtable<String, Validation> getValidationNodes() {
		return validations;
	}

	public Hashtable<String, TimeCondition> getTimeConditions() {
		return timeConditions;
	}

	public Hashtable<String, IVR> getIvrs() {
		return ivrs;
	}

	public Hashtable<String, CallUrl> getCallUrls() {
		return callUrls;
	}
	public Hashtable<String, TwowayCall> getTwowayCalls() {
		return twowayCalls;
	}
	
	public PhonebarConfig getPhonebarConfig(){
		return phonebarConfig;
	}

	public Hashtable<String, ServicePeer> getServicePeers() {
		return servicePeers;
	}
	
	public synchronized List<ServicePeer> getServicePeers(String peer) {
		List<ServicePeer> list = new ArrayList<ServicePeer>();
		Iterator<ServicePeer> it = servicePeers.values().iterator();
		while(it.hasNext()) {
			ServicePeer speer = it.next();
			if(speer.getServicePeerName().equals(peer))
				list.add(speer);
		}
		return list;
	}

	public String getInvestigateMusic() {
		return investigateMusic;
	}

	public Vector<String> getDidNumbers() {
		return didNumbers;
	}
	
	public Hashtable<String, TextAnnouncement> getTextAnnouncements() {
		return textAnnouncements;
	}

	public Hashtable<String, EncryptMD5> getEncryptMD5s() {
		return encryptMD5s;
	}
	
	public Hashtable<String, Room> getRooms() {
		return rooms;
	}
	
	public Hashtable<String, IvrMenu> getIvrMenus() {
		return ivrMenus;
	}

	public synchronized SipPeer getSipPeerViaLocalNumber(String number) {
		Iterator<SipPeer> ps = peers.values().iterator();
		while (ps.hasNext()) {
			SipPeer peer = ps.next();
			if (peer.getLocalNum() != null
					&& peer.getExtenType().equals(Fields.Local)
					&& peer.getLocalNum().equals(number)) {
				return peer;
			}
		}
		return null;
	}
	
	public synchronized SipPeer getSipPeerViaUserIdAndExtenType(String userId,String extenType){
		if (userId == null)
			return null;
		if (extenType == null)
			return null;
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if (user.getId().equals(userId)) {
				if(user.getOwnSipNums().get(extenType) != null){
					return peers.get(user.getOwnSipNums().get(extenType));
				}
				return null;
			}
		}
		return null;
	}

	public SipPeer getSipPeer(String exten) {
		return peers.get(exten);
	}

	public User getUser(String id) {
		return users.get(id);
	}

	public synchronized SipPeer getSipPeerViaUser(String userID) {
		Iterator<SipPeer> ps = peers.values().iterator();
		while (ps.hasNext()) {
			SipPeer peer = ps.next();
			if (peer.getUserID() != null && peer.getUserID().equals(userID)) {
				return peer;
			}
		}
		return null;
	}

	public synchronized SipPeer getSipPeerViaUser(String userID,
			String extenType) {
		Iterator<SipPeer> ps = peers.values().iterator();
		while (ps.hasNext()) {
			SipPeer peer = ps.next();
			if (peer.getUserID() != null && peer.getUserID().equals(userID)
					&& peer.getExtenType().equals(extenType)) {
				return peer;
			}
		}
		return null;
	}

	public synchronized User getUserViaUserId(String userId) {
		if (userId == null)
			return null;
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if (user.getId().equals(userId)) {
				return user;
			}
		}
		return null;
	}

	public synchronized User getUserViaSipNum(String exten) {
		if (exten == null)
			return null;
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if (user.getSipNum() != null && user.getSipNum().equals(exten)) {
				return user;
			}
			if(user.getOwnSipNums().get(Fields.sip) != null && user.getOwnSipNums().get(Fields.sip).equals(exten)){
				return user;
			}
			if(user.getOwnSipNums().get(Fields.gateway) != null && user.getOwnSipNums().get(Fields.gateway).equals(exten)){
				return user;
			}
			if(user.getOwnSipNums().get(Fields.Local) != null && user.getOwnSipNums().get(Fields.Local).equals(exten)){
				return user;
			}
		}
		return null;
	}

	public synchronized User getUserViaLocalNum(String exten) {
		if (exten == null)
			return null;
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if (user.getLocalNumber() != null
					&& user.getLocalNumber().equals(exten)) {
				return user;
			}
		}
		return null;
	}

	public synchronized User getUserViaExten(String exten) {
		if (exten == null)
			return null;
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if (user.getExten() != null && user.getExten().equals(exten)) {
				return user;
			}
		}
		return null;
	}
	
	public synchronized User getUserViaCallerIDNum(String callerIDNum) {
		if (callerIDNum == null)
			return null;
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if (user.getCallerIDNum() != null && user.getCallerIDNum().equals(callerIDNum)) {
				return user;
			}
		}
		return null;
	}

	public synchronized User getUserViaName(String name) {
		if (name == null)
			return null;
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if (user.getUser().equals(name)) {
				return user;
			}
		}
		return null;
	}

	public synchronized List<String> getOnlineUser() {
		List<String> list = new ArrayList<String>();
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if (user.isLogin()) {
				list.add(user.getId());
			}
		}
		return list;
	}
	
	public synchronized List<String> getIdleUser() {
		List<String> list = new ArrayList<String>();
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if (user.isLogin() && !user.isBusy()) {
				list.add(user.getId());
			}
		}
		return list;
	}
	
	public C5Queue getQueueByDisplayName(String name){
		Iterator it = queues.values().iterator();
		C5Queue queue = null;
		while(it.hasNext()){
			C5Queue tempQueue = (C5Queue)it.next();
			if(tempQueue.getDisplayName().equals(name)){
				queue = tempQueue;
				break;
			}
		}
		return queue;
	}
	
	public synchronized int getIdleAndReserveUser() {
		if(queues.size() == 0){
			return 0;
		}
		C5Queue queue = queues.values().iterator().next();
		return (queue.getQueueMemberCount() - queue.getBusyMemberCount());
	}
	
	public synchronized int getIdleAndReserveUser(String queueExten) {
		if(queueExten == null){
			return 0;
		}
		if(queues.size() == 0){
			return 0;
		}
		C5Queue queue = null;
		Iterator<C5Queue> ite = queues.values().iterator();
		while(ite.hasNext()){
			C5Queue tmpQueue = ite.next();
			if(tmpQueue.getExten().equals(queueExten)){
				queue = tmpQueue;
			}
		}
		if(queue == null){
			return 0;
		}
		return (queue.getQueueMemberCount() - queue.getBusyMemberCount());
	}
	
	public synchronized List<String> getUserLoginByVersion(String userVersion){
		List<String> list = new ArrayList<String>();
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User u = it.next();
			if (u.isLogin()
					&& u.getVersion().equals(userVersion)
					&& !u.getUser().startsWith("admin")) {
				list.add(u.getId());
			}
		}
		return list;
	}

	public synchronized List<String> getUserLoginApp() {
		List<String> list = new ArrayList<String>();
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if (user.isLogin()
					&& user.getExtenType().equalsIgnoreCase(Fields.none)
					&& !user.getUser().startsWith("admin")) {
				list.add(user.getId());
			}
		}
		return list;
	}

	public synchronized List<String> getUserOfCall() {
		List<String> list = new ArrayList<String>();
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if (user.isLogin() && !user.getExtenType().equals("")) {
				if (!user.getExtenType().equalsIgnoreCase(Fields.none)
						&& !user.getUser().startsWith("admin")) {
					list.add(user.getId());
				}
			} else if (user.getSipNum() != null && !user.getExtenType().equals(Fields.none) && !user.getExtenType().equals("")) {
				list.add(user.getId());
			}
		}
		return list;
	}
	
	public synchronized List<String> getUserOfCall(String version) {
		List<String> list = new ArrayList<String>();
		Iterator<User> it = users.values().iterator();
		while (it.hasNext()) {
			User user = it.next();
			if(user.getVersion().equalsIgnoreCase(version)){
				if (user.isLogin() && !user.getExtenType().equals("")) {
					if (!user.getExtenType().equalsIgnoreCase(Fields.none)
							&& !user.getUser().startsWith("admin")) {
						list.add(user.getId());
					}
				} else if (user.getSipNum() != null && !user.getExtenType().equals(Fields.none) && !user.getExtenType().equals("")) {
					list.add(user.getId());
				}				
			}
		}
		return list;
	}
	
	public SatisfactionOptions getSatistionOptions(){
		return this.satisfactionOptions;
	}

	public synchronized void setInvestigateMusic(String investigateMusic)
			throws Exception {
		this.investigateMusic = investigateMusic;
		ACSStorage.updateAccount(this);
	}

	public void setInvestigateMusicFile(String investigateMusic) {
		this.investigateMusic = investigateMusic;
	}

	private void addDidNum(String number) {
		if (number == null || number.trim().equalsIgnoreCase(""))
			return;
		if (number.startsWith(ASConfig.getInstance().getDistrictNo(account))) {
			if (!didNumbers.contains(number))
				didNumbers.add(number);
			number = number.substring(ASConfig.getInstance().getDistrictNo(account).length());
		} else if (Utils.isMobileNo(number)) {
			if (!didNumbers.contains("0" + number))
				didNumbers.add("0" + number);
		} else if (number.startsWith("0") && Utils.isMobileNo(number.substring(1))) {
			number = number.substring(1);
		}
		if (!didNumbers.contains(number))
			didNumbers.add(number);
	}

	private void updateDidNum() {
		didNumbers.clear();
		Iterator<User> it = this.users.values().iterator();
		while (it.hasNext()) {
			User peer = it.next();
			if (peer.getLocalNumber() != null) {
				this.addDidNum(peer.getLocalNumber());
			}
		}
		try {
			AELProvider.updateServiceNo(serviceNos, this);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public CallReport getCallReport() {
		return callReport;
	}
	
	public BatchDialoutor getBatchDialoutor() {
		return batchDialoutor;
	}

	public void setBatchDialoutor(BatchDialoutor batchDialoutor) {
		this.batchDialoutor = batchDialoutor;
	}

	public int getMonitorDuration() {
		return monitorDuration;
	}

	public void setMonitorDuration(int monitorDuration) {
		this.monitorDuration = monitorDuration;
	}
	
	public HashMap<String, String> getWebcallTtsGenerateMap() {
		return webcallTtsGenerateMap;
	}
	public void setWebcallTtsGenerateMap(
			HashMap<String, String> webcallTtsGenerateMap) {
		this.webcallTtsGenerateMap = webcallTtsGenerateMap;
	}

	public HashMap<String, HashMap<String, String>> getChatingIvrPlayVarMap() {
		return chatingIvrPlayVarMap;
	}

	public void setChatingIvrPlayVarMap(
			HashMap<String, HashMap<String, String>> chatingIvrPlayVarMap) {
		this.chatingIvrPlayVarMap = chatingIvrPlayVarMap;
	}

	public C5Event getStateEvent() {
		C5Event event = new C5Event(Fields.AccountStatus);
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, this.account);
		event.addParameter(Fields.Name, this.name);
		if (this.transferLine != null)
			event.addParameter(Fields.TransferPrefix, this.transferLine
					.getExten());
		if (this.dialoutLine != null)
			event.addParameter(Fields.DialoutPrefix, this.dialoutLine
					.getExten());
		return event;
	}
	
	public String getSipContact(String phoneNo, String callType) {
		String a = "";
		if(callType.equals(Fields.XferFlag)) {
			phoneNo = getFixedNumber(phoneNo, this.transferLine.isNeedPrefix());
			a = this.account+Fields.XferFlag+transferLine.getExten()+phoneNo;
		} else {
			phoneNo = getFixedNumber(phoneNo, dialoutLine.isNeedPrefix());
			a = this.account+Fields.DialoutFlag+dialoutLine.getExten()+phoneNo;
		}
		return a;
	}
	
	public List<String> getAutoCalls() {
		return autoCalls;
	}

	public void addAutoCalls(String callID) {
		if(!this.autoCalls.contains(callID))
			autoCalls.add(callID);
	}
	
	public synchronized void addOrUpdateAutoCallTask(AutoCallTask task)throws Exception {
		if (task == null)
			return;
		this.autoCallTasks.put(task.getTaskId(), task);
//		servicePeers.put(task.getTaskId(), task);
		ACSStorage.updateAutoCallTask(pbx, account, autoCallTasks);
	}
	
	public synchronized void deleteAutoCallTask(String taskId)throws Exception {
		this.autoCallTasks.remove(taskId);
//		servicePeers.remove(taskId);
		ACSStorage.updateAutoCallTask(pbx, account, autoCallTasks);
	}
	
	public synchronized void startTimeAutoCallTask(AutoCallTask task)throws Exception {
		if (task == null)
			return;
		task.setStart(true);
		this.autoCallTasks.put(task.getTaskId(), task);
		servicePeers.put(task.getTaskId(), task);
		ACSStorage.updateAutoCallTask(pbx, account, autoCallTasks);
	}
	
	public synchronized void stopTimeAutoCallTask(AutoCallTask task)throws Exception {
		if (task == null)
			return;
		task.setStart(false);
		this.autoCallTasks.put(task.getTaskId(), task);
		servicePeers.put(task.getTaskId(), task);
		ACSStorage.updateAutoCallTask(pbx, account, autoCallTasks);
	}
	
	public String getDidNum(String callType) {
		String a = "";
		if(callType.equals(Fields.XferFlag)) {
			a = transferLine.getDidNum();
			if(transferLine.isNeedPrefix()) {
				if (a.charAt(0) != '0')
					a = ASConfig.getInstance().getDistrictNo(account) + a;
			}
		} else {
			a = dialoutLine.getDidNum();
			if(dialoutLine.isNeedPrefix()) {
				if (a.charAt(0) != '0')
					a = ASConfig.getInstance().getDistrictNo(account) + a;
			}
		}
		return a;
	}
	public String getAutoCallDidNum() {
		String a = "";
		if(dialoutLine.isMultiDidEnable() && dialoutLine.getMultiDidList() != null){
			if(dialoutLine.getMultiDidList().size()>0){
				if(dialoutLine.getMultiDidScope()!=null){
					if(dialoutLine.getMultiDidScope().equals("all") || dialoutLine.getMultiDidScope().equals("auto")){
						if(dialoutLine.getMultiDidStrategy().equals("order")){
							if(dialoutLine.getMultiDidIndex() > dialoutLine.getMultiDidList().size()-1){
								dialoutLine.setMultiDidIndex(0);
							}
							a = dialoutLine.getMultiDidList().get(dialoutLine.getMultiDidIndex());
							if(dialoutLine.getMultiDidIndex() >= dialoutLine.getMultiDidList().size()-1){
								dialoutLine.setMultiDidIndex(0);
							}else{
								dialoutLine.setMultiDidIndex(dialoutLine.getMultiDidIndex()+1);
							}
						}else if(dialoutLine.getMultiDidStrategy().equals("random")){
							a =  dialoutLine.getMultiDidList().get(Utils.getScopeRandom(0, dialoutLine.getMultiDidList().size()));
						}
					}
				}				
			}
		}
		if(a.equals("")){
			a = dialoutLine.getDidNum();				
		}
		if(dialoutLine.isNeedPrefix()) {
			if (a.charAt(0) != '0')
				a = ASConfig.getInstance().getDistrictNo(account) + a;
		}
		return a;
	}
	
	public boolean isBeyondLicense(){
		int loginedCount = getUserOfCall().size();
//		int lisenceCount = lisence.getCallCount();
		int lisenceCount = lisence.getCount(Fields.VersionEnterprise) + lisence.getCount(Fields.VersionOutCall) +
					lisence.getCount(Fields.VersionMonitor) + lisence.getCount(Fields.VersionService) + lisence.getCount(Fields.VersionOutcallSpecial) + 
					lisence.getCount(Fields.VersionStandard) + lisence.getCount(Fields.VersionIVR) + lisence.getCount(Fields.VersionBusiness) + lisence.getCount(Fields.VersionOrder);
		if (lisenceCount > -1 && (lisenceCount == 0 || (lisenceCount - loginedCount) < 1)) {
			lisence = C5LisenceHandler.updateLisence(this);
			// no enough call license 601
			lisenceCount = lisence.getCallCount();
			if (lisence != null && lisenceCount > -1 && (lisenceCount == 0 || (lisenceCount - loginedCount) < 1)) {
				return true;
			}
		}
		return false;
	}
	
	public boolean isBeyondLicense(String version){
		int loginedCount = getUserOfCall(version).size();
		int lisenceCount = lisence.getCount(version);
		if (lisenceCount > -1 && (lisenceCount == 0 || (lisenceCount - loginedCount) < 1)) {
			lisence = C5LisenceHandler.updateLisence(this);
			// no enough call license 601
			lisenceCount = lisence.getCount(version);
			if (lisence != null && lisenceCount > -1 && (lisenceCount == 0 || (lisenceCount - loginedCount) < 1)) {
				return true;
			}
		}
		return false;
	}

	public void destruct() {
		users.clear();

		queues.clear();
		peers.clear();
		serviceNos.clear();
		webCalls.clear();
		blackLists.clear();
		musics.clear();
		announcements.clear();
		timeConditions.clear();
		ivrs.clear();
		callUrls.clear();
		twowayCalls.clear();
		validations.clear();
		vms.clear();
		dialextenNodes.clear();
		dynamicRouteNodes.clear();
		servicePeers.clear();
		encryptMD5s.clear();
		textAnnouncements.clear();
		rooms.clear();

		extenFields.clear(); // Aman zhai. 2010.05.10

	}
}
