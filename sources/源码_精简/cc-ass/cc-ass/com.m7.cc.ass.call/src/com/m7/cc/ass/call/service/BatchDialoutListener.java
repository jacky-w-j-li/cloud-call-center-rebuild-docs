package com.m7.cc.ass.call.service;

import com.m7.cc.command.C5Event;

public interface BatchDialoutListener {
	public void batchDialoutDialing(C5Event event);
	public void batchDialoutDialed(C5Event event);
	public void batchDialoutFinish(C5Event event);
	public void batchDialoutError(C5Event event);
}
