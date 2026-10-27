package com.m7.cc.configuration.service.template;

import java.io.IOException;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.C5Account;
import com.m7.cc.ass.model.configuration.C5Queue;
import com.m7.cc.ass.model.configuration.TerminateCall;
import com.m7.cc.configuration.service.ServicePeer;

public class QueueTemplate {
	public static final String accountId = "_accountId";
	public static final String exten = "_exten";
	public static final String music = "_music";
	// public static final String joinEmpty = "_joinEmpty";
	public static final String checkAssignable = "_checkAssignable";
	public static final String toPeerWhenWaitTimeout = "_toPeerWhenWaitTimeout";
	public static final String toPeerWhenHanguped = "_toPeerWhenHanguped";
	public static final String toPeerWhenQueueEmpty = "_toPeerWhenQueueEmpty";
	public static final String toPeerWhenWait = "_toPeerWhenWait";
	// public static final String returnContext = "_returnContext";
	public static final String waitTime = "_waitTime";

	// public static final String investigate = "_investigate";

	public static String create(C5Account account, C5Queue queue) throws IOException {
		String data = "";
		
		if(queue == null)
			return data;
		
		data = ASConfig.getInstance().getPrivateTemplate(account.getAccount(), ASConfig.VM_QUEUE);
		if(data.equals(""))
			data = ASConfig.getInstance().getVmQueue();
		
		data = data.replaceAll(accountId, queue.getAccount());
		data = data.replaceAll(exten, queue.getExten());

		String filename = queue.getAnnounceMusic();
		String file = "";
		if (!filename.equals("0")) {
			if (filename.equals("sound/queue")) {
				file = filename;
			} else {
				file = ASConfig.getInstance().getConfigPath() + "/"
						+ queue.getPbx() + "/accounts/" + account.getAccount()
						+ "/" + ASConfig.AudioDirectory + "/" + filename;
			}
			file = "Playback(" + file + ");";
		}
		data = data.replaceAll(music, file);
		
		if (null != queue.getToPeerWhenQueueEmpty()) {
			ServicePeer peer = account.getServicePeer(queue
					.getToPeerWhenQueueEmpty());
			if (peer != null)
				data = data.replaceAll(toPeerWhenQueueEmpty, peer
						.getActionString());
			else if ("0".equals(queue.getToPeerWhenQueueEmpty())) {
				data = data.replaceAll(toPeerWhenQueueEmpty,
						"goto agentbusy,s,1");
			} else if ("1".equals(queue.getToPeerWhenQueueEmpty())) {
				String tempActionString = "goto " + queue.getAccount() + "-investigate, s, 1";
				data = data.replaceAll(toPeerWhenQueueEmpty, tempActionString);
			}else {
				String tempActionString = "goto " + queue.getAccount() + "-"
						+ queue.getExten() + "-queue, " + queue.getExten()
						+ ", empty-loop";
				data = data.replaceAll(toPeerWhenQueueEmpty, tempActionString);
			}
		} else {
			String tempActionString = "goto " + queue.getAccount() + "-"
					+ queue.getExten() + "-queue, " + queue.getExten()
					+ ", empty-loop";
			data = data.replaceAll(toPeerWhenQueueEmpty, tempActionString);
		}

		if (null != queue.getToPeerWhenHanguped()) {
			ServicePeer hangupToPeer = account.getServicePeer(queue
					.getToPeerWhenHanguped());
			if (hangupToPeer != null)
				data = data.replaceAll(toPeerWhenHanguped, hangupToPeer
						.getActionString());
			else {
				if ("1".equals(queue.getToPeerWhenHanguped()))
					data = data.replaceAll(toPeerWhenHanguped, "goto "
							+ account.getAccount() + "-investigate,s,1");
				else
					data = data.replaceAll(toPeerWhenHanguped,
							new TerminateCall().getActionString());
			}

		} else
			data = data.replaceAll(toPeerWhenHanguped, new TerminateCall()
					.getActionString());

		String waitTimeoutActionString = "";
		if (null != queue.getToPeerWhenWaitTimeout()) {
			ServicePeer waitTimeoutToPeer = account.getServicePeer(queue
					.getToPeerWhenWaitTimeout());
			if (waitTimeoutToPeer != null)
				waitTimeoutActionString = waitTimeoutToPeer.getActionString();
			else
				waitTimeoutActionString = "goto agentbusy,s,1";
		} else
			waitTimeoutActionString = new TerminateCall().getActionString();
		data = data.replaceAll(toPeerWhenWaitTimeout, waitTimeoutActionString);

		if (queue.isJoinEmpty()) {
			String tempActionString = "queueAssignable=1;\n\t\tAgi(agi://127.0.0.1:7891/AgiCheckQueueAssignable?pbx=\\${HOST}&exten="
					+ queue.getExten()
					+ ");\n\t\tif(\\${queueAssignable}==0){\n\t\t\tWait(1);\n\t\t\t"
					+ waitTimeoutActionString + ";\n\t\t}";
			data = data.replaceAll(checkAssignable, tempActionString);
		} else {
			data = data.replaceAll(checkAssignable, "");
		}
		
		if (null != queue.getToPeerWhenWait() && !"0".equals(queue.getToPeerWhenWait())){
			ServicePeer waitTransferToPeer = account.getServicePeer(queue.getToPeerWhenWait());
			if (waitTransferToPeer != null)
				data = data.replaceAll(toPeerWhenWait, waitTransferToPeer.getActionString());
		} else {
			data = data.replaceAll(toPeerWhenWait, new TerminateCall().getActionString());
		}
		String _waitTime = "60";
		if (queue.getWaitTime() > 0){
			_waitTime = queue.getWaitTime()+"";
		}
		if(queue.isSayExten())
			_waitTime += ",agi://127.0.0.1:7891/agisayexten?pbx=\\$\\{HOST\\}";
		data = data.replaceAll(waitTime, _waitTime);
		return data;
	}
}
