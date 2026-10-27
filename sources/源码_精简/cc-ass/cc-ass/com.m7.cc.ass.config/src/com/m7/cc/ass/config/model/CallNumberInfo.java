package com.m7.cc.ass.config.model;

import com.m7.cc.util.Utils;

public class CallNumberInfo {
	private String segment;
	private String province;
	private String city;
	private String districtNo;
	
	/*
	 * The token like:
	 * segment|province|city|districtNo
	 */
	public void setValues(String token){
		String[] arr = token.split("\\|");
		if(arr.length > 3){
			this.segment = arr[0];
			this.province = Utils.toUnicode(arr[1]);
			this.city = Utils.toUnicode(arr[2]);
			this.districtNo = arr[3];
		}
	}
	
	public String getSegment() {
		return segment;
	}
	public void setSegment(String segment) {
		this.segment = segment;
	}
	public String getProvince() {
		return province;
	}
	public void setProvince(String province) {
		this.province = Utils.toUnicode(province);
	}
	public String getCity() {
		return city;
	}
	public void setCity(String city) {
		this.city = Utils.toUnicode(city);
	}
	public String getDistrictNo() {
		return districtNo;
	}
	public void setDistrictNo(String districtNo) {
		this.districtNo = districtNo;
	}
}
