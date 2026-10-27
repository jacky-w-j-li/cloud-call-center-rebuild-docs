package com.dishui.model;

import java.util.Map;

public class PhoneBarVo {
	private String PhoneBarItemId;
	private String PhoneBarItemName;
	private String IsEnable;
	public String getIsEnable() {
		return IsEnable;
	}

	public void setIsEnable(String isEnable) {
		IsEnable = isEnable;
	}

	public void mapRow(Map<String, Object>data){
		if(data.get("PhoneBarItemId").equals("0")){
			
				this.PhoneBarItemId = "IDLE_TIME_LENGTH";
				
		}else if(data.get("PhoneBarItemId").equals("1")){
				this.PhoneBarItemId = "BUSY_TIME_LENGTH";
		}else{
				this.PhoneBarItemId = "STATE"+data.get("PhoneBarItemId")+"_TIME_LENGTH";
			
		}
		
		 
		if(data.containsKey("PhoneBarItemName")) this.PhoneBarItemName = data.get("PhoneBarItemName").toString() + "\u603b\u65f6\u957f";
		if(data.containsKey("IsEnable")) this.IsEnable = data.get("IsEnable").toString();
	}

	public String getPhoneBarItemId() {
		return PhoneBarItemId;
	}

	public void setPhoneBarItemId(String phoneBarItemId) {
		PhoneBarItemId = phoneBarItemId;
	}

	public String getPhoneBarItemName() {
		return PhoneBarItemName;
	}

	public void setPhoneBarItemName(String phoneBarItemName) {
		PhoneBarItemName = phoneBarItemName;
	}

}
