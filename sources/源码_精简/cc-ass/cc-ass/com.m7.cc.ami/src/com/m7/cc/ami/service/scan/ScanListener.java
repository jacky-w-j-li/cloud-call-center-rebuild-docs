package com.m7.cc.ami.service.scan;

import java.util.Vector;

public class ScanListener {
	private static ScanListener instance;
	private Vector<QueueScanListener> queueScanListeners = new Vector<QueueScanListener>();

	private ScanListener() {
		instance = this;
	}

	public static ScanListener getInstance() {
		if (instance == null) {
			new ScanListener();
		}
		return instance;
	}

	public void addQueueScanListener(QueueScanListener l) {
		if (l == null) {
			return;
		}

		synchronized (queueScanListeners) {
			if (!queueScanListeners.contains(l)) {
				queueScanListeners.add(l);
			}
		}
	}

	public void removeQueueScanListener(QueueScanListener l) {
		if (l == null) {
			return;
		}

		synchronized (queueScanListeners) {
			if (queueScanListeners.contains(l)) {
				queueScanListeners.remove(l);
			}
		}
	}

	public void queueMemberScan(final String pbxID) {
		if (pbxID == null || pbxID.equals("")) {
			return;
		}

		synchronized (queueScanListeners) {
			for (QueueScanListener listener : queueScanListeners) {
				listener.scanQueueMember(pbxID);
			}
		}
	}

}
