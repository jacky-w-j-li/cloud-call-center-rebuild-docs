package com.m7.cc.ass.call.model;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.Activator;
import com.m7.cc.ass.call.service.CallProvider;
import com.m7.cc.ass.model.C5Call;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class Call implements C5Call {

	private String state = "init";
	
	private C5Channel mainChannel;
	
	private C5Channel secondChannel;
	private C5Channel thirdChannel;
	
	private String room;
	
	private static Logger log = Logger.getLogger(Call.class.getName());
	
	public Call(){
	}

	public C5Channel getMainChannel() {
		return mainChannel;
	}
	
	public void setMainChannel(C5Channel mainChannel) {
		if(this.mainChannel != null && this.mainChannel != mainChannel)
			this.mainChannel.setCall(null);
		this.mainChannel = mainChannel;
		if(this.mainChannel != null){
			this.mainChannel.setCall(this);
		}
	}

	public C5Channel getSecondChannel() {
		return secondChannel;
	}

	public void setSecondChannel(C5Channel secondChannel) {
		if(this.secondChannel != null && this.secondChannel != secondChannel)
			this.secondChannel.setCall(null);
		this.secondChannel = secondChannel;
		if(this.secondChannel != null){
			this.secondChannel.setCall(this);
		}
	}

	public C5Channel getThirdChannel() {
		return thirdChannel;
	}

	public void setThirdChannel(C5Channel thirdChannel) {
		if(this.thirdChannel != null && this.thirdChannel != thirdChannel)
			this.thirdChannel.setCall(null);
		this.thirdChannel = thirdChannel;
		if(this.thirdChannel != null){
			this.thirdChannel.setCall(this);
		}
	}

	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	public String getRoom() {
		return room;
	}

	public void setRoom(String room) {
		this.room = room;
		CallProvider.getInstance().addCall(room, this);
	}
	
	public void close() {
		if(mainChannel != null){
			mainChannel.setCall(null);
			this.mainChannel = null;
		}
		if(secondChannel != null) {
			secondChannel.setCall(null);
			this.secondChannel = null;
		}
		
		if(thirdChannel != null) {
			this.thirdChannel.setCall(null);
			this.thirdChannel = null;
		}
		
		if(room != null){
			CallProvider.getInstance().removeCall(room);
		}
	}

	public synchronized void processChannelState(C5Channel channel){
		try{
			C5Event event = new C5Event(Fields.ChannelStatus);
			event.addParameter(Fields.Channel, channel);
			Activator.getHandler().handleEvent(this, event);
		} catch (Exception e){
			log.log(Level.WARNING, "", e);
		}
	}
	
	public synchronized void processNewExten(C5Event event) {
		try {
			Activator.getHandler().handleEvent(this, event);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public synchronized void processMeetmeJoin(C5Event event) {
		try {
			Activator.getHandler().handleEvent(this, event);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public synchronized void processMeetmeLeave(C5Event event) {
		try {
			Activator.getHandler().handleEvent(this, event);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public synchronized void processMeetmeTalking(C5Event event) {
		try {
			Activator.getHandler().handleEvent(this, event);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public synchronized void processMeetmeStopTalking(C5Event event) {
		try {
			Activator.getHandler().handleEvent(this, event);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	public synchronized void processMeetmeMute(C5Event event) {
		try {
			Activator.getHandler().handleEvent(this, event);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	public synchronized void handleEvent(C5Event event) {
		try {
			Activator.getHandler().handleEvent(this, event);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}
	
	@Override
	public synchronized C5Response handleAction(C5Action action) {
		try {
			return Activator.getHandler().handleAction(this, action);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
		return new C5Response(action.getActionName(), action.getActionID());
	}
}
