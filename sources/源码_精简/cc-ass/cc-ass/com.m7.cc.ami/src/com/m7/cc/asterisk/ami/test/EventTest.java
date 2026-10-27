package com.m7.cc.asterisk.ami.test;

import java.io.IOException;
import java.util.Hashtable;

import com.m7.cc.ami.service.AMIClient;
import com.m7.cc.asterisk.ami.C5Constants;
import com.m7.cc.asterisk.ami.EventListener;
import com.m7.cc.asterisk.ami.action.AsteriskEvent;
import com.m7.cc.asterisk.ami.action.Originate;
import com.m7.cc.asterisk.ami.exceptions.ConnectionException;
import com.m7.cc.command.Fields;

public class EventTest implements EventListener{
	
//	private Hashtable<String, AsteriskEvent> map = new  Hashtable<String, AsteriskEvent>();
	
	
	
	public static void main(String[] args){
		AMIClient client = new AMIClient("10.1.1.112", "10.8.3.15", 6032);
		try {
			client.login("123", "123");
		} catch (ConnectionException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
//		client.addEventListener(new EventTest(), C5Constants.ASTERISK_EVENT_ALL);
		
		for(int i=0;i<10;i++) {
			
			Originate action = new Originate("SIP/1234567@10.8.11.113:6060", "s",
					"musiconhold", "1", "ddddddddddddd");
			try {
				Thread.currentThread().sleep(1000);
				client.sendAction(action);
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
//		Redirect action = new Redirect("", "meetme-3000", "3000", "1", "sdfsdfdsfdsfdsf");
//		client.sendAction(target)
	}



	@Override
	public void connectionClosed() {
		// TODO Auto-generated method stub
		
	}



	@Override
	public void processEvent(AsteriskEvent event) {
		// TODO Auto-generated method stub
		System.out.println(event.toString());
		/*if(event.getEventName().equals(AMIField.NEW_CHANNEL)){
			map.put(event.getValue(AMIField.CHANNEL), event);
		} else if (event.getEventName().equals(AMIField.HANGUP)){
			map.remove(event.getValue(AMIField.CHANNEL));
			System.out.println(map.size());
		}*/
	}
}

