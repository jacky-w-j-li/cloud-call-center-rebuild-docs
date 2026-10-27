package com.koala.smart.server.config;

import java.util.Vector;

import com.koala.smart.server.exception.ConfigException;
import com.m7.cc.config.ConfPeer;

public class SecurityConfig {
	public static final String ID = "Security";
	public static final String PERMIT = "Permit";
	public static final String DECLINE = "Decline";
	public static final String ACTIVE = "Active";
	
	private String split = ",";
	private String span = "-";
	
	private boolean isActive = false;
	
	private Vector<String> permitList = new Vector<String>();
	private Vector<String> permitRang = new Vector<String>();
	private Vector<String> declineList = new Vector<String>();
	private Vector<String> declineRang = new Vector<String>();
	
	private ConfPeer peer;

	public void setPeer(ConfPeer peer) throws ConfigException {
		this.peer = peer;
		
		if(peer.contain(ACTIVE)){
			if(peer.getParam(ACTIVE).equalsIgnoreCase("yes")){
				isActive = true;
			} else if(peer.getParam(ACTIVE).equalsIgnoreCase("no")){
				isActive = false;
			} else throw new ConfigException("The value of 'Active' should be 'yes|no'");
		} else {
			peer.addParam(ACTIVE, "no");
		}
		
		if(peer.contain(PERMIT)){
			String[] permits = peer.getParam(PERMIT).split(split);
			for(int i=0;i<permits.length;i++){
				if(permits[i].indexOf(span) != -1)
					permitRang.add(permits[i]);
				else permitList.add(permits[i]);
			}
				
		}
		
		if(peer.contain(DECLINE)){
			String[] declines = peer.getParam(DECLINE).split(split);
			for(int i=0;i<declines.length;i++)
				if(declines[i].indexOf(span) != -1)
					declineRang.add(declines[i]);
				else declineList.add(declines[i]);
		}
	}
	
	/**
	 * To verify that the input ip of new session is approved or declined for 
	 * Smart Server.
	 * @param ip
	 * @return
	 */
	public boolean isDeclined(String ip){
		//1.in blacklist
		if(declineList.size() > 0 && declineList.contains(ip))
			return true;
		if(declineRang.size() > 0){
			for(int i=0;i<declineRang.size();i++){
				String[] rang = declineRang.get(i).split(span);
				String minIP = rang[0];
				String maxIP = rang[1];
				int min = compareIP(ip, minIP);
				if(min == 1){
					int max = compareIP(ip, maxIP);
					if(max == -1 || max == 0)
						return true;
				} else if(min == 0)
					return true;
			}
		}
		
		//2.not in black list, all permit
		if(permitList.size() == 0 && permitRang.size() == 0)
			return false;
		
		//3.not in black list, in permit
		if(permitList.size() > 0 && permitList.contains(ip))
			return false;
		
		if(permitRang.size() > 0){
			for(int i=0;i<permitRang.size();i++){
				String[] rang = permitRang.get(i).split(span);
				String minIP = rang[0];
				String maxIP = rang[1];
				int min = compareIP(ip, minIP);
				if(min == 1){
					int max = compareIP(ip, maxIP);
					if(max == -1 || max == 0)
						return false;
				} else if(min == 0)
					return false;
			}
		}
		
		return false;
	}
	
	/**
	 * Compare two ips
	 * @param ip
	 * @param toip
	 * @return if ip > toip, return 1; ip == toip return 0; ip < toip return -1;
	 */
	private int compareIP(String ip, String toip){
		String[] ips = ip.replace('.', ';').split(";");
		String[] toips = toip.replace('.', ';').split(";");
		int[] ips_int = new int[4];
		int[] toips_int = new int[4];
		for(int i=0;i<ips.length;i++){
			ips_int[i] = Integer.valueOf(ips[i]).intValue();
			toips_int[i] = Integer.valueOf(toips[i]).intValue();
		}
		
		if(ips_int[0] > toips_int[0])
			return 1;
		else if (ips_int[0] < toips_int[0]){
			return -1;
		}else {
			if(ips_int[1] > toips_int[1])
				return 1;
			else if (ips_int[1] < toips_int[1]){
				return -1;
			}else {
				if(ips_int[2] > toips_int[2])
					return 1;
				else if (ips_int[2] < toips_int[2]){
					return -1;
				}else {
					if(ips_int[3] > toips_int[3])
						return 1;
					else if (ips_int[3] < toips_int[3]){
						return -1;
					}else {
						return 0;
					}
				}
			}
		}
	}
	
	public void addPermitIP(String ip){
		permitList.add(ip);
		String ips = permitList.get(0);
		for(int i=1;i<permitList.size();i++){
			ips = split+permitList.get(i);
		}
		for(int i=0;i<permitRang.size();i++){
			ips = split+permitRang.get(i);
		}
		peer.addParam(PERMIT, ips);
	}
	
	public void addPermitIPs(String ips){
		permitRang.add(ips);
		String ipss = permitRang.get(0);
		for(int i=1;i<permitRang.size();i++){
			ipss = split+permitRang.get(i);
		}
		for(int i=0;i<permitList.size();i++){
			ipss = split+permitList.get(i);
		}
		peer.addParam(PERMIT, ipss);
	}
	
	public void addDeclineIP(String ip){
		declineList.add(ip);
		String ips = declineList.get(0);
		for(int i=1;i<declineList.size();i++){
			ips = split+declineList.get(i);
		}
		for(int i=0;i<declineRang.size();i++){
			ips = split+declineRang.get(i);
		}
		peer.addParam(DECLINE, ips);
	}
	
	public void addDeclineIPs(String ips){
		declineRang.add(ips);
		String ipss = declineRang.get(0);
		for(int i=1;i<declineRang.size();i++){
			ipss = split+declineRang.get(i);
		}
		for(int i=0;i<declineList.size();i++){
			ipss = split+declineList.get(i);
		}
		peer.addParam(DECLINE, ipss);
	}
	
	public boolean isActive(){
		return isActive;
	}
	
	public void setActive(boolean isActive) {
		this.isActive = isActive;
		peer.addParam(ACTIVE, isActive?"yes":"no");
	}
}
