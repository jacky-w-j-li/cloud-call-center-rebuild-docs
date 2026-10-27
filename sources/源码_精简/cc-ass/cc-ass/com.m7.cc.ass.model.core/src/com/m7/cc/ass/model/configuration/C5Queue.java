package com.m7.cc.ass.model.configuration;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.configuration.service.ServicePeer;

public class C5Queue implements ServicePeer{
	
	public static final String NAME = "ACSQueue";
	
	public static final String PBX = "PBX";
	public static final String ACCOUNT = "Account";
	public static final String MUSICCLASS = "musicclass";
	public static final String STRATEGY = "strategy";
	public static final String SERVICE_LEVEL = "servicelevel";
	public static final String RETRY = "retry";
	public static final String MONITOR_JOIN = "monitor-join";
	public static final String MONITOR_FORMAT = "monitor-format";
	public static final String EVENT_MEMBER_STATUS = "eventmemberstatus";
	public static final String EVENT_WHEN_CALLED = "eventwhencalled";
	public static final String RING_IN_USE = "ringinuse";
	public static final String JOIN_EMPTY = "joinempty";
	public static final String WRAP_UP_TIME = "wrapuptime";
	public static final String TIMEOUT = "timeout";
	public static final String WAIT_TIME = "WaitTime";
	public static final String SAY_EXTEN = "sayexten";
	public static final String AGENT_EXTEN_POINT = "agentextenpoint";
	public static final String SAY_QUEUE_POSITION = "announce-frequency";
	public static final String TO_PEER_WHEN_QUEUE_EMPTY= "ToPeerWhenQueueEmpty";
	public static final String TO_PEER_WHEN_HANGUPED = "ToPeerWhenHanguped";
	public static final String C5MEMBERS= "c5members";
	public static final String DISPLAY_NAME = "DisplayName";
	public static final String TO_PEER_WHEN_WAIT_TIMEOUT = "ToPeerWhenWaitTimeout"; 
	public static final String DEFAULT_MUSIC_CLASS = "default";
	public static final String DEFAULT_SAY_QUEUE_POSITION = "0";
	
	public static final String CONTEXT = "context";
	public static final String TO_PEER_WHEN_WAIT = "ToPeerWhenWait";
	
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
	
	public static final String format_gsm = "gsm";
	public static final String format_wav = "wav";
	public static final String format_wav49 = "wav49";

	private String pbx;
	private String account;
	private String exten;
	//The music-on-hold will be played when caller is waitting
	// in this queue.
	private String musicclass = DEFAULT_MUSIC_CLASS;
	
	//How do queue dispatch call
	private String strategy = rrmemory;

	//How long do we wait before trying all the members again?
	private int retry = 3;
	
	private int serviceLevel = 60;
	
	private boolean monitorJoin = false;
	private String monitorFormat = format_wav;
	private boolean eventMemberStatus = false;
	private boolean eventWhenCalled = true;
	private boolean ringInuse = false;
	private boolean joinEmpty = true;
	private int wrapUpTime = 0;
	private int timeout = 15;
	private int waitTime = 60;
	
	private String toPeerWhenQueueEmpty = "0";
	private String toPeerWhenHanguped = "0";
	private String toPeerWhenWaitTimeout = "0";
	private String toPeerWhenWait;
	
	private boolean sayExten = false;
	private String sayQueuePostion = DEFAULT_SAY_QUEUE_POSITION;
	private boolean agentExtenPoint = false;
	
	private String displayName;
	private String announceMusic = "sound/queue";

	private List<String> localMembers = new ArrayList<String>();
	private Hashtable<String, String> members = new Hashtable<String, String>();
	
	//-------------runtime data------------------------------------------------
	private int abandoned = 0;
	private double serviceLevelPerf = 0;
	private int Weight = 0;
	private int calls = 0;
	private int Max = 0;
	private int holdtime = 0;
	private int totalCalls = 0;
	private boolean removed = true;
	private HashMap<String, C5QueueMember> queueMembers = new HashMap<String, C5QueueMember>();
	private HashMap<String, C5QueueEntry> entries= new HashMap<String, C5QueueEntry>();
	
	public C5Queue(String pbx,String exten) {
		this.pbx = pbx;
		this.exten = exten;
		this.displayName = "queue-" + exten;
	}
	
	
	
	public C5Queue(String pbx, String account, String exten) {
		this.pbx = pbx;
		this.account = account;
		this.exten = exten;
		this.displayName = "queue-" + exten;
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

	public String getMusicclass() {
		return musicclass;
	}

	public void setMusicclass(String musicclass) {
		this.musicclass = musicclass;
		if(musicclass == null)
			this.musicclass = "default";
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

	public int getRetry() {
		return retry;
	}

	public void setRetry(int retry) {
		this.retry = retry;
	}

	public boolean isMonitorJoin() {
		return monitorJoin;
	}

	public void setMonitorJoin(boolean monitorJoin) {
		this.monitorJoin = monitorJoin;
	}

	public boolean isEventMemberStatus() {
		return eventMemberStatus;
	}

	public void setEventMemberStatus(boolean eventMemberStatus) {
		this.eventMemberStatus = eventMemberStatus;
	}

	public boolean isEventWhenCalled() {
		return eventWhenCalled;
	}

	public void setEventWhenCalled(boolean eventWhenCalled) {
		this.eventWhenCalled = eventWhenCalled;
	}

	public boolean isRingInuse() {
		return ringInuse;
	}

	public void setRingInuse(boolean ringInuse) {
		this.ringInuse = ringInuse;
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
	
	public int getWrapUpTime() {
		return wrapUpTime;
	}
	
	/**
	 * After a successful call, how long to wait before sending a potentially
	 * free member another call (default is 0, or no delay)
	 * 
	 * @param wrapUpTime
	 */
	public void setWrapUpTime(int wrapUpTime) {
		this.wrapUpTime = wrapUpTime;
	}

	public int getTimeout() {
		return timeout;
	}

	public void setTimeout(int timeout) {
		this.timeout = timeout;
	}

	public String[] getSupportedFormat() {
		return new String[] { "gsm", "wav", "wav49" };
	}

	public int getWaitTime() {
		return waitTime;
	}

	public void setWaitTime(int waitTime) {
		this.waitTime = waitTime;
	}

	public String getStrategy() {
		return strategy;
	}

	public void setStrategy(String strategy) {
		this.strategy = strategy;
	}

	public String getMonitorFormat() {
		return monitorFormat;
	}

	public void setMonitorFormat(String monitorFormat) {
		this.monitorFormat = monitorFormat;
	}
	
	public String getSayQueuePostion() {
		return sayQueuePostion;
	}

	public void setSayQueuePostion(String sayQueuePostion) {
		this.sayQueuePostion = sayQueuePostion;
	}
	
	public C5Event getState() {
		C5Event event = new C5Event(Fields.QueueParams);
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.Queue, exten);
		event.addParameter(Fields.Completed, this.getCompleted());
		event.addParameter(Fields.Abandoned, abandoned);
		event.addParameter(Fields.Calls, calls);
		event.addParameter(Fields.Members, queueMembers.size());
		event.addParameter(Fields.BusyMembers, this.getBusyMemberCount());
		event.addParameter(Fields.TotalCalls, totalCalls);
		event.addParameter(Fields.DisplayName, this.displayName);
		event.addParameter(Fields.QueueMember, this.getMemberEvent());
//		event.addParameter(Fields.QueueEntry, this.getEntryEvent());
		return event;
	}

	public C5Event getStateEvent(){
		C5Event event = new C5Event(Fields.QueueParams);
		event.addParameter(Fields.PBX, pbx);
		event.addParameter(Fields.Account, account);
		event.addParameter(Fields.Queue, exten);
		event.addParameter(Fields.Completed, this.getCompleted());
		event.addParameter(Fields.Abandoned, abandoned);
		event.addParameter(Fields.ServiceLevel, serviceLevel);
		event.addParameter(Fields.Weight, Weight);
		event.addParameter(Fields.Music, this.announceMusic);
		event.addParameter(Fields.Calls, calls);
		event.addParameter(Fields.Members, queueMembers.size());
		event.addParameter(Fields.BusyMembers, this.getBusyMemberCount());
		event.addParameter(Fields.Max, Max);
		event.addParameter(Fields.TotalCalls, totalCalls);
		event.addParameter(Fields.ServicelevelPerf, serviceLevelPerf);
		event.addParameter(Fields.Holdtime, holdtime);
		event.addParameter(Fields.Removed, removed);
		event.addParameter(Fields.DisplayName, this.displayName);
		event.addParameter(Fields.QueueMember, this.getMemberEvent());
		event.addParameter(Fields.QueueEntry, this.getEntryEvent());
		return event;
	}
	
	private List<String> getMemberEvent(){
		List<String> events = new ArrayList<String>();
		synchronized (queueMembers) {
			if(queueMembers.size() > 0){
				Iterator<C5QueueMember> m = queueMembers.values().iterator();
				while(m.hasNext()){
					events.add(m.next().getExten());
				}
			}
		}
		return events;
	}
	
	private List<Map<String, Object>> getEntryEvent(){
		List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
		synchronized (entries) {
			if(entries.size() > 0){
				Iterator<C5QueueEntry> m = entries.values().iterator();
				while(m.hasNext()){
					events.add(m.next().getStateEvent().getParameters());
				}
			}
		}
		return events;
	}

	public void setValue(Map<String, Object> map){
		if(map.containsKey(Fields.Strategy))
			this.setStrategy((String)map.get(Fields.Strategy));
		if(map.containsKey(Fields.Retry))
			this.setRetry(Integer.valueOf(map.get(Fields.Retry).toString()));
		if(map.containsKey(Fields.MusicClass))
			this.setMusicclass((String)map.get(Fields.MusicClass));
		else
			this.setMusicclass(DEFAULT_MUSIC_CLASS);
		if(map.containsKey(Fields.MonitorJoin))
			this.setMonitorJoin((Boolean)map.get(Fields.MonitorJoin));
		if(map.containsKey(Fields.MonitorFormat))
			this.setMonitorFormat((String)map.get(Fields.MonitorFormat));
		if(map.containsKey(Fields.EventMemberStatus))
			this.setEventMemberStatus((Boolean)map.get(Fields.EventMemberStatus));
		if(map.containsKey(Fields.EventWhenCalled))
			this.setEventWhenCalled((Boolean)map.get(Fields.EventWhenCalled));
		if(map.containsKey(Fields.RingInuse))
			this.setRingInuse((Boolean)map.get(Fields.RingInuse));
		if(map.containsKey(Fields.JoinEmpty))
			this.setJoinEmpty("1".equals(map.get(Fields.JoinEmpty)));
		else
			this.setJoinEmpty(false);
		if(map.containsKey(Fields.WrapUpTime))
			this.setWrapUpTime(Integer.valueOf(map.get(Fields.WrapUpTime).toString()));
		if(map.containsKey(Fields.Timeout))
			this.setTimeout(Integer.valueOf(map.get(Fields.Timeout).toString()));
		if(map.containsKey(Fields.WaitTime))
			this.setWaitTime(Integer.valueOf(map.get(Fields.WaitTime).toString()));
		if(map.containsKey(Fields.DisplayName))
			this.setDisplayName((String) map.get(Fields.DisplayName));
		if(map.containsKey(Fields.SayQueuePosition))
			this.setSayQueuePostion(map.get(Fields.SayQueuePosition).toString());
		else
			this.setSayQueuePostion(DEFAULT_SAY_QUEUE_POSITION);
			
		if(map.containsKey(Fields.Music))
			this.setAnnounceMusic((String)map.get(Fields.Music));
		else this.setAnnounceMusic("sound/queue");
		
		if(map.containsKey(TO_PEER_WHEN_QUEUE_EMPTY))
			this.setToPeerWhenQueueEmpty((String)map.get(TO_PEER_WHEN_QUEUE_EMPTY));

		if (map.containsKey(TO_PEER_WHEN_WAIT_TIMEOUT))
			this.setToPeerWhenWaitTimeout((String)map.get(TO_PEER_WHEN_WAIT_TIMEOUT));
		
		if(map.containsKey(TO_PEER_WHEN_HANGUPED))
			this.setToPeerWhenHanguped((String)map.get(TO_PEER_WHEN_HANGUPED));
		
		if(map.containsKey(TO_PEER_WHEN_WAIT))
			this.setToPeerWhenWait((String) map.get(TO_PEER_WHEN_WAIT));
			
		if(map.containsKey(Fields.LocalMember)){
			this.localMembers.clear();
			String[] a = ((String)map.get(Fields.LocalMember)).trim().split(",");
			for(int i=0;i<a.length;i++)
				this.addLocalMember(a[i]);
		}else{
			this.localMembers.clear();
		}
		
		if(map.containsKey(Fields.SayExten)){
			this.sayExten = (Boolean)map.get(Fields.SayExten);
		}
		
		if(map.containsKey(Fields.AgentExtenPoint)){
			this.agentExtenPoint = (Boolean)map.get(Fields.AgentExtenPoint);
		}
		
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
	
	public String getToPeerWhenWait() {
		return toPeerWhenWait;
	}


	public void setToPeerWhenWait(String toPeerWhenWait) {
		this.toPeerWhenWait = toPeerWhenWait;
	}

	public List<String> getLocalMembers() {
		return localMembers;
	}
	
	public void addLocalMember(String member) {
		localMembers.add(member);
	}
	
	public void removeLocalMember(String member) {
		localMembers.remove(member);
	}
	
	public boolean hasMember(String member){
		return members.containsKey(member);
	}
	
	public Iterator<C5QueueMember> getMembersIterator() {
		return queueMembers.values().iterator();
	}
	
	public void addMember(String member, String penalty) {
		members.put(member, penalty);
	}
	
	public Iterator<String> getMembers() {
		return members.keySet().iterator();
	}
	
	public Set<String> getMemberSet(){
		Set<String> m = new HashSet<String>();
		m.addAll(members.keySet());
		return m;
	}
	
	public String getPenalty(String member) {
		return members.get(member);
	}
	
	public void removeMember(String member) {
		members.remove(member);
	}

	/**
	 * Add a member into the queue.
	 * If the member is null or is already in this queue, it will do nothing
	 * @param member
	 */
	public void addQueueMember(C5QueueMember member){
		synchronized (queueMembers) {
			if(member == null || queueMembers.containsKey(member.getName()))
				return;
			queueMembers.put(member.getName(), member);
		}
	}
	
	public C5QueueMember removeQueueMember(String memberName){
		synchronized (queueMembers) {
			return queueMembers.remove(memberName);
		}
	}
	
	public void removeAllQueueMembers(){
		synchronized (queueMembers) {
			queueMembers.clear();
		}
	}
	
	public int getBusyMemberCount(){
		synchronized (queueMembers) {
			int a = 0;
			Iterator<C5QueueMember> m = queueMembers.values().iterator();
			while(m.hasNext()){
				if(m.next().isPaused())
					a ++;
			}
			return a;
		}
	}
	
	public int getQueueMemberCount(){
		return queueMembers.size();
	}
	
	/**
	 * Get member by member name. It will return null while the memberName is null.
	 * @param memberName
	 * @return
	 * 			If the member is not in this queue, return null.
	 */
	public C5QueueMember getMember(String memberName){
		synchronized (queueMembers) {
			if(memberName == null)
				return null;
			if(queueMembers.containsKey(memberName))
				return queueMembers.get(memberName);
			return null;
		}
	}
	
	/**
	 * Add a entry into the queue.
	 * If the entry is null or is already in this queue, it will do nothing
	 * @param entry
	 */
	public void addEntry(C5QueueEntry entry){
		synchronized (entries) {
			if(entry == null || entries.containsKey(entry.getChannel()))
				return;
			entries.put(entry.getChannel(), entry);
		}
	}
	
	public void removeEntry(String channel){
		synchronized (entries) {
			entries.remove(channel);
		}
	}
	
	public void removeAllEntries(){
		synchronized (entries) {
			entries.clear();
		}
	}
	
	/**
	 * Get entry by channel name. It will return null while the memberName is null.
	 * @param channel
	 * @return
	 * 			If the channel is not in this queue, return null.
	 */
	public C5QueueEntry getEntry(String channel){
		synchronized (entries) {
			if(channel == null)
				return null;
			if(entries.containsKey(channel))
				return (C5QueueEntry)entries.get(channel);
			return null;
		}
	}
	
	public C5QueueEntry getEntryByID(String uniqueid){
		synchronized (entries) {
			if (uniqueid == null)
				return null;
			Iterator<C5QueueEntry> it = entries.values().iterator();
			while (it.hasNext()) {
				C5QueueEntry entry = it.next();
				if (entry.getUniqueid().equalsIgnoreCase(uniqueid))
					return entry;
			}
			return null;
		}
	}

	public int getAbandoned() {
		return abandoned;
	}

	public void setAbandoned(int abandoned) {
		this.abandoned = abandoned;
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
		return totalCalls - abandoned;
	}

	public HashMap<String, C5QueueEntry> getEntries() {
		return entries;
	}

	public void setEntries(HashMap<String, C5QueueEntry> entries) {
		this.entries = entries;
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

	public HashMap<String, C5QueueMember> getQueueMembers() {
		return queueMembers;
	}

	public int getServiceLevel() {
		return serviceLevel;
	}

	public void setServiceLevel(int serviceLevel) {
		this.serviceLevel = serviceLevel;
	}

	public String getAnnounceMusic() {
		return announceMusic;
	}
	
	public void setAnnounceMusic(String announceMusic) {
		this.announceMusic = announceMusic;
	}

	public int getWeight() {
		return Weight;
	}

	public void setWeight(int weight) {
		Weight = weight;
	}

	public double getServiceLevelPerf() {
		return serviceLevelPerf;
	}

	public void setServiceLevelPerf(double serviceLevelPerf) {
		this.serviceLevelPerf = serviceLevelPerf;
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

	public void destruct(){
		queueMembers.clear();
		entries.clear();
	}
	
	public String getConfigString(){
		String data = "";
		data += "["+exten+"]"+"\r\n";
		data += RETRY+"="+getRetry()+"\r\n";
		data += SERVICE_LEVEL+"="+serviceLevel+"\r\n";
		data += MUSICCLASS+"="+this.getMusicclass()+"\r\n";
		data += STRATEGY+"="+this.getStrategy()+"\r\n";
		data += MONITOR_JOIN+"="+(isMonitorJoin()?"yes":"no")+"\r\n";
		data += MONITOR_FORMAT+"="+getMonitorFormat()+"\r\n";
		data += EVENT_MEMBER_STATUS+"="+(isEventMemberStatus()?"yes":"no")+"\r\n";
		data += EVENT_WHEN_CALLED+"="+(isEventWhenCalled()?"yes":"no")+"\r\n";
		data += RING_IN_USE+"="+(isRingInuse()?"yes":"no")+"\r\n";
		data += JOIN_EMPTY+"="+(this.joinEmpty?"strict":"yes")+"\r\n";
		data += TIMEOUT+"="+getTimeout()+"\r\n";
		data += WRAP_UP_TIME+"="+this.getWrapUpTime()+"\r\n";
		data += WAIT_TIME+"="+this.getWaitTime()+"\r\n";
		data += SAY_EXTEN+"="+(this.sayExten?"yes":"no")+"\r\n";
		data += AGENT_EXTEN_POINT+"="+(this.agentExtenPoint?"yes":"no")+"\r\n";
		data += SAY_QUEUE_POSITION+"="+this.sayQueuePostion+"\r\n";
		if(!this.announceMusic.equalsIgnoreCase("0"))
			data += "announceMusic="+this.announceMusic+"\r\n";
		if(this.toPeerWhenWait != null && !this.toPeerWhenWait.trim().equalsIgnoreCase("")
				&& !this.toPeerWhenWait.trim().equalsIgnoreCase("0"))
			data += CONTEXT+"="+this.account+"-"+this.exten+"-queue-wait-transfer\r\n";
		if(this.toPeerWhenWaitTimeout != null && !this.toPeerWhenWaitTimeout.trim().equalsIgnoreCase(""))
			data += TO_PEER_WHEN_WAIT_TIMEOUT+"="+this.getToPeerWhenWaitTimeout()+"\r\n";
		if(this.toPeerWhenQueueEmpty != null && !this.toPeerWhenQueueEmpty.trim().equalsIgnoreCase(""))
			data += TO_PEER_WHEN_QUEUE_EMPTY+"="+this.getToPeerWhenQueueEmpty()+"\r\n";
		if(this.toPeerWhenHanguped != null && !this.toPeerWhenHanguped.trim().equalsIgnoreCase("")){
			data += TO_PEER_WHEN_HANGUPED + "=" + this.toPeerWhenHanguped+"\r\n";
		}
		if(this.displayName != null && !this.displayName.trim().equalsIgnoreCase("")){
			data += DISPLAY_NAME + "=" + this.displayName+"\r\n";
		}
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
		if(localMembers.size() > 0){
			for(int i=0;i<localMembers.size();i++){
				data += "member=>SIP/"+localMembers.get(i)+"\r\n";
			}
		}
		return data;
	}

	public boolean isSayExten() {
		return sayExten;
	}



	public void setSayExten(boolean sayExten) {
		this.sayExten = sayExten;
	}

	public boolean isAgentExtenPoint() {
		return agentExtenPoint;
	}



	public void setAgentExtenPoint(boolean agentExtenPoint) {
		this.agentExtenPoint = agentExtenPoint;
	}



	/*	public String getReturnPeer() {
		return returnPeer;
	}

	public void setReturnPeer(String returnPeer) {
		this.returnPeer = returnPeer;
	}
*/
	public String getToPeerWhenHanguped() {
		return toPeerWhenHanguped;
	}

	public void setToPeerWhenHanguped(String toPeerWhenHanguped) {
		this.toPeerWhenHanguped = toPeerWhenHanguped;
	}
	
	public String getToPeerWhenWaitTimeout() {
		return toPeerWhenWaitTimeout;
	}

	public void setToPeerWhenWaitTimeout(String toPeerWhenWaitTimeout) {
		this.toPeerWhenWaitTimeout = toPeerWhenWaitTimeout;
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
}
