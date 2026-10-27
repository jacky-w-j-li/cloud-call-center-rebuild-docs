package com.m7.cc.sip.proxy;

import java.util.Hashtable;
import java.util.Iterator;

public class SipMessage {
	private String request;
	
	private Hashtable<String, String> map = new Hashtable<String, String>();
	
	private Sdp sdp = new Sdp();
	
	public SipMessage(){
		
	}
	
	public String getRequest() {
		return request;
	}

	/**
	 * v=0
o=- 1304685641 950925 IN IP4 192.168.1.3
s=-
c=IN IP4 116.231.21.84
t=0 0
m=audio 10010 RTP/AVP 18 101
a=ptime:20
a=rtpmap:18 G729/8000
a=sendrecv
a=rtpmap:101 telephone-event/8000
a=fmtp:101 0-15
	 */
	public Hashtable<String, String> paser(String message) {
		String a[] = message.split("\r\n");
		request = a[0];
		for(int i=1;i<a.length;i++) {
			String b = a[i];
			if(b.indexOf(": ") != -1 && !b.startsWith("a=")){
				String[] data = b.split(": ");
				if(data.length > 1)
					map.put(data[0], data[1]);
				else map.put(data[0], "");
			} else if(!b.startsWith("\r\n") && !b.equals("")){
				sdp.parse(b);
			}
		}
		return map;
	}
	
	public String getHeader(String key) {
		return map.get(key);
	}
	
	public void addHeader(String key, String value) {
		map.put(key, value);
	}
	
	public Sdp getSdp() {
		return sdp;
	}

	public String getSipMessage() {
		Iterator<String> it = map.keySet().iterator();
		String a = request;
		while(it.hasNext()) {
			String key = it.next();
			a += "\r\n"+key+": "+map.get(key);
		}
		a += "\r\n"+sdp.getString();
		if(a.endsWith("\r\n")) {
			a = a.substring(0, a.length() - 2);
		}
		return a+"\r\n\r\n";
	}
	
}
