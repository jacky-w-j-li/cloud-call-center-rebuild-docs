package com.m7.cc.ass.model;

import java.util.Vector;

import com.m7.cc.command.C5Action;

public abstract class UCtor {

	protected Thread screenSendThread = null;
	protected Thread ccLoginSendThread = null;
	
	protected static Vector<C5Action> callsScreenUcQueues = new Vector<C5Action>();
	protected static Vector<C5Action> ccLoginNotifyUcQueues = new Vector<C5Action>();
}
