package com.m7.cc.sip.proxy;

import java.util.Vector;

public class Sdp {
	private String v;
	private String o;
	private String s;
	private String t;
	private Vector<String> other = new Vector<String>();
	private Vector<String> a = new Vector<String>();
	
	//m
	private String media_type;
	private int port;
	private int port_num;
	private String proto;
	private String[] media_formats;
	
	//c
	private String net_type;
	private String addr_type;
	private String connection_address;
	
	public Sdp(){
		
	}
	
	/**
v=0
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
	 * @param line
	 */
	public void parse(String line) {
		if(line.startsWith("v=")) {
			v = line;
		} else if (line.startsWith("o=")){
			o = line;
		} else if (line.startsWith("s=")){
			s = line;
		} else if (line.startsWith("c=")){
			setConnection(line);
		} else if (line.startsWith("t=")){
			t = line;
		} else if (line.startsWith("m=")){
			parseMediaField(line);
		} else if (line.startsWith("a=")) {
			a.add(line);
		} else {
			other.add(line);
		}
	}
	
	public String getMediaType() {
		return media_type;
	}

	public void setMediaType(String media_type) {
		this.media_type = media_type;
	}

	public int getPort() {
		return port;
	}

	public void setPort(int port) {
		this.port = port;
	}

	public int getPort_num() {
		return port_num;
	}

	public void setPort_num(int port_num) {
		this.port_num = port_num;
	}

	public String getProto() {
		return proto;
	}

	public void setProto(String proto) {
		this.proto = proto;
	}

	public String[] getMedia_formats() {
		return media_formats;
	}
	
	public String getNet_type() {
		return net_type;
	}

	public void setNet_type(String net_type) {
		this.net_type = net_type;
	}

	public void setMedia_formats(String[] media_formats) {
		this.media_formats = media_formats;
	}
	
	public String getAddr_type() {
		return addr_type;
	}

	public void setAddr_type(String addr_type) {
		this.addr_type = addr_type;
	}
	
	public String getConnection_address() {
		return connection_address;
	}

	public void setConnection_address(String connection_address) {
		this.connection_address = connection_address;
	}
	
	/**
	 * set connection via parsing a connection field
	 * @param connection c=<nettype> <addrtype> <connection-address>
	 */
	private void setConnection(String connection){
		if(!connection.startsWith("c="))
			return;
		String[] fields = connection.split(" ");
		if(fields.length < 3){
			
		}else{
			setNet_type(fields[0].replaceAll("c=", ""));
			setAddr_type(fields[1]);
			setConnection_address(fields[2]);
		}
	}

	private void parseMediaField(String mediaField){
		if(mediaField.startsWith("m=")){
			String[] fields = mediaField.split(" ");
			if(fields == null || fields.length<3)
				return;
			//media type
			setMediaType(fields[0].replaceAll("m=", ""));
			
			//media port
			if(fields[1].indexOf("/") != -1){
				String[] ports = fields[1].split("/");
				setPort(Integer.valueOf(ports[0]).intValue());
				setPort_num(Integer.valueOf(ports[1]).intValue());
			} else {
				setPort(Integer.valueOf(fields[1]).intValue());
			}
			
			//protocol
			setProto(fields[2]);
			//formats
			media_formats = new String[fields.length - 3];
			for(int i=3;i<fields.length;i++){
				media_formats[i-3] = fields[i];
			}
		}
	}
	
	public String getString() {
		StringBuffer sb = new StringBuffer();
		sb.append("m="+media_type+" "+port+(port_num>1?"/"+port_num:"")+" "+this.proto);
		for(int i=0;media_formats != null && i < media_formats.length;i++){
			sb.append(" "+media_formats[i]);
		}
		String a = "\r\n";
		if(v == null)
			return "";
		a += v+"\r\n";
		a += o+"\r\n";
		a += s+"\r\n";
		a += "c="+net_type+" "+addr_type+" "+connection_address+"\r\n";
		a += t+"\r\n";
		a += sb.toString();
		for(int i=0;i<other.size();i++) {
			a += "\r\n"+other.get(i);
		}
		for(int i=0;i<this.a.size();i++) {
			a += "\r\n"+this.a.get(i);
		}
		
		return a;
	}
}
