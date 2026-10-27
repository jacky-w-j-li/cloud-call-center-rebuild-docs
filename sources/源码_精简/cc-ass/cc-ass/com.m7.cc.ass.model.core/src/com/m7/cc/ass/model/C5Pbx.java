package com.m7.cc.ass.model;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.DialLine;
import com.m7.cc.ass.model.configuration.MailAddr;
import com.m7.cc.ass.model.configuration.MailQueue;
import com.m7.cc.ass.model.configuration.ServiceNo;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.model.configuration.WebchatAddr;
import com.m7.cc.ass.model.configuration.WeixinAddr;
import com.m7.cc.configuration.service.ACSStorage;
import com.m7.cc.configuration.service.AELProvider;

public class C5Pbx {
	private Hashtable<String, C5Account> accounts;
	private Hashtable<String, C5Channel> channels = new Hashtable<String, C5Channel>();
	private Hashtable<String, ServiceNo> trunks = new Hashtable<String, ServiceNo>();
	private Hashtable<String, C5Queue> queues = new Hashtable<String, C5Queue>();
	private Hashtable<String, SipPeer> sipPeers = new Hashtable<String, SipPeer>();
	private Hashtable<String, String> parameterCache = new Hashtable<String, String>();
	private Hashtable<String, String> originateCache = new Hashtable<String, String>();
	private Hashtable<String, MailQueue> mailQueues = new Hashtable<String, MailQueue>();
	private Hashtable<String, MailAddr> mailAddrs = new Hashtable<String, MailAddr>();
	private Hashtable<String, WeixinAddr> weixinAddrs = new Hashtable<String, WeixinAddr>(); 
	private Hashtable<String, WebchatAddr> webchatAddrs = new Hashtable<String, WebchatAddr>(); 
	private String pbx;

	private static Logger log = Logger.getLogger(C5Pbx.class.getName());

	private PbxReloadThread reloadThread = null; 
	private Hashtable<String,String> taskToReload = new Hashtable<String,String>();
	
	private TempDataTimeTask timeTask;

	public C5Pbx(String pbx, Hashtable<String, C5Account> accounts) {
		this.pbx = pbx;
		this.accounts = accounts;

		Iterator<C5Account> its = accounts.values().iterator();
		while (its.hasNext()) {
			C5Account account = its.next();
			queues.putAll(account.getQueues());
			trunks.putAll(account.getServiceNos());
			sipPeers.putAll(account.getPeers());
			mailQueues.putAll(account.getMailQueues());
			mailAddrs.putAll(account.getMailAddrs());
			weixinAddrs.putAll(account.getWeixinAddrs());
			Tempdata.loadPeerTempData(account.getAccount(), account.getUsers());
			Tempdata.loadPeerCallTempData(pbx, account.getAccount(), account
					.getUsers());
		}

		Tempdata.loadCallReport(pbx, accounts);

		Tempdata.loadQueueData(pbx, queues);

		Tempdata.loadTrunkData(pbx, trunks);

		timeTask = new TempDataTimeTask(this);
		RuntimeData.timer.schedule(timeTask, 50000, 50000);
		
		reloadThread = new PbxReloadThread(pbx);
		reloadThread.start();
	}

	public Hashtable<String, String> getTaskToReload() {
		return taskToReload;
	}

	public PbxReloadThread getReloadThread() {
		return reloadThread;
	}
	
	protected boolean containAccount(String accountId) {
		return accounts.containsKey(accountId);
	}

	public String getPbx() {
		return pbx;
	}

	public C5Queue getQueue(String exten) {
		return queues.get(exten);
	}
	
	public MailQueue getMailQueue(String exten) {
		return mailQueues.get(exten);
	}

	public SipPeer getPeer(String exten) {
		return sipPeers.get(exten);
	}

	public Hashtable<String, SipPeer> getPeers() {
		Hashtable<String, SipPeer> ps = new Hashtable<String, SipPeer>();
		synchronized (sipPeers) {
			ps.putAll(sipPeers);
		}
		return ps;
	}

	public boolean hasChannel(String channelName) {
		synchronized (channels) {
			return channels.containsKey(channelName);
		}
	}

	public void addChannel(C5Channel channel) {
		synchronized (channels) {
			channels.put(channel.getChannelName(), channel);
		}
	}

	public C5Channel getChannel(String channel) {
		synchronized (channels) {
			return channels.get(channel);
		}
	}

	public C5Channel removeChannel(String channel) {
		synchronized (channels) {
			return channels.remove(channel);
		}
	}

	public void removeAllChannels() {
		synchronized (channels) {
			channels.clear();
		}
	}

	public Hashtable<String, C5Channel> getChannels() {
		synchronized (channels) {
			Hashtable<String, C5Channel> cs = new Hashtable<String, C5Channel>();
			cs.putAll(channels);
			return cs;
		}
	}

	public Hashtable<String, C5Account> getAccounts() {
		synchronized (accounts) {
			Hashtable<String, C5Account> cs = new Hashtable<String, C5Account>();
			cs.putAll(accounts);
			return cs;
		}
	}

	public void savePeerTempData(User user) {
		final String id = user.getId();
		final String account = user.getAccount();

		Thread t = new Thread() {
			public void run() {
				try {
					User user = getAccount(account).getUser(id);
					if (user != null)
						Tempdata.savePeerTempData(user);
				} catch (Exception e) {
					log.log(Level.WARNING, "", e);
				}
			}
		};
		t.run();
	}

	public Hashtable<String, C5Queue> getQueues() {
		return queues;
	}

	public Hashtable<String, MailQueue> getMailQueues() {
		return mailQueues;
	}
	
	public ServiceNo getServiceNo(String exten) {
		return trunks.get(exten);
	}

	public MailAddr getMailAddr(String exten) {
		return mailAddrs.get(exten);
	}
	
	public WeixinAddr getWeixinAddr(String exten) {
		return weixinAddrs.get(exten);
	}
	
	public WebchatAddr getWebchatAddr(String exten) {
		return webchatAddrs.get(exten);
	}
	
	public synchronized void saveTempData() {
		if (queues != null) {
			Tempdata.saveQueueData(pbx, queues);
		}

		if (trunks != null) {
			Tempdata.saveTrunkData(pbx, trunks);
		}

		try {
			if (accounts != null) {
				Iterator<C5Account> it = accounts.values().iterator();
				while (it.hasNext()) {
					C5Account account = it.next();
					Tempdata.savePeerCallTempData(pbx, account.getAccount(),
							account.getUsers());
				}
				Tempdata.saveCallReport(pbx, accounts);
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}

	}

	public synchronized void clearTempData() {

		Tempdata.deleteOldDataFile();

		if (queues != null) {
			Iterator<C5Queue> it = queues.values().iterator();
			while (it.hasNext()) {
				C5Queue queue = it.next();
				queue.setTotalCalls(0);
				queue.setAbandoned(0);
			}
		}

		if (trunks != null) {
			Iterator<ServiceNo> it = trunks.values().iterator();
			while (it.hasNext()) {
				ServiceNo trunk = it.next();
				trunk.setInCalls(0);
				trunk.setInComplete(0);
				trunk.setInLosts(0);
			}
		}

		try {
			if (accounts != null) {
				Iterator<C5Account> it = accounts.values().iterator();
				while (it.hasNext()) {
					C5Account account = it.next();
					account.getCallReport().clear();

					Iterator<User> users = account.getUsers().values()
							.iterator();
					while (users.hasNext()) {
						User user = users.next();
						user.setInCalls(0);
						user.setInCallsCompleted(0);
						user.setOutCalls(0);
						user.setOutCallsCompleted(0);
						user.setDialinTimeLength(0);
						user.setDialoutTimeLength(0);
						user.setTransferCalls(0);
						user.setTransferCallsCompleted(0);
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public synchronized void addAccount(String accountId,
			Hashtable<String, Object> extenFields) throws Exception {
		if (accountId == null || extenFields == null)
			return;
		C5Account account = new C5Account(pbx, accountId);
		account.addExtenFields(extenFields); // Aman zhai. 2010.05.09
		ACSStorage.addAccount(pbx, accountId);
		ACSStorage.updateAccount(account); // Aman zhai. 2010.05.10
		AELProvider.updateExtension(pbx, account);
		AELProvider.updateInclude(pbx, accountId);
		AELProvider.addInclude(pbx, accountId);
		accounts.put(accountId, account);
	}

	// Aman zhai. 2010.05.12
	public synchronized void updateExtenAccount(String accountId,
			Hashtable<String, Object> extenFields) throws Exception {
		if (accountId == null)
			return;
		if (accounts.containsKey(accountId)) {
			C5Account account = accounts.get(accountId);
			if (null == account)
				return;
			account.updateExtenFields(extenFields);
			ACSStorage.updateAccount(account);
			AELProvider.addInclude(pbx, accountId);
		}
	}

	public synchronized void removeExtenAccount(String accountId,
			Vector<String> extenFields) throws Exception {
		if (accountId == null)
			return;

		if (accounts.containsKey(accountId)) {
			C5Account account = accounts.get(accountId);
			if (null == account)
				return;
			account.removeExtenFields(extenFields);
			ACSStorage.updateAccount(account);
		}
	}

	public synchronized void removeAccount(String accountId) throws Exception {
		if (accountId == null)
			return;
		if (accounts.containsKey(accountId)) {
			ACSStorage.removeAccount(pbx, accountId);
			AELProvider.removeInclude(pbx, accountId);
			accounts.remove(accountId).destruct();
		}
	}

	public synchronized void addServiceNo(String accountId, ServiceNo serviceNo)
			throws Exception {
		C5Account account = getC5Account(accountId);
		if (account == null)
			throw new Exception("Account not found: " + accountId);
		if (account.addServiceNo(serviceNo))
			trunks.put(serviceNo.getExten(), serviceNo);
	}

	public synchronized void updateServiceNo(String accountId,
			ServiceNo serviceNo) throws Exception {
		C5Account account = getC5Account(accountId);
		if (account == null)
			throw new Exception("Account not found: " + accountId);
		if (account.updateServiceNo(serviceNo))
			trunks.put(serviceNo.getExten(), serviceNo);
	}

	public synchronized void removeServiceNo(String accountId,
			Vector<String> extens) throws Exception {
		C5Account account = getC5Account(accountId);
		if (account == null)
			throw new Exception("Account not found: " + accountId);
		if (account.removeServiceNo(extens)) {
			for (int i = 0; i < extens.size(); i++) {
				trunks.remove(extens.get(i));
			}
		}
	}

	public synchronized void addMailAddr(String accountId, MailAddr mailAddr)
			throws Exception {
		C5Account account = getC5Account(accountId);
		if (account == null)
			throw new Exception("Account not found: " + accountId);
		if (account.addMailAddr(mailAddr))
			mailAddrs.put(mailAddr.getExten(), mailAddr);
	}

	public synchronized void updateMailAddr(String accountId,
			MailAddr mailAddr) throws Exception {
		C5Account account = getC5Account(accountId);
		if (account == null)
			throw new Exception("Account not found: " + accountId);
		if (account.updateMailAddr(mailAddr))
			mailAddrs.put(mailAddr.getExten(), mailAddr);
	}

	public synchronized void removeMailAddr(String accountId,
			Vector<String> mailAddrss) throws Exception {
		C5Account account = getC5Account(accountId);
		if (account == null)
			throw new Exception("Account not found: " + accountId);
		if (account.removeMailAddr(mailAddrss)) {
			for (int i = 0; i < mailAddrss.size(); i++) {
				mailAddrs.remove(mailAddrss.get(i));
			}
		}
	}
	
	public synchronized void addWeixinAddr(String accountId, WeixinAddr weixinAddr)
			throws Exception {
		C5Account account = getC5Account(accountId);
		if (account == null)
			throw new Exception("Account not found: " + accountId);
		if (account.addWeixinAddr(weixinAddr))
			weixinAddrs.put(weixinAddr.getExten(), weixinAddr);
	}
	
	public synchronized void updateWeixinAddr(String accountId,
			WeixinAddr weixinAddr) throws Exception {
		C5Account account = getC5Account(accountId);
		if (account == null)
			throw new Exception("Account not found: " + accountId);
		if (account.updateWeixinAddr(weixinAddr))
			weixinAddrs.put(weixinAddr.getExten(), weixinAddr);
	}

	public synchronized void removeWeixinAddr(String accountId,
			Vector<String> weixinAddrss) throws Exception {
		C5Account account = getC5Account(accountId);
		if (account == null)
			throw new Exception("Account not found: " + accountId);
		if (account.removeWeixinAddr(weixinAddrss)) {
			for (int i = 0; i < weixinAddrss.size(); i++) {
				weixinAddrs.remove(weixinAddrss.get(i));
			}
		}
	}
	
	public synchronized void updateWebchatAddr(String accountId,
			WebchatAddr webchatAddr) throws Exception {
		C5Account account = getC5Account(accountId);
		if (account == null)
			throw new Exception("Account not found: " + accountId);
		if (account.updateWebchatAddr(webchatAddr))
			webchatAddrs.put(webchatAddr.getExten(), webchatAddr);
	}

	public synchronized void removeWebchatAddr(String accountId,
			Vector<String> webchatAddrss) throws Exception {
		C5Account account = getC5Account(accountId);
		if (account == null)
			throw new Exception("Account not found: " + accountId);
		if (account.removeWebchatAddr(webchatAddrss)) {
			for (int i = 0; i < webchatAddrss.size(); i++) {
				webchatAddrs.remove(webchatAddrss.get(i));
			}
		}
	}

	public synchronized void addSipPeer(String accountId, SipPeer peer)
			throws Exception {
		C5Account account = getC5Account(accountId);
		account.addSipPeer(peer);
		this.sipPeers.put(peer.getExten(), peer);
	}
	
	public synchronized void bindSipPeer(String accountId, SipPeer peer, String[] userIDs)
			throws Exception {
		C5Account account = getC5Account(accountId);
		account.bindSipPeer(peer, userIDs);
	}
	
	public synchronized void unbindSipPeer(String accountId, SipPeer peer, String[] userIDs)
			throws Exception {
		C5Account account = getC5Account(accountId);
		account.unbindSipPeer(peer, userIDs);
	}

	public synchronized void addHoldMusic(String accountId, String holdMusic)
			throws Exception {
		C5Account account = getC5Account(accountId);
		account.addHoldMusic(holdMusic);
	}

	public synchronized void removeHoldMusic(String accountId, String holdMusic)
			throws Exception {
		C5Account account = getC5Account(accountId);
		account.removeHoldMusic(holdMusic);
	}

	public synchronized void removeSipPeer(String accountId,
			Vector<String> extens) throws Exception {
		C5Account account = getC5Account(accountId);
		if (account.removePeer(extens)) {
			for (int i = 0; i < extens.size(); i++)
				sipPeers.remove(extens.get(i));
		}
	}

	public synchronized void addQueue(String accountId, C5Queue queue)
			throws Exception {
		C5Account account = getC5Account(accountId);
		if (account.addQueue(queue))
			queues.put(queue.getExten(), queue);
	}

	public synchronized void updateQueue(String accountId, C5Queue queue)
			throws Exception {
		C5Account account = getC5Account(accountId);
		account.updateQueue(queue);
		queues.put(queue.getExten(), queue);
	}

	public synchronized void removeQueue(String accountId, Vector<String> extens)
			throws Exception {
		C5Account account = getC5Account(accountId);
		if (account.removeQueue(extens)) {
			for (int i = 0; i < extens.size(); i++)
				queues.remove(extens.get(i));
		}
	}
	
	public synchronized void updateMailQueue(String accountId, MailQueue mqueue)
			throws Exception {
		C5Account account = getC5Account(accountId);
		account.updateMailQueue(mqueue);
		mailQueues.put(mqueue.getExten(), mqueue);
	}

	public synchronized void removeMailQueue(String accountId, Vector<String> extens)
			throws Exception {
		C5Account account = getC5Account(accountId);
		if (account.removeMailQueue(extens)) {
			for (int i = 0; i < extens.size(); i++){
				mailQueues.remove(extens.get(i));
			}			
		}
	}

	public synchronized void effectAll(String accountId) throws Exception {
		C5Account account = getC5Account(accountId);
		account.effectServicePeer();
	}

	public synchronized void effectPeer(String accountId, String name)
			throws Exception {
		C5Account account = getC5Account(accountId);
		account.effectServicePeer(name);
	}

	public synchronized void effectDialout(String accountId) throws Exception {
		C5Account account = getC5Account(accountId);
		account.effectDialout();
	}

	public synchronized void activeAccount(String accountId, boolean active)
			throws Exception {
		C5Account account = getC5Account(accountId);
		account.active(active);
	}

	public synchronized void updateDialoutLine(String accountId, DialLine line)
			throws Exception {
		C5Account account = getC5Account(accountId);
		account.updateDialoutLine(line);
	}

	public synchronized void updateXferLine(String accountId, DialLine line)
			throws Exception {
		C5Account account = getC5Account(accountId);
		account.updateXferLine(line);
	}

	private C5Account getC5Account(String accountId) throws Exception {
		C5Account account = accounts.get(accountId);
		if (account == null)
			throw new Exception("Account not found [" + accountId
					+ "] in pbx [" + pbx + "]");
		return account;
	}

	public C5Account getAccount(String accountId) {
		return accounts.get(accountId);
	}

	public synchronized C5Account getAccountViaName(String name) {
		Iterator<C5Account> it = accounts.values().iterator();
		while (it.hasNext()) {
			C5Account account = it.next();
			if (account.getName().equals(name))
				return account;
		}

		return null;
	}

	public synchronized List<String> getAccountNameList() {
		List<String> list = new ArrayList<String>();
		Iterator<String> it = accounts.keySet().iterator();
		while (it.hasNext()) {
			list.add(it.next());
		}
		return list;
	}
	
	public void addParameterCache(String key, String value) {
		synchronized (parameterCache) {
			if (key == null)
				return;
			parameterCache.put(key, value);
		}
	}

	public String getParameterCache(String key) {
		synchronized (parameterCache) {
			if (key == null || !parameterCache.containsKey(key))
				return null;
			return parameterCache.remove(key);
		}
	}
	
	public void addOriginateCache(String key, String value) {
		synchronized (originateCache) {
			if (key == null)
				return;
			originateCache.put(key, value);
		}
	}

	public String getOriginateCache(String key) {
		synchronized (originateCache) {
			if (key == null || !originateCache.containsKey(key))
				return null;
			return originateCache.remove(key);
		}
	}

	public synchronized void reloadQueue() {

		try {
			if(ASConfig.getInstance().getAstLazyReload().equals("yes"))
				taskToReload.put("queue","true");	
			else
				AMICore.getInstance().getAMIClient(pbx).reloadQueue();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public synchronized void reloadSip() {
		try {
			if(ASConfig.getInstance().getAstLazyReload().equals("yes"))
				taskToReload.put("sip","true");
			else
				AMICore.getInstance().getAMIClient(pbx).reloadSip();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public synchronized void reloadAel() {
		try {
			if(ASConfig.getInstance().getAstLazyReload().equals("yes"))
				taskToReload.put("ael","true");
			else
				AMICore.getInstance().getAMIClient(pbx).reloadAel();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public synchronized void reload() {
		try {
			if(ASConfig.getInstance().getAstLazyReload().equals("yes"))
				taskToReload.put("all","true");
			else
				AMICore.getInstance().getAMIClient(pbx).reload();
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public synchronized void clear() {
		try {
			Iterator<SipPeer> peers = this.sipPeers.values().iterator();
			while (peers.hasNext()) {
				SipPeer peer = peers.next();
				peer.removeAllChannels();
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
}
