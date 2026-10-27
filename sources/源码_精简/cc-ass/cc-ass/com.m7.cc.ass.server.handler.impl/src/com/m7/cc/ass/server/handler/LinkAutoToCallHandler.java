package com.m7.cc.ass.server.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.service.CallListener;
import com.m7.cc.ass.call.service.ChannelListener;
import com.m7.cc.ass.model.UCtor;
import com.m7.cc.ass.model.configuration.C5Channel;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;

public class LinkAutoToCallHandler {
	public static Logger log = Logger.getLogger(LinkAutoToCallHandler.class.getName());

	public void initLinkAutoToCallHandler() {
		LinkAutoToCall tor = new LinkAutoToCall();
		CallListener.getInstance().addChannelListener("ALL", tor);
	}
}

class LinkAutoToCall implements ChannelListener{
	public static Logger log = Logger.getLogger(UCtor.class.getName());

	@Override
	public void channelStatusChanged(C5Channel channel) {
		try {
			if (channel.getState().equalsIgnoreCase(Fields.Link)) {
				if(channel.getVar("LINK_AUTO_TO_CALL") != null){
					HoldHandler.linkAutoToCall(channel);
				}
			}else{
				if(channel.getLinkedChannel() != null){
					if (channel.getState().equalsIgnoreCase(Fields.Up)
							&& channel.getLinkedChannel().getState().equals(Fields.Link)) {
						if(channel.getLinkedChannel().getVar("LINK_AUTO_TO_CALL") != null){
							HoldHandler.linkAutoToCall(channel.getLinkedChannel());
						}
					}
				}
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

	@Override
	public void newExten(C5Event event) {
		// TODO Auto-generated method stub
	}
}