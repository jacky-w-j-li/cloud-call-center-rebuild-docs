package com.dishui.manager.batchReportMonitor;

import com.mongodb.DBObject;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.TimeUnit;


public class ReportTaskPool {

	ArrayBlockingQueue<DBObject> queue = new ArrayBlockingQueue<DBObject>(100000);

	public ReportTaskPool() {
		super();
	}

	public void add(DBObject task) {
		try {
			if (false == queue.contains(task))
				queue.put(task);
		} catch (InterruptedException e) {
		}
	}
	
	public DBObject getTask() {
        DBObject ta=null;
		try {
			ta = (DBObject) queue.poll(20,TimeUnit.SECONDS);
		} catch (InterruptedException e) {

		}
		return ta;
	}
	
	public int size() {
		return queue.size();
	}
	
}
