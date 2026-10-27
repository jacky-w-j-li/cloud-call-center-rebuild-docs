package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;
import java.util.Set;
import java.util.TimerTask;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.C5Connection;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.ServicePeer;
import com.m7.cc.util.Utils;

public class User implements ServicePeer{
	private static Logger log = Logger.getLogger(User.class.getName());
	public static final String NAME = "User";
	
	public final static String REMOVED = "Removed";
	public final static String IDLE = "Idle";
	public final static String INBOUND_CALL = "InboundCall";
	public final static String OUTBOUND_CALL = "OutboundCall";
	public final static String CONSULT = "Consult";
	public final static String LISTENNING = "listen";
	public final static String LOOT = "Loot";
	public final static String TO_IVR = "ToIVR";
	public final static String WEBCALL = "webcall";
	
	private String account;
	private String pbx;
	private String id;
	private String user;
	private String exten;
	private String password;
	private String localNumber;
	private String displayName;
	private String version;
	private boolean sendShanxin = false;
	//all sip numbers of user own
	private Hashtable<String, String> ownSipNums = new Hashtable<String, String>();
	
	//runtime status fields
	private boolean  busy = false;
	private String busyType = Fields.B00;
	private String sipNum;
	private C5Connection connection;
	private String extenType = "";
	private boolean login = false;
	private String loginTimestamp = "";
	private String busyTimestamp = "";
	private Vector<String> queues = new Vector<String>();
	private boolean reserve = false;
	private String didNum = "";
	private String status = IDLE;
	private String browser;
	
	private String ucExtenType = Fields.sip;
	
	//The time which agent will be setted busy for. In second. 
	private int autoBusyTime = 0;
	private Hashtable<String, String> data = new Hashtable<String, String>();
	
	//calls in current day
	private int inCalls = 0;
	private int inCallsCompleted = 0;
	private int transferCalls = 0;
	private int transferCallsCompleted = 0;
	private int outCalls = 0;
	private int outCallsCompleted = 0;
	private int dialinTimeLength = 0;
	private int dialoutTimeLength = 0;
	
	private boolean originalBusy = false;
	private String originalBusyType = "0";
	private TimerTask autoBusyTimerTask = null;
	private TimerTask mailDispatcherTimerTask = null;
	private String logoffComments = "";
	private String callerIDNum = "";
	private String currentRandomCallerIDNum = "";
	
	private Mail waitAcceptMail = null;
	private Vector<String> mailQueues = new Vector<String>();
	private Vector<String> weixinSessionFromList = new Vector<String>();
	private Vector<String> webchatSessionFromList = new Vector<String>();
	
	public User(String pbx, String account, String id){
		this.pbx = pbx;
		this.account = account;
		this.id = id;
		this.displayName = "user-0";
	}
	
	public boolean setValues(Hashtable<String, String> map){
		try{
			if (map.containsKey(Fields.DisplayName))
				this.displayName = map.get(Fields.DisplayName);
			if (map.containsKey(Fields.Exten))
				exten = map.get(Fields.Exten);
			if (map.containsKey(Fields.SipNum));
				this.sipNum = map.get(Fields.SipNum);
			if (map.containsKey(Fields.Password))
				this.password = map.get(Fields.Password);
			if (map.containsKey(Fields.User))
				this.user = map.get(Fields.User);
			if (map.containsKey(Fields.Local))
				this.localNumber = map.get(Fields.Local);
			if (map.containsKey(Fields.AutoBusyTime))
				this.autoBusyTime = Integer.valueOf(map.get(Fields.AutoBusyTime));
			if (map.containsKey(Fields.OwnSipNums))
				this.setOwnSipNums(map.get(Fields.OwnSipNums).toString());
			if (map.containsKey(Fields.Version))
				this.version = map.get(Fields.Version);
			if (map.containsKey(Fields.UCExtenType))
				this.ucExtenType = map.get(Fields.UCExtenType);
			if (map.containsKey(Fields.CallerIDNum))
				this.callerIDNum = map.get(Fields.CallerIDNum);
			if (map.containsKey(Fields.SendShanxin))
				this.setSendShanxin(Boolean.valueOf(map.get(Fields.SendShanxin)));
		} catch (Exception e){
			return false;
		}
		return true;
	}
	
	public String getConfigString(){
		String str = "["+user+"]"+Fields.END_LINE
					+ Fields.id +"="+this.id+Fields.END_LINE
					+ Fields.Password +"="+this.password+Fields.END_LINE
					+ Fields.AutoBusyTime +"="+this.autoBusyTime+Fields.END_LINE
					+ (exten == null?"":(Fields.Exten +"="+this.exten+Fields.END_LINE))
					+ (localNumber==null?"":(Fields.Local +"="+this.localNumber+Fields.END_LINE))
					+ (displayName==null?"":(Fields.DisplayName +"="+this.displayName+Fields.END_LINE))
					+ Fields.OwnSipNums+"="+this.getOwnSipNumsConf()+Fields.END_LINE
					+ Fields.Version+"="+this.version+Fields.END_LINE
					+ Fields.UCExtenType+"="+this.ucExtenType+Fields.END_LINE
					+ Fields.CallerIDNum+"="+this.callerIDNum+Fields.END_LINE
					;
		return str;
	}

	public String getSipNum() {
		return sipNum;
	}

	public void setSipNum(String sipNum) {
		this.sipNum = sipNum;
	}

	public String getExten() {
		return exten;
	}

	public void setExten(String exten) {
		this.exten = exten;
	}

	public String getLocalNumber() {
		return localNumber;
	}

	public void setLocalNumber(String localNumber) {
		this.localNumber = localNumber;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getAccount() {
		return account;
	}

	public String getPbx() {
		return pbx;
	}

	public String getId() {
		return id;
	}

	public String getUser() {
		return user;
	}

	public void setUser(String user) {
		this.user = user;
	}
	
	public boolean isBusy() {
		return busy;
	}

	public void setBusy(boolean busy) {
		this.busy = busy;
		busyTimestamp = Utils.getCurrentTimestamp();
	}

	public String getExtenType() {
		return extenType;
	}

	public void setExtenType(String extenType) {
		this.extenType = extenType;
	}

	public int getAutoBusyTime() {
		return autoBusyTime;
	}

	public void setAutoBusyTime(int autoBusyTime) {
		this.autoBusyTime = autoBusyTime;
	}

	public boolean isLogin() {
		return login;
	}

	public void setLogin(boolean login) {
		this.login = login;
		this.loginTimestamp = Utils.getCurrentTimestamp();
	}

	public String getLoginTimestamp() {
		return loginTimestamp;
	}

	public void setLoginTimestamp(String loginTimestamp) {
		this.loginTimestamp = loginTimestamp;
	}
	

	public Vector<String> getMailQueues() {
		return mailQueues;
	}

	public void addMailQueue(String mqueue){
		if(!mailQueues.contains(mqueue))
			mailQueues.add(mqueue);
	}
	
	public void removeAllMailQueues(){
		mailQueues.clear();
	}
	
	public void setMailQueues(String[] mqueues) {
		this.mailQueues.clear();
		for(int i=0;i<mqueues.length;i++){
			this.addMailQueue(mqueues[i]);
		}
	}
	
	public void setMailQueues(List<String> mqueues) {
		this.mailQueues.clear();
		for(int i=0;i<mqueues.size();i++){
			this.addQueue(mqueues.get(i));
		}
	}

	public Vector<String> getQueues() {
		return queues;
	}

	public void addQueue(String queue){
		if(!queues.contains(queue))
			queues.add(queue);
	}
	
	public void removeAllQueues(){
		queues.clear();
	}
	
	public void setQueues(String[] queues) {
		this.queues.clear();
		for(int i=0;i<queues.length;i++){
			this.addQueue(queues[i]);
		}
	}
	
	public void setQueues(List<String> queues) {
		this.queues.clear();
		for(int i=0;i<queues.size();i++){
			this.addQueue(queues.get(i));
		}
	}
	
	public boolean isReserve() {
		return reserve;
	}

	public void setReserve(boolean reserve) {
		this.reserve = reserve;
	}

	public String getDidNum() {
		try{
			if (this.callerIDNum != null && !this.callerIDNum.equals("")){
				//multi user callerIDNum
				if(this.currentRandomCallerIDNum.equals("") && this.callerIDNum.indexOf(",") != -1){
					String[] arry = this.callerIDNum.split(",");
					int random = Utils.getScopeRandom(0, arry.length);
					this.currentRandomCallerIDNum = arry[random];
					return arry[random];
				}else if(this.callerIDNum.indexOf(",") != -1){
					return this.currentRandomCallerIDNum;
				}else{
					return this.callerIDNum;					
				}
			} else {
				didNum = RuntimeData.getInstance().getAccount(pbx, account).getDialoutLine().getDidNum();
				if(didNum == null || didNum.trim().equals(""))
					didNum = "";
			}
		} catch (Exception e){
			didNum = "";
		}
		return didNum;
	}
	
	public String getMultiDidNumEnd() {
		try{
			if (this.callerIDNum != null && !this.callerIDNum.equals("")){
				//multi user callerIDNum
				if(!this.currentRandomCallerIDNum.equals("") && this.callerIDNum.indexOf(",") != -1){
					String temp = this.currentRandomCallerIDNum;
					this.currentRandomCallerIDNum = "";
					return temp;
				}else if(this.callerIDNum.indexOf(",") != -1){
					String[] arry = this.callerIDNum.split(",");
					int random = Utils.getScopeRandom(0, arry.length);
					return arry[random];
				}else {
					return this.callerIDNum;					
				}
			} else {
				didNum = RuntimeData.getInstance().getAccount(pbx, account).getDialoutLine().getDidNum();
				if(didNum == null || didNum.trim().equals(""))
					didNum = "";
			}
		} catch (Exception e){
			didNum = "";
		}
		return didNum;
	}

	public void setDidNum(String didNum) {
		this.didNum = didNum;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}
	
	public String getBrowser() {
		return browser;
	}

	public void setBrowser(String browser) {
		this.browser = browser;
	}
	
	public String getBusyTimestamp() {
		return busyTimestamp;
	}

	public void setBusyTimestamp(String busyTimestamp) {
		this.busyTimestamp = busyTimestamp;
	}
	
	public void addVar(String key, String value){
		data.put(key, value);
	}
	
	public String getVar(String key){
		return data.get(key);
	}
	
	public String removeVar(String key) {
		return data.remove(key);
	}

	public int getInCalls() {
		return inCalls;
	}

	public void setInCalls(int inCalls) {
		this.inCalls = inCalls;
	}

	public int getInCallsCompleted() {
		return inCallsCompleted;
	}

	public void setInCallsCompleted(int inCallsCompleted) {
		this.inCallsCompleted = inCallsCompleted;
	}
	
	public int getTransferCalls() {
		return transferCalls;
	}

	public void setTransferCalls(int transferCalls) {
		this.transferCalls = transferCalls;
	}

	public int getTransferCallsCompleted() {
		return transferCallsCompleted;
	}

	public void setTransferCallsCompleted(int transferCallsCompleted) {
		this.transferCallsCompleted = transferCallsCompleted;
	}

	public int getOutCalls() {
		return outCalls;
	}

	public void setOutCalls(int outCalls) {
		this.outCalls = outCalls;
	}

	public int getOutCallsCompleted() {
		return outCallsCompleted;
	}

	public void setOutCallsCompleted(int outCallsCompleted) {
		this.outCallsCompleted = outCallsCompleted;
	}
	
	public int getDialoutTimeLength() {
		return dialoutTimeLength;
	}

	public void setDialoutTimeLength(int dialoutTimeLength) {
		this.dialoutTimeLength = dialoutTimeLength;
	}
	
	public int getDialinTimeLength() {
		return dialinTimeLength;
	}

	public void setDialinTimeLength(int dialinTimeLength) {
		this.dialinTimeLength = dialinTimeLength;
	}

	public C5Connection getConnection() {
		return connection;
	}

	public String getBusyType() {
		return busyType;
	}

	public void setBusyType(String busyType) {
		this.busyType = busyType;
		if(!this.busyType.equals("99") && this.autoBusyTimerTask != null){
			autoBusyTimerTask.cancel();
			autoBusyTimerTask = null;
		}
	}

	public void setConnection(C5Connection connection) {
		this.connection = connection;
	}

	public C5Event getStateEvent() {
		C5Event event = new C5Event(Fields.UserStatus);
		event.addParameter(Fields.Exten, this.exten);
		event.addParameter(Fields.SipNum, this.sipNum);
		event.addParameter(Fields.Account, this.account);
		event.addParameter(Fields.PBX, this.pbx);
		event.addParameter(Fields.Busy, this.busy);
		event.addParameter(Fields.AutoBusyTime, this.autoBusyTime);
		event.addParameter(Fields.BusyType, this.busyType);
		event.addParameter(Fields.Login, this.login);
		event.addParameter(Fields.LoginTimestamp, this.loginTimestamp);
		event.addParameter(Fields.BusyTimestamp, this.busyTimestamp);
		event.addParameter(Fields.ExtenType, this.extenType);
		event.addParameter(Fields.Local, this.localNumber);
		event.addParameter(Fields.UserID, this.id);
		event.addParameter(Fields.User, this.user);
		event.addParameter(Fields.Version, this.version);
		event.addParameter(Fields.Reserve, this.reserve);
		event.addParameter(Fields.C5Status, this.status);
		event.addParameter(Fields.Browser, this.browser);
		event.addParameter(Fields.InCalls, this.inCalls);
		event.addParameter(Fields.InComplete, this.inCallsCompleted);
		event.addParameter(Fields.TransferCalls, this.transferCalls);
		event.addParameter(Fields.TransferComplete, this.transferCallsCompleted);
		event.addParameter(Fields.OutCalls, this.outCalls);
		event.addParameter(Fields.OutComplete, this.outCallsCompleted);
		event.addParameter(Fields.DisplayName, this.displayName);
		event.addParameter(Fields.UCExtenType, this.ucExtenType);
		event.addParameter(Fields.DialinTimeLength, this.dialinTimeLength);
		event.addParameter(Fields.DialoutTimeLength, this.dialoutTimeLength);
		
		try{
			if(this.sipNum != null && !this.extenType.equals("") 
					&& !this.extenType.equals(Fields.none)){
				SipPeer peer = RuntimeData.getInstance().getSipPeer(pbx, sipNum);
				if(peer != null){
					event.addParameter(Fields.PeerStatus, peer.getPeerStatus());
					if(peer.getPeerStatus().equals(SipPeer.REGISTERED))
						event.addParameter(Fields.Status, peer.getStatus());
					else event.addParameter(Fields.Status, "-1");
				}
				else {
					event.addParameter(Fields.PeerStatus, SipPeer.REGISTERED);
				}
				
				if(peer == null || !peer.isLocal())
					event.addParameter(Fields.LoginExten, this.exten);
				else event.addParameter(Fields.LoginExten, peer.getLocalNum());
			} else {
				event.addParameter(Fields.PeerStatus, SipPeer.UNREGISTERED);
				event.addParameter(Fields.Status, "");
			}
		} catch (Exception e){
		}
		return event;
	}

	public String getActionString() {
		return "goto "+account+"-dialin,"+exten+", 1";
	}

	/**
	 * Static parameters of user will be setted.
	 * Not inlucde [runtime status fields] and [calls in current day]
	 */
	public void setValues(HashMap<String, Object> map) {
		if (map.containsKey(Fields.DisplayName))
			this.displayName = (String) map.get(Fields.DisplayName);
		if (map.containsKey(Fields.Exten))
			exten = (String) map.get(Fields.Exten);
		if (map.containsKey(Fields.Password))
			this.password = (String) map.get(Fields.Password);
		if (map.containsKey(Fields.User))
			this.user = (String) map.get(Fields.User);
		if (map.containsKey(Fields.Local))
			this.localNumber = (String) map.get(Fields.Local);
		else this.localNumber = null;
		if (map.containsKey(Fields.AutoBusyTime))
			this.autoBusyTime = Integer.valueOf(map.get(Fields.AutoBusyTime).toString());
		if (map.containsKey(Fields.OwnSipNums)) 
			this.setOwnSipNums(map.get(Fields.OwnSipNums).toString());
		if (map.containsKey(Fields.Version))
			this.version = map.get(Fields.Version).toString();
		if (map.containsKey(Fields.UCExtenType))
			this.ucExtenType = map.get(Fields.UCExtenType).toString();
		if (map.containsKey(Fields.CallerIDNum))
			this.callerIDNum  = map.get(Fields.CallerIDNum).toString();
		if (map.containsKey(Fields.SendShanxin))
			this.setSendShanxin(Boolean.valueOf(map.get(Fields.SendShanxin).toString()));
	}

	public String getServicePeerName() {
		return NAME;
	}
	
	public void addValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "user-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	public boolean isOriginalBusy() {
		return originalBusy;
	}

	public void setOriginalBusy(boolean originalBusy) {
		this.originalBusy = originalBusy;
	}

	public String getOriginalBusyType() {
		return originalBusyType;
	}

	public void setOriginalBusyType(String originalBusyType) {
		this.originalBusyType = originalBusyType;
	}

	public TimerTask getAutoBusyTimerTask() {
		return autoBusyTimerTask;
	}

	public void setAutoBusyTimerTask(TimerTask autoBusyTimerTask) {
		this.autoBusyTimerTask = autoBusyTimerTask;
	}

	public TimerTask getMailDispatcherTimerTask() {
		return mailDispatcherTimerTask;
	}

	public void setMailDispatcherTimerTask(TimerTask mailDispatcherTimerTask) {
		this.mailDispatcherTimerTask = mailDispatcherTimerTask;
	}
	
	public String getLogoffComments() {
		return logoffComments;
	}

	public void setLogoffComments(String logoffComments) {
		this.logoffComments = logoffComments;
	}

	public Hashtable<String, String> getOwnSipNums() {
		return ownSipNums;
	}

	public void setOwnSipNums(Hashtable<String, String> ownSipNums) {
		this.ownSipNums = ownSipNums;
	}
	
	public String getImExten(String extenType) {
		return ownSipNums.get(extenType);
	}
	
	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}
	
	public boolean isSendShanxin() {
		return sendShanxin;
	}

	public void setSendShanxin(boolean sendShanxin) {
		this.sendShanxin = sendShanxin;
	}

	public Mail getWaitAcceptMail() {
		return waitAcceptMail;
	}

	public void setWaitAcceptMail(Mail waitAcceptMail) {
		this.waitAcceptMail = waitAcceptMail;
	}

	public Vector<String> getWeixinSessionFromList() {
		return weixinSessionFromList;
	}

	public void setWeixinSessionFrom(Vector<String> weixinSessionFromList) {
		this.weixinSessionFromList = weixinSessionFromList;
	}

	public Vector<String> getWebchatSessionFromList() {
		return webchatSessionFromList;
	}

	public void setWebchatSessionFromList(Vector<String> webchatSessionFromList) {
		this.webchatSessionFromList = webchatSessionFromList;
	}

	public String getExtenType(String exten) {
		String ext = ownSipNums.get(Fields.sip);
		if( ext != null &&ext.equals(exten))
			return Fields.sip;
		ext = ownSipNums.get(Fields.gateway);
		if( ext != null &&ext.equals(exten))
			return Fields.gateway;
		ext = ownSipNums.get(Fields.Local);
		if( ext != null &&ext.equals(exten))
			return Fields.Local;
		return null;
	}
	
	private void setOwnSipNums(String sipNumsToken) {
		String[] sipNums = sipNumsToken.split(",");
		if (sipNums.length > 0) {
			String[] arr;
			for (String s : sipNums) {
				arr = s.split(":");
				if (arr[1].equals("none")) {
					if (ownSipNums.containsKey(arr[0])) {
						ownSipNums.remove(arr[0]);
						continue;
					}
				} else {
					ownSipNums.put(arr[0], arr[1]);
				}
			}
		}
	}
	
	private String getOwnSipNumsConf(){
		if(this.ownSipNums.size() < 1)
			return "";
		String config = "";
		Set<String> types = this.ownSipNums.keySet();
		for(String type : types){
			config += type+":"+this.ownSipNums.get(type)+",";
		}
		config = config.substring(0, config.length() - 1);
		return config;
	}

	public String getUcExtenType() {
		return ucExtenType;
	}

	public void setUcExtenType(String ucExtenType) {
		this.ucExtenType = ucExtenType;
	}

	public String getUcSipNum() {
		if (ucExtenType == null)
			return null;
		return ownSipNums.get(ucExtenType);
	}

	public void setUcSipNum(String ucSipNum) {
//		this.ucSipNum = ucSipNum;
	}
	
	public String getCallerIDNum() {
		return callerIDNum;
	}

	public String getAvailableCCSipNum() throws Exception {
		if (sipNum != null) {
			SipPeer peer = RuntimeData.getInstance().getAccount(pbx, account)
					.getSipPeer(sipNum);
			if (peer.getExtenType().equals(Fields.sip)
					|| peer.getExtenType().equals(Fields.gateway)) {
				if (peer.getPeerStatus().equals(SipPeer.REGISTERED)) {
					return sipNum;
				}
			} else {
				return sipNum;
			}
		}
		return null;
	}
	
	public String getAvailableCCSipNumForLootCall() throws Exception {
		if (sipNum != null) {
			SipPeer peer = RuntimeData.getInstance().getAccount(pbx, account)
					.getSipPeer(sipNum);
			if (peer.getExtenType().equals(Fields.sip)
					|| peer.getExtenType().equals(Fields.gateway)) {
				if (peer.getPeerStatus().equals(SipPeer.REGISTERED)) {
					return sipNum;
				}
			} else {
				return sipNum;
			}
		}else{
			if(getAvailableGatewayTypeSipNum() != null){
				return getAvailableGatewayTypeSipNum();
			}else{
				return getAvailableSipTypeSipNum();
			}
		}
		return null;
	}

	public String getAvailabeUCSipNum() throws Exception {
		String sipNum = getUcSipNum();
		if (sipNum != null) {
			SipPeer peer = RuntimeData.getInstance().getAccount(pbx, account)
					.getSipPeer(sipNum);
			if (peer.getExtenType().equals(Fields.sip)
					|| peer.getExtenType().equals(Fields.gateway)) {
				if (peer.getPeerStatus().equals(SipPeer.REGISTERED)) {
					return sipNum;
				}
			} else {
				return sipNum;
			}
		}
		return null;
	}

	public String getAvailableSipNum() {
		String sipNo = null;
		try {
			sipNo = getAvailableCCSipNum();
			if (sipNo == null) {
				sipNo = getAvailabeUCSipNum();
			}
			return sipNo;
		} catch (Exception e) {
			log.log(Level.WARNING, e.getMessage(), e);
		}
		return null;
	}

	public String getAvailableGatewayTypeSipNum() {
		String sipNum = ownSipNums.get(Fields.gateway);
		if (sipNum != null) {
			try {
				SipPeer peer = RuntimeData.getInstance()
						.getAccount(pbx, account).getSipPeer(sipNum);
				if (peer.getPeerStatus().equals(SipPeer.REGISTERED)) {
					return sipNum;
				}
			} catch (Exception e) {
				log.log(Level.WARNING, e.getMessage(), e);
			}
		}
		return null;
	}

	public String getAvailableSipTypeSipNum() {
		String sipNum = ownSipNums.get(Fields.sip);
		if (sipNum != null) {
			try {
				SipPeer peer = RuntimeData.getInstance()
						.getAccount(pbx, account).getSipPeer(sipNum);
				if (peer.getPeerStatus().equals(SipPeer.REGISTERED)) {
					return sipNum;
				}
			} catch (Exception e) {
				log.log(Level.WARNING, e.getMessage(), e);
			}
		}
		return null;
	}
}
