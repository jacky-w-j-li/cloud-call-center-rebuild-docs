package com.m7.cc.sip.proxy;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;

public class SipMessage {
	private String request;
	
	private ArrayList<String> headers = new ArrayList<String>();
	private ArrayList<String> contents = new ArrayList<String>();
	
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
	public void paser(String message) {
		String a[] = message.split("\r\n");
		request = a[0];
		for(int i=1;i<a.length;i++) {
			String b = a[i];
			if(b.indexOf(": ") != -1 && !b.startsWith("a=")){
				String[] data = b.split(": ");
				headers.add(i-1, data[0]);
				if(data.length > 1)
					contents.add(i-1, data[1]);
				else contents.add(i-1, "");
			} else if(!b.startsWith("\r\n") && !b.equals("")){
				sdp.parse(b);
			}
		}
	}
	
	public String getHeader(String key) {
		for(int i=0;i<headers.size();i++) {
			if(key.equals(headers.get(i))){
				return contents.get(i);
			}
		}
		return null;
	}
	
	public Sdp getSdp() {
		return sdp;
	}
	
	public void updateHeader(String header, String content) {
		for(int i=0;i<headers.size();i++) {
			if(header.equals(headers.get(i))){
				contents.set(i, content);
			}
		}
	}

	public String getSipMessage() {
		String a = request;
		for(int i=0;i<headers.size();i++) {
			a += "\r\n"+headers.get(i)+": "+contents.get(i);
		}
		a += "\r\n"+sdp.getString();
		if(a.endsWith("\r\n")) {
			a = a.substring(0, a.length() - 2);
		}
		return a+"\r\n\r\n";
	}
	
}
