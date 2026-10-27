package com.m7.cc.ass.model.configuration;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.Vector;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.ServicePeer;

public class MailQueue implements ServicePeer{
	
	public static final String NAME = "MailQueue";
	
	public static final String PBX = "PBX";
	public static final String ACCOUNT = "Account";
	
	public static final String STRATEGY = "strategy";
	public static final String TIMEOUT = "timeout";
	public static final String WAITCOUNT = "WaitCount";
	public static final String TO_PEER_WHEN_QUEUE_EMPTY = "ToPeerWhenQueueEmpty";
	public static final String JOIN_EMPTY = "joinempty";
	public static final String DISPLAY_NAME = "DisplayName";
	// ringall - ring all available channels until one answers (default)
	// roundrobin - take turns ringing each available interface
	// leastrecent - ring interface which was least recently called by this
	// queue
	// fewestcalls - ring the one with fewest completed calls from this queue
	// random - ring random interface
	// rrmemory - round robin with memory, remember where we left off last ring
	// pass
	public static final String rrmemory = "rrmemory";
	public static final String roundrobin = "roundrobin";
	public static final String leastrecent = "leastrecent";
	public static final String fewestcalls = "fewestcalls";
	public static final String random = "random";
	public static final String ringall = "ringall";

	private String pbx;
	private String account;
	private String exten;
	private String strategy = rrmemory;
	private boolean joinEmpty = true;
	private String toPeerWhenQueueEmpty = "0";
	private int timeout = 15;
	private int waitCount = 3;
	private String displayName;

	public Vector<Mail> mailBuffer = new Vector<Mail>();
	public Vector<WeixinMessage> weixinBuffer = new Vector<WeixinMessage>();
	public Vector<WebchatMessage> webchatBuffer = new Vector<WebchatMessage>();

	private Hashtable<String, String> members = new Hashtable<String, String>();
	public Hashtable<String, MailQueueMember> AIdelMembers = new Hashtable<String, MailQueueMember>();
	public Hashtable<String, MailQueueMember> BIdelMembers = new Hashtable<String, MailQueueMember>();
	public Hashtable<String, MailQueueMember> CIdelMembers = new Hashtable<String, MailQueueMember>();
	public Hashtable<String, MailQueueMember> LoginMembers = new Hashtable<String, MailQueueMember>();
	
	public Hashtable<String, Boolean> mailAUnReceive  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> mailBUnReceive  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> mailCUnReceive  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> weixinAUnReceive  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> weixinBUnReceive  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> weixinCUnReceive  = new Hashtable<String, Boolean>();
	
	public Hashtable<String, Boolean> mailADispatcherMap  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> mailBDispatcherMap  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> mailCDispatcherMap  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> weixinADispatcherMap  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> weixinBDispatcherMap  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> weixinCDispatcherMap  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> webchatADispatcherMap  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> webchatBDispatcherMap  = new Hashtable<String, Boolean>();
	public Hashtable<String, Boolean> webchatCDispatcherMap  = new Hashtable<String, Boolean>();
	
	//-------------runtime data------------------------------------------------
	private int Weight = 0;
	private int calls = 0;
	private int Max = 0;
	private int holdtime = 0;
	private int totalCalls = 0;
	private boolean removed = true;
	
	public MailQueue(String pbx,String exten) {
		this.pbx = pbx;
		this.exten = exten;
		this.displayName = "mailQueue-" + exten;
	}
	
	public MailQueue(String pbx, String account, String exten) {
		this.pbx = pbx;
		this.account = account;
		this.exten = exten;
		this.displayName = "mailQueue-" + exten;
	}
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		if (null == displayName)
			this.displayName = "queue-" + ((null == this.getExten())? "0" : this.getExten());
		else
			this.displayName = displayName;
	}

	public String getExten() {
		return exten;
	}

	public String getPbx() {
		return pbx;
	}

	public String getAccount() {
		return account;
	}

	/**
	 * yes - callers can join a queue with no members or only unavailable
	 * members no - callers cannot join a queue with no members strict - callers
	 * cannot join a queue with no members or only unavailable members
	 * 
	 * @return
	 */
	public boolean isJoinEmpty() {
		return joinEmpty;
	}

	public void setJoinEmpty(boolean joinEmpty) {
		this.joinEmpty = joinEmpty;
	}

	public String getStrategy() {
		return strategy;
	}

	public void setStrategy(String strategy) {
		this.strategy = strategy;
	}
	
	public int getIdelCount() {
		int count = 0;
		synchronized(AIdelMembers){
			count += AIdelMembers.size();
		}
		synchronized(BIdelMembers){
			count += BIdelMembers.size();		
		}
		synchronized(CIdelMembers){
			count += CIdelMembers.size();
		}
    	return count;
	}
	
	public int getMailUnReceiveCount(){
		int count = 0;
		synchronized(mailAUnReceive){
			count += mailAUnReceive.size();
		}
		synchronized(mailBUnReceive){
			count += mailBUnReceive.size();		
		}
		synchronized(mailCUnReceive){
			count += mailCUnReceive.size();
		}
    	return count;
	}

	public int getWeixinUnReceiveCount(){
		int count = 0;
		synchronized(weixinAUnReceive){
			count += weixinAUnReceive.size();
		}
		synchronized(weixinBUnReceive){
			count += weixinBUnReceive.size();		
		}
		synchronized(weixinCUnReceive){
			count += weixinCUnReceive.size();
		}
    	return count;
	}
	
	public C5Event getState() {
		C5Event event = new C5Event(Fields.QueueParams);
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.Queue, exten);
		event.addParameter(Fields.Completed, this.getCompleted());
		event.addParameter(Fields.Calls, calls);
		event.addParameter(Fields.TotalCalls, totalCalls);
		event.addParameter(Fields.DisplayName, this.displayName);
//		event.addParameter(Fields.QueueEntry, this.getEntryEvent());
		return event;
	}

	public C5Event getStateEvent(){
		C5Event event = new C5Event(Fields.QueueParams);
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.Queue, exten);
		event.addParameter(Fields.Completed, this.getCompleted());
		event.addParameter(Fields.Weight, Weight);
		event.addParameter(Fields.Calls, calls);
		event.addParameter(Fields.Max, Max);
		event.addParameter(Fields.TotalCalls, totalCalls);
		event.addParameter(Fields.Holdtime, holdtime);
		event.addParameter(Fields.Removed, removed);
		event.addParameter(Fields.DisplayName, this.displayName);
		return event;
	}
	
	public int getTimeout() {
		return timeout;
	}

	public void setTimeout(int timeout) {
		this.timeout = timeout;
	}

	public int getWaitCount() {
		return waitCount;
	}

	public void setWaitCount(int waitCount) {
		this.waitCount = waitCount;
	}

	public void setValue(Map<String, Object> map){
		if(map.containsKey(Fields.Strategy))
			this.setStrategy((String)map.get(Fields.Strategy));
		if(map.containsKey(Fields.JoinEmpty))
			this.setJoinEmpty("1".equals(map.get(Fields.JoinEmpty)));
		else
			this.setJoinEmpty(false);
		if(map.containsKey(Fields.DisplayName))
			this.setDisplayName((String) map.get(Fields.DisplayName));
		if(map.containsKey(Fields.Timeout))
			this.setTimeout(Integer.valueOf(map.get(Fields.Timeout).toString()));
		if(map.containsKey(Fields.WaitCount))
			this.setWaitCount(Integer.valueOf(map.get(Fields.WaitCount).toString()));
		if(map.containsKey(C5Queue.TO_PEER_WHEN_QUEUE_EMPTY))
			this.setToPeerWhenQueueEmpty((String)map.get(C5Queue.TO_PEER_WHEN_QUEUE_EMPTY));

		if(map.containsKey(Fields.Members)){
			this.members.clear();
			String membersStr = ((String)map.get(Fields.Members)).trim();
			if(!membersStr.equals("")){
				String[] a = membersStr.split(",");
				for(int i=0;i<a.length;i++){
					String name = a[i];
					String penalty = "0";
					if(a[i].indexOf(':') != -1){
						String[] b = a[i].split(":");
						name = b[0];
						penalty = b[1];
					}
					this.addMember(name, penalty);
				}
			}
		} else {
			this.members.clear();
		}
	}
	
	public String getToPeerWhenQueueEmpty() {
		return toPeerWhenQueueEmpty;
	}

	public void setToPeerWhenQueueEmpty(String toPeerWhenQueueEmpty) {
		this.toPeerWhenQueueEmpty = toPeerWhenQueueEmpty;
	}

	public int getCalls() {
		return calls;
	}

	public void setCalls(int calls) {
		if(calls < 0)
			calls = 0;
		this.calls = calls;
	}

	public int getCompleted() {
		return totalCalls;
	}

	public int getHoldtime() {
		return holdtime;
	}

	public void setHoldtime(int holdtime) {
		this.holdtime = holdtime;
	}

	public int getMax() {
		return Max;
	}

	public void setMax(int max) {
		Max = max;
	}
	
	public int getWeight() {
		return Weight;
	}

	public void setWeight(int weight) {
		Weight = weight;
	}
	
	public boolean isRemoved() {
		return removed;
	}

	public void setRemoved(boolean removed) {
		this.removed = removed;
	}

	public int getTotalCalls() {
		return totalCalls;
	}

	public void setTotalCalls(int totalCalls) {
		this.totalCalls = totalCalls;
	}
	
	public void addMember(String member, String penalty) {
		members.put(member, penalty);
	}
	
	public synchronized MailQueueMember getLoginMember(String memberName){
		if(memberName == null)
			return null;
		MailQueueMember returnMember = null;
		synchronized (LoginMembers) {
			if(LoginMembers.containsKey(memberName))
				return LoginMembers.get(memberName);			
		}
		return returnMember;
	}
	
	public synchronized void addLoginMember(String member, String penalty){
		MailQueueMember curMember = null;
		User curUser = RuntimeData.getInstance().getPbxViaId(pbx).getAccount(account).getUser(member);
		if(curUser.isLogin()){
			if (getLoginMember(member) == null) {
				curMember = new MailQueueMember(member, exten, account, pbx);
				synchronized (LoginMembers) {
					LoginMembers.put(member, curMember);					
				}
			}
		}
	}
	
	public synchronized Hashtable<String, MailQueueMember> getLoginQueueMembers() {
		return LoginMembers;
	}
	
	public synchronized void removeLoginMember(String member){
			LoginMembers.remove(member);
	}
	
	public synchronized void addIdelMember(String member, String penalty){
		MailQueueMember curMember = null;
		User curUser = RuntimeData.getInstance().getPbxViaId(pbx).getAccount(account).getUser(member);
		if(curUser.isLogin() && !curUser.isBusy()){
			if(penalty.equals("2")){
				if (getIdelMember(member) == null) {
					curMember = new MailQueueMember(member, exten, account, pbx);
					synchronized (CIdelMembers) {
						CIdelMembers.put(member, curMember);						
					}
				}
			}else if(penalty.equals("1")){
				if (getIdelMember(member) == null) {
					curMember = new MailQueueMember(member, exten, account, pbx);
					synchronized (BIdelMembers) {
						BIdelMembers.put(member, curMember);						
					}
				}
			}else if(penalty.equals("0")){
				if (getIdelMember(member) == null) {
					curMember = new MailQueueMember(member, exten, account, pbx);
					synchronized (AIdelMembers) {
						AIdelMembers.put(member, curMember);						
					}
				}
			}
		}
	}
	
	public synchronized void removeIdelMember(String member){
		synchronized (AIdelMembers) {
			if(AIdelMembers.containsKey(member)){
				AIdelMembers.remove(member);
			}
		}
		synchronized (BIdelMembers) {
			if(BIdelMembers.containsKey(member)){
				BIdelMembers.remove(member);
			}
		}
		synchronized (CIdelMembers) {
			if(CIdelMembers.containsKey(member)){
				CIdelMembers.remove(member);
			}
		}
}
	
	/**
	 * Get member by member name. It will return null while the memberName is null.
	 * @param memberName
	 * @return
	 * 			If the member is not in this queue, return null.
	 */
	public MailQueueMember getIdelMember(String memberName){
		if(memberName == null)
			return null;
		MailQueueMember returnMember = null;
		synchronized(AIdelMembers){
			if(AIdelMembers.containsKey(memberName))
				return AIdelMembers.get(memberName);
		}
		synchronized(BIdelMembers){
			if(BIdelMembers.containsKey(memberName))
				return BIdelMembers.get(memberName);
		}
		synchronized(CIdelMembers){
			if(CIdelMembers.containsKey(memberName))
				return CIdelMembers.get(memberName);
		}
		return returnMember;
	}
	
	public synchronized HashMap<String, MailQueueMember> getIdelQueueMembers() {
		HashMap<String, MailQueueMember> returnMap = new HashMap<String, MailQueueMember>();
		synchronized(AIdelMembers){
			returnMap.putAll(AIdelMembers);			
		}
		synchronized(BIdelMembers){
			returnMap.putAll(BIdelMembers);			
		}
		synchronized(CIdelMembers){
			returnMap.putAll(CIdelMembers);			
		}
		return returnMap;
	}
	
	public Set<String> getMemberSet(){
		Set<String> m = new HashSet<String>();
		m.addAll(members.keySet());
		return m;
	}
	
	public Hashtable<String, String> getMembersMap(){
		return members;
	}
	
	public Iterator<String> getMembers() {
		return members.keySet().iterator();
	}
	
	public String getConfigString(){
		String data = "";
		data += "["+exten+"]"+"\r\n";
		data += STRATEGY+"="+this.getStrategy()+"\r\n";
		data += TIMEOUT+"="+getTimeout()+"\r\n";
		data += WAITCOUNT+"="+this.getWaitCount()+"\r\n";
		data += JOIN_EMPTY+"="+(this.joinEmpty?"strict":"yes")+"\r\n";
		if(this.displayName != null && !this.displayName.trim().equalsIgnoreCase("")){
			data += DISPLAY_NAME + "=" + this.displayName+"\r\n";
		}
		if(this.toPeerWhenQueueEmpty != null && !this.toPeerWhenQueueEmpty.trim().equalsIgnoreCase(""))
			data += TO_PEER_WHEN_QUEUE_EMPTY+"="+this.getToPeerWhenQueueEmpty()+"\r\n";
		if(members.size() > 0){
			String member = "";
			Iterator<String> _members = members.keySet().iterator();
			while(_members.hasNext()){
				String a = _members.next();
				member += a+":"+members.get(a)+",";
			}
			if(member.endsWith(","))
				member = member.substring(0, member.length() - 1);
			data += Fields.Members+"="+member+"\r\n";
		}
		return data;
	}

	public String getActionString() {
		return "goto "+account+"-"+exten+"-queue,"+exten+",1";
	}

	public String getJsonString() {
		// TODO Auto-generated method stub
		return null;
	}

	public void setValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	public String getServicePeerName() {
		return NAME;
	}
	
	public void addValues(HashMap<String, Object> map) {
		// TODO Auto-generated method stub
		
	}

	public Hashtable<String, MailQueueMember> getAIdelMembers() {
		return AIdelMembers;
	}

	public void setAIdelMembers(Hashtable<String, MailQueueMember> aIdelMembers) {
		AIdelMembers = aIdelMembers;
	}

	public Hashtable<String, MailQueueMember> getBIdelMembers() {
		return BIdelMembers;
	}

	public void setBIdelMembers(Hashtable<String, MailQueueMember> bIdelMembers) {
		BIdelMembers = bIdelMembers;
	}

	public Hashtable<String, MailQueueMember> getCIdelMembers() {
		return CIdelMembers;
	}

	public void setCIdelMembers(Hashtable<String, MailQueueMember> cIdelMembers) {
		CIdelMembers = cIdelMembers;
	}

	public Vector<Mail> getMailBuffer() {
		return mailBuffer;
	}

	public void setMailBuffer(Vector<Mail> mailBuffer) {
		this.mailBuffer = mailBuffer;
	}

	public Vector<WeixinMessage> getWeixinBuffer() {
		return weixinBuffer;
	}

	public void setWeixinBuffer(Vector<WeixinMessage> weixinBuffer) {
		this.weixinBuffer = weixinBuffer;
	}

	public String getPenalty(String member) {
		return members.get(member);
	}
	
	public void removeMember(String member) {
		members.remove(member);
	}

	public Vector<WebchatMessage> getWebchatBuffer() {
		return webchatBuffer;
	}

	public void setWebchatBuffer(Vector<WebchatMessage> webchatBuffer) {
		this.webchatBuffer = webchatBuffer;
	}
	
}
