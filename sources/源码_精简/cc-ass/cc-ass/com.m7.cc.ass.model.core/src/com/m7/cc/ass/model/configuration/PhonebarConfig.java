package com.m7.cc.ass.model.configuration;

import com.m7.cc.command.Fields;

public class PhonebarConfig{
	public static final String CONFIG_ITEM_PREFIX = ",";
	public static final String ITEM_KEY_VALUE_PREFIX = ":";
	
	
	private String B00 = "\u7a7a\u95f2";  //空闲;
	private String B01 = "\u5fd9\u788c";  //忙碌;
	private String B02 = "\u5c0f\u4f11";  //小休;
	private String B03;
	private String B04;
	private String B05;
	private String B06;
	private String B07;
	private String B08;
	private String B09;
	private String B99 = "\u540e\u5904\u7406";  //系统置忙;
	
	public PhonebarConfig(){
	}
	
	public void setValue(String configString) {
		String[] configArr = configString.split(CONFIG_ITEM_PREFIX);
		String[] configItem;
		this.clearValue();
		for(String item : configArr){
			configItem = item.split(ITEM_KEY_VALUE_PREFIX);
			
			//B00、 B01 and B02 is not configurable.
			if(configItem[0].equals(Fields.B03)){
				this.B03 = configItem[1];
			}else if(configItem[0].equals(Fields.B04)){
				this.B04 = configItem[1];
			}else if(configItem[0].equals(Fields.B05)){
				this.B05 = configItem[1];
			}else if(configItem[0].equals(Fields.B06)){
				this.B06 = configItem[1];
			}else if(configItem[0].equals(Fields.B07)){
				this.B07 = configItem[1];
			}else if(configItem[0].equals(Fields.B08)){
				this.B08 = configItem[1];
			}else if(configItem[0].equals(Fields.B09)){
				this.B09 = configItem[1];
			}
		}
	}
	
	private void clearValue() {
		this.B03 = null;
		this.B04 = null;
		this.B05 = null;
		this.B06 = null;
		this.B07 = null;
		this.B08 = null;
		this.B09 = null;
	}

	public String getValueString(){
		StringBuffer buffer = new StringBuffer();
		if(this.B00 != null){
			joinString(buffer, Fields.B00, this.B00);
		}
		if(this.B01 != null){
			joinString(buffer, Fields.B01, this.B01);
		}

		if(this.B02 != null){
			joinString(buffer, Fields.B02, this.B02);
		}

		if(this.B03 != null){
			joinString(buffer, Fields.B03, this.B03);
		}

		if(this.B04 != null){
			joinString(buffer, Fields.B04, this.B04);
		}

		if(this.B05 != null){
			joinString(buffer, Fields.B05, this.B05);
		}

		if(this.B06 != null){
			joinString(buffer, Fields.B06, this.B06);
		}

		if(this.B07 != null){
			joinString(buffer, Fields.B07, this.B07);
		}

		if(this.B08 != null){
			joinString(buffer, Fields.B08, this.B08);
		}

		if(this.B09 != null){
			joinString(buffer, Fields.B09, this.B09);
		}

		if(this.B99 != null){
			joinString(buffer, Fields.B99, this.B99);
		}
		
		if(String.valueOf((buffer.charAt(buffer.length()-1))).equals(CONFIG_ITEM_PREFIX)){
			buffer.deleteCharAt(buffer.length()-1);
		}
		
		return buffer.toString();
	}
	
	private void joinString(StringBuffer buffer, String key, String value){
		buffer.append(key);
		buffer.append(ITEM_KEY_VALUE_PREFIX);
		buffer.append(value);
		buffer.append(CONFIG_ITEM_PREFIX);
	}
	
	public String getB00() {
		return B00;
	}
	public void setB00(String b00) {
		B00 = b00;
	}
	public String getB01() {
		return B01;
	}
	public void setB01(String b01) {
		B01 = b01;
	}
	public String getB02() {
		return B02;
	}
	public void setB02(String b02) {
		B02 = b02;
	}
	public String getB03() {
		return B03;
	}
	public void setB03(String b03) {
		B03 = b03;
	}
	public String getB04() {
		return B04;
	}
	public void setB04(String b04) {
		B04 = b04;
	}
	public String getB05() {
		return B05;
	}
	public void setB05(String b05) {
		B05 = b05;
	}
	public String getB06() {
		return B06;
	}
	public void setB06(String b06) {
		B06 = b06;
	}
	public String getB07() {
		return B07;
	}
	public void setB07(String b07) {
		B07 = b07;
	}
	public String getB08() {
		return B08;
	}
	public void setB08(String b08) {
		B08 = b08;
	}
	public String getB09() {
		return B09;
	}
	public void setB09(String b09) {
		B09 = b09;
	}

	public String getB99() {
		return B99;
	}

	public void setB99(String b99) {
		B99 = b99;
	}
}
