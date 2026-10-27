package com.m7.cc.ass.model;

import java.util.List;
import java.util.Vector;
import java.util.concurrent.atomic.AtomicInteger;

import com.m7.cc.ass.model.configuration.C5Queue;

public abstract class BatchDialoutor {
	protected String id;
	protected String account;
	protected String pbx;
	protected String type;
	protected String context;
	protected String queryParam;
	protected String agentIds;
	protected String userId;
	protected boolean running = false;
	protected boolean isPause = false;
	protected C5Queue queue = null;
	protected Thread dialoutThread = null;
	protected Vector<String> phones = null;
	protected int dialCount = 0;
	protected int addLicense = 0;
	protected AtomicInteger dialedCount = new AtomicInteger(0);
	protected AtomicInteger dealingCount = new AtomicInteger(0);
	protected AtomicInteger notDealCount = new AtomicInteger(0);
	protected AtomicInteger busyCount = new AtomicInteger(0);
	protected AtomicInteger congestionCount = new AtomicInteger(0);
	protected AtomicInteger invalidCount = new AtomicInteger(0);

	public BatchDialoutor(String id, String account, String pbx,
			String context, String type, List<String> phones) {
		this.id = id;
		this.account = account;
		this.pbx = pbx;
		this.context = context;
		this.type = type;
		this.phones = new Vector<String>();
		this.phones.addAll(phones);
	}

	public void appendPhones(List<String> appendPhones) {
		if (appendPhones == null || appendPhones.size() < 1)
			return;
		this.phones.addAll(appendPhones);
	}

	public abstract void start();

	public void pause() {
		if (!isPause)
			isPause = true;
	}

	public void unPause() {
		if (isPause)
			isPause = false;
	}

	public void stop() {
		if (running) {
			running = false;
		}
	}

	public void destroy() {
		if (phones != null) {
			phones.clear();
			phones = null;
		}
		if (dialoutThread != null) {
			dialoutThread = null;
		}
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public boolean isPause() {
		return isPause;
	}

	public void setPause(boolean isPause) {
		this.isPause = isPause;
	}

	public Vector<String> getPhones() {
		return phones;
	}

	public void setPhones(Vector<String> phones) {
		this.phones = phones;
	}

	public Thread getDialoutThread() {
		return dialoutThread;
	}

	public void setDialoutThread(Thread dialoutThread) {
		this.dialoutThread = dialoutThread;
	}

	public boolean isRunning() {
		return running;
	}

	public void setRunning(boolean running) {
		this.running = running;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public C5Queue getQueue() {
		return queue;
	}

	public void setQueue(C5Queue queue) {
		this.queue = queue;
	}

	public String getContext() {
		return context;
	}

	public void setContext(String context) {
		this.context = context;
	}

	public String getQueryParam() {
		return queryParam;
	}

	public void setQueryParam(String queryParam) {
		this.queryParam = queryParam;
	}

	public AtomicInteger getDialedCount() {
		return dialedCount;
	}

	public void setDialedCount(AtomicInteger dialedCount) {
		this.dialedCount = dialedCount;
	}

	public AtomicInteger getDealingCount() {
		return dealingCount;
	}

	public void setDealingCount(AtomicInteger dealingCount) {
		this.dealingCount = dealingCount;
	}

	public AtomicInteger getNotDealCount() {
		return notDealCount;
	}

	public void setNotDealCount(AtomicInteger notDealCount) {
		this.notDealCount = notDealCount;
	}

	public AtomicInteger getBusyCount() {
		return busyCount;
	}

	public void setBusyCount(AtomicInteger busyCount) {
		this.busyCount = busyCount;
	}

	public AtomicInteger getCongestionCount() {
		return congestionCount;
	}

	public void setCongestionCount(AtomicInteger congestionCount) {
		this.congestionCount = congestionCount;
	}

	public AtomicInteger getInvalidCount() {
		return invalidCount;
	}

	public void setInvalidCount(AtomicInteger invalidCount) {
		this.invalidCount = invalidCount;
	}

	public int getDialCount() {
		return dialCount;
	}

	public void setDialCount(int dialCount) {
		this.dialCount = dialCount;
	}

	public String getAgentIds() {
		return agentIds;
	}

	public void setAgentIds(String agentIds) {
		this.agentIds = agentIds;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public int getAddLicense() {
		return addLicense;
	}

	public void setAddLicense(int addLicense) {
		this.addLicense = addLicense;
	}
	
}
