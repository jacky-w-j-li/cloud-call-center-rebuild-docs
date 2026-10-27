package com.m7.cc.ass.call.service;

import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.command.C5Event;

public interface UserListener {
	public void userAdded(User user);
	public void userRemoved(User user);
	public void userLogin(User user);
	public void userLogoff(User event);
	public void userBusy(User event);
	public void userUnbusy(User event);
	public void userSignIn(User user);
	public void userSignOut(User user);
	public void userStatus(User event);
	public void userCallsUpdate(User user);
	public void newEvent(C5Event event);
}
