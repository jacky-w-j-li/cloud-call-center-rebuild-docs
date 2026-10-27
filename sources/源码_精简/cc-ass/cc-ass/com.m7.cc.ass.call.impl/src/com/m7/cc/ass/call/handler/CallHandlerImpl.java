package com.m7.cc.ass.call.handler;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.call.model.Call;
import com.m7.cc.ass.call.model.CallHandler;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;

public class CallHandlerImpl implements CallHandler {

	public static final String HOLD = "hold";
	public static final String CHATTING = "chatting";
	public static final String THREE_WAY_CALL = "threeWayCall";
	public static final String INIT = "init";
	public static final String END = "end";
	public static final String VALIDATTING = "validatting";
	public static final String TRANSFERRING = "transferring";
	public static final String CONSULTING = "consulting";

	private static Logger log = Logger.getLogger(CallHandlerImpl.class
			.getName());

	@Override
	public C5Response handleAction(Call call, C5Action action) {
		try {
			String state = call.getState();
			if (state.equals(INIT)) {
				return CallInit.handleAction(call, action);
			} else if (state.equals(HOLD)) {
				return CallHold.handleAction(call, action);
			} else if (state.equals(CHATTING)) {
				return CallChatting.handleAction(call, action);
			} else if (state.equals(THREE_WAY_CALL)) {
				return CallThreeWay.handleAction(call, action);
			} else if (state.equals(VALIDATTING)) {
				return CallValidatting.handleAction(call, action);
			} else if (state.equals(CONSULTING)) {
				return CallConsulting.handleAction(call, action);
			} else if (state.equals(TRANSFERRING)) {
				return CallTransferring.handleAction(call, action);
			} else {
				log.warning("Handler of this action not found: " + state
						+ "\r\n" + action.getJsonString());
			}
			return new C5Response(action.getActionName(), action.getActionID(),
					"Handler of this action not found", false);
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
			return new C5Response(action.getActionName(), action.getActionID(),
					e.getMessage(), false);
		}
	}

	@Override
	public void handleEvent(Call call, C5Event event) {
		try {
			String state = call.getState();
			if (state.equals(INIT)) {
				CallInit.handleEvent(call, event);
			} else if (state.equals(HOLD)) {
				CallHold.handleEvent(call, event);
			} else if (state.equals(CHATTING)) {
				CallChatting.handleEvent(call, event);
			} else if (state.equals(THREE_WAY_CALL)) {
				CallThreeWay.handleEvent(call, event);
			} else if (state.equals(VALIDATTING)) {
				CallValidatting.handleEvent(call, event);
			} else if (state.equals(CONSULTING)) {
				CallConsulting.handleEvent(call, event);
			} else if (state.equals(TRANSFERRING)) {
				CallTransferring.handleEvent(call, event);
			}else {
				log.warning("Handler of this action not found: " + state
						+ "\r\n" + event.getJsonString());
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "", e);
		}
	}

}
