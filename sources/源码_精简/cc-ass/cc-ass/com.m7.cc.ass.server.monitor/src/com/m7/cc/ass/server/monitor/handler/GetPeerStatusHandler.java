package com.m7.cc.ass.server.monitor.handler;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import com.m7.cc.ami.service.AMICore;
import com.m7.cc.ass.model.C5Pbx;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.configuration.SipPeer;
import com.m7.cc.asterisk.ami.action.SIPPeers;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;

public class GetPeerStatusHandler {
	public static C5Response getPeerStatus(C5Action action) {
		C5Response response = new C5Response(action.getActionName(), action
				.getActionID());
		try{
			String pbx = null;
			if(action.hasKey(Fields.PBX))
				pbx = (String) action.getParameterValue(Fields.PBX);
			String account = null;
			if(action.hasKey(Fields.Account))
				account = action.getStringValue(Fields.Account);
			String peerName = null;
			if(action.hasKey(Fields.Peer))
				peerName = (String) action.getParameterValue(Fields.Peer);
			if (pbx != null) {
				C5Pbx client = RuntimeData.getInstance().getPbxViaId(pbx);
				if (client == null) {
					response.setMessage("Invalid pbx: " + pbx);
					response.setSucceed(false);
					return response;
				} else {
					AMICore.getInstance().getAMIClient(pbx).sendAction(
							new SIPPeers(Utils.getSynActionID("sippeers")));
					Iterator<SipPeer> peers = client.getPeers().values().iterator();
					List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
					while (peers.hasNext()) {
						SipPeer peer = peers.next();
						if(account != null && !peer.getAccount().equals(account))
							continue;
						if(peerName != null && !peer.getExten().startsWith(peerName))
							continue;
						events.add(peer.getStateEvent().getParameters());
					}
					response.addParameter(Fields.Event, events);
				}
			} else {
				Vector<String> clients = RuntimeData.getInstance().getPbxs();
				List<Map<String, Object>> events = new ArrayList<Map<String, Object>>();
				for(int i=0;i<clients.size();i++) {
					C5Pbx client = RuntimeData.getInstance().getPbxViaId(clients.get(i));
					AMICore.getInstance().getAMIClient(clients.get(i)).sendAction(
							new SIPPeers(Utils.getSynActionID("sippeers")));
					Iterator<SipPeer> peers = client.getPeers()
							.values().iterator();
					while (peers.hasNext()) {
						SipPeer peer = peers.next();
						if(account != null && !peer.getAccount().equals(account))
							continue;
						if(peerName != null && !peer.getExten().startsWith(peerName))
							continue;
						events.add(peer.getStateEvent().getParameters());
					}
				}
				response.addParameter(Fields.Event, events);
			}
			response.setSucceed(true);
		} catch (Exception e){
			response.setSucceed(false);
			response.setMessage(e.getMessage());
		}
		return response;
	}
}
