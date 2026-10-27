package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.Vector;

import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.ServicePeer;
import com.m7.cc.util.Utils;

public class SipPeer implements ServicePeer{
	public static final String NAME = "ACSSipPeer";
	
	public static final String speex = "speex";
	public static final String g729 = "g729";
	public static final String gsm = "gsm";
	public static final String alaw = "alaw";
	
	public final static String REGISTERED = "Registered";
	public final static String UNREGISTERED = "Unregistered";
	public final static String REACHABLE = "Reachable";
	public final static String UNREACHABLE = "Unreachable";
	
	public final static String REMOVED = "Removed";
	public final static String IDLE = "Idle";
	public final static String INBOUND_CALL = "InboundCall";
	public final static String OUTBOUND_CALL = "OutboundCall";
	public final static String CONSULT = "Consult";
	public final static String LISTENNING = "listen";
	public final static String LOOT = "Loot";
	public final static String TO_IVR = "ToIVR";
	public final static String WEBCALL = "webcall";
	
	public final static String sip = "sip";
	public final static String gateway = "gateway";
	public final static String Local = "Local";
	public final static String none = "none";
	
	private boolean isLocal = false;
	private String pbx;
	private String account;
	private String context;
	private String exten;
	private String secret;
	private String name;
	private boolean nat = true;
	private String type = "friend";
	private String host = "dynamic";
	private boolean canreinvite = false;
	private long call_limit = 1;
	private boolean qualify = true;
	private Vector<String> allow = new Vector<String>();
	
	//local sip peer
	private String fromuser;
	private String username;
	private int port;
	private String localNum;
	
	//----------------------------------------------------------
	//Channel type should be one of these "SIP, ZAP, IAX"
	private String channelType = "";
	private String peerStatus = UNREGISTERED;
	private String status = "-1";
	
	private Vector<C5Channel> channels = new Vector<C5Channel>();
	
	//These parameters are not needed by c5----------------------
	//peer
	private String chanObjectType = "";
	private boolean ACL = false;
	
	private String ipPort = "";
	private String ipAddress = "";
	private String objectName = "";
	private boolean dynamic = true;
	private boolean natSupport = true;
	private boolean realtimeDevice = false;
	private boolean videoSupport = false;
	//-------------------------------------------------------------
	private String sipUseragent = "";
	private String regContact = "";
	
	private User user;
	private String linkedChannel = "";
	private String originateChannel = "";
	private String callSheetId = "";
	
	private String displayName;
	private String extenType = sip;
	private String userID;
	
	public SipPeer(){
		allow.add(speex);
		allow.add(g729);
		allow.add(gsm);
		this.displayName = "";
	}
	
	public SipPeer(String pbx, String account, String exten){
		this.pbx = pbx;
		this.account = account;
		this.exten = exten;
		this.context = account;
		this.name = exten;
		allow.add(speex);
		allow.add(g729);
		allow.add(gsm);
		this.displayName = "sippeer-" + exten;
	}

	public String getSecret() {
		return secret;
	}

	public void setSecret(String secret) {
		this.secret = secret;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getPbx() {
		return pbx;
	}

	public String getAccount() {
		return account;
	}

	public String getExten() {
		return exten;
	}

	public boolean isNat() {
		return nat;
	}

	public void setNat(boolean nat) {
		this.nat = nat;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getHost() {
		return host;
	}

	public void setHost(String host) {
		this.host = host;
	}

	public boolean isCanreinvite() {
		return canreinvite;
	}

	public void setCanreinvite(boolean canreinvite) {
		this.canreinvite = canreinvite;
	}

	public long getCall_limit() {
		return call_limit;
	}

	public void setCall_limit(long call_limit) {
		this.call_limit = call_limit;
	}

	public boolean isQualify() {
		return qualify;
	}

	public void setQualify(boolean qualify) {
		this.qualify = qualify;
	}
	
	public void addAllowAudioCodec(String codec){
		allow.add(codec);
	}
	
	public void removeAllowAudioCodec(String codec){
		allow.remove(codec);
	}
	
	public void removeAllAllowAudioCodec() {
		allow.clear();
	}
	
	public Vector<String> getAllow() {
		return allow;
	}

	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
	}

	public boolean isLocal() {
		return isLocal;
	}

	public String getFromuser() {
		return fromuser;
	}

	public void setFromuser(String fromuser) {
		this.fromuser = fromuser;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public int getPort() {
		return port;
	}

	public void setPort(int port) {
		this.port = port;
	}
	
	public void setPort(String port) {
		this.port = Integer.valueOf(port);
	}

	public void setLocal(boolean isLocal) {
		this.isLocal = isLocal;
	}

	public void setChannelType(String channelType) {
		this.channelType = channelType;
	}

	public void setExten(String exten) {
		this.exten = exten;
	}

	public void setChannels(Vector<C5Channel> channels) {
		this.channels = channels;
	}

	public String getChannelType() {
		return channelType;
	}

	public String getChanObjectType() {
		return chanObjectType;
	}

	public void setChanObjectType(String chanObjectType) {
		this.chanObjectType = chanObjectType;
	}

	public boolean isACL() {
		return ACL;
	}

	public void setACL(boolean acl) {
		ACL = acl;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getIpPort() {
		return ipPort;
	}

	public void setIpPort(String ipPort) {
		this.ipPort = ipPort;
	}

	public String getIpAddress() {
		return ipAddress;
	}

	public void setIpAddress(String ipAddress) {
		this.ipAddress = ipAddress;
	}

	public boolean isDynamic() {
		return dynamic;
	}

	public void setDynamic(boolean dynamic) {
		this.dynamic = dynamic;
	}

	public boolean isNatSupport() {
		return natSupport;
	}

	public void setNatSupport(boolean natSupport) {
		this.natSupport = natSupport;
	}

	public boolean isRealtimeDevice() {
		return realtimeDevice;
	}

	public void setRealtimeDevice(boolean realtimeDevice) {
		this.realtimeDevice = realtimeDevice;
	}

	public boolean isVideoSupport() {
		return videoSupport;
	}

	public void setVideoSupport(boolean videoSupport) {
		this.videoSupport = videoSupport;
	}

	public String getPeerStatus() {
		return peerStatus;
	}

	public void setPeerStatus(String peerStatus) {
		this.peerStatus = peerStatus;
	}
	
	public String getLocalNum() {
		return localNum;
	}

	public void setLocalNum(String localNum) {
		this.localNum = localNum;
	}

	public String getObjectName() {
		return objectName;
	}

	public void setObjectName(String objectName) {
		this.objectName = objectName;
	}

	public User getUser() {
		if(user == null){
			try {
				C5Account account = RuntimeData.getInstance().getAccount(pbx, this.account);
				if(account != null){
					user = account.getUserViaSipNum(exten);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
			
		}
		return user;
	}

	public void setUser(User user) {
		this.user = user;
		if(user != null)
			this.userID = user.getId();
	}

	public String getLinkedChannel() {
		return linkedChannel;
	}

	public void setLinkedChannel(String linkedChannel) {
		this.linkedChannel = linkedChannel;
	}
	
	public String getOriginateChannel() {
		return originateChannel;
	}

	public void setOriginateChannel(String originateChannel) {
		this.originateChannel = originateChannel;
	}

	public String getCallSheetId() {
		return callSheetId;
	}

	public void setCallSheetId(String callSheetId) {
		this.callSheetId = callSheetId;
	}

	public String getSipUseragent() {
		return sipUseragent;
	}

	public void setSipUseragent(String sipUseragent) {
		this.sipUseragent = sipUseragent;
	}

	public String getRegContact() {
		return regContact;
	}

	public void setRegContact(String regContact) {
		this.regContact = regContact;
	}

	/**
	 * speex,g729,gsm
	 * @return
	 */
	public String getAllowString(){
		String a = "";
		for(int i=0;i<allow.size();i++){
			a += allow.get(i)+",";
		}
		if(a.endsWith(","))
			a = a.substring(0, a.length() - 1);
		return a;
	}
	
	public boolean hasChannel(C5Channel channelName){
		if(channels.contains(channelName))
			return true;
		else return false;
	}
	
	public void addChannel(C5Channel channel){
		if(channels.contains(channel))
			return;
		//in c5 system, only one channel can be held by a peer
		channels.clear();
		channels.add(channel);
		channel.setSipPeer(this);
	}

	/**
	 * Remove a channel from this device
	 * 
	 * @param Channel
	 *            the channel to remove
	 * @return the removed channel or null if specified channel did not exist
	 */
	public void removeChannel(C5Channel channel) {
		if(!channels.contains(channel))
			return;
		channels.remove(channel);
	}

	/**
	 * Get a list of all the channels on this device
	 * 
	 * @return channel list or null if no channels exist
	 */
	public Vector<C5Channel> getChannels() {
		return channels;
	}

	/**
	 * Remove all the channels of this device
	 */
	public void removeAllChannels() {
		channels.clear();
	}
	
	public C5Event getStateEvent(){
		C5Event event = new C5Event(Fields.PeerStatus);
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.Exten, exten);
		event.addParameter(Fields.Secret, this.secret);
		event.addParameter(Fields.PeerStatus, peerStatus);
		event.addParameter(Fields.Context, context);
		event.addParameter(Fields.Status, status);
		event.addParameter(Fields.Address, ipAddress);
		event.addParameter(Fields.Port, ipPort);
		event.addParameter(Fields.ObjectName, objectName);
		event.addParameter(Fields.Timestamp, Utils.getCurrentTimestamp());
		event.addParameter(Fields.DisplayName, this.displayName);
		event.addParameter(Fields.ExtenType, this.extenType);
		if(this.user != null){
			event.addParameter(Fields.UserID, user.getId());
			event.addParameter(Fields.User, user.getUser());
			event.addParameter(Fields.Account, user.getAccount());
		}
		else event.addParameter(Fields.UserID, userID);
		
		event.addParameter(Fields.SipUseragent, this.sipUseragent);
		event.addParameter(Fields.RegContact, this.regContact);
		return event;
	}

	
	/**
	 * Deallocation method
	 */
	public void destruct() {
		channels.clear();
		channels = null;
	}

	public String getActionString() {
		return "goto "+account+"-dial,"+exten+", 1";
	}
	
	public String getServicePeerName() {
		return NAME;
	}
	
	public void addValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void setValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "sippeer-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	public String getExtenType() {
		return extenType;
	}

	public void setExtenType(String extenType) {
		this.extenType = extenType;
	}

	public String getUserID() {
		return userID;
	}

	public void setUserID(String userID) {
		this.userID = userID;
	}
	
}
