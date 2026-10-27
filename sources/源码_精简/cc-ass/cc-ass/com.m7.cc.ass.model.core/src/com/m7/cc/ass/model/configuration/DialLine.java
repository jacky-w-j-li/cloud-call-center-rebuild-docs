package com.m7.cc.ass.model.configuration;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;

import com.m7.cc.command.Fields;

public class DialLine {
	private String exten;
	private String pbx;
	private String account;
	private boolean needPrefix = false;
	private boolean dialout = true;
	private String didNum;
	private String multiDidNum;
	private boolean multiDidEnable = false;
	private String multiDidStrategy;
	private String multiDidScope;
	private List<String> multiDidList;
	private int multiDidIndex = 0;
	
	private String displayName;
	
	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public DialLine(String pbx, String account, String exten){
		this.pbx = pbx;
		this.account = account;
		this.exten = exten;
	}

	public String getExten() {
		return exten;
	}

	public void setExten(String exten) {
		this.exten = exten;
	}

	public String getPbx() {
		return pbx;
	}

	public void setPbx(String pbx) {
		this.pbx = pbx;
	}

	public String getAccount() {
		return account;
	}

	public void setAccount(String account) {
		this.account = account;
	}

	public boolean isNeedPrefix() {
		return needPrefix;
	}

	public void setNeedPrefix(boolean needPrefix) {
		this.needPrefix = needPrefix;
	}

	public boolean isDialout() {
		return dialout;
	}

	public void setDialout(boolean dialout) {
		this.dialout = dialout;
	}
	
	public String getDidNum() {
		return didNum;
	}

	public void setDidNum(String didNum) {
		this.didNum = didNum;
	}

	public String getMultiDidNum() {
		return multiDidNum;
	}

	public void setMultiDidNum(String multiDidNum) {
		this.multiDidNum = multiDidNum;
		if(!multiDidNum.equals("")){
			if(this.multiDidList == null){
				this.multiDidList = new ArrayList<String>();
			}
			String nums = multiDidNum;
			String a[] = nums.split(",");
			for(int i=0 ;i<a.length ;i++){
				if(a[i].indexOf("-") != -1){
					String b[] = a[i].split("-");
					boolean isBeginZero = false;
					if(b[0].startsWith("0")){
						isBeginZero = true;
					}
					String cur = b[0];
			        while(Long.parseLong(cur) <= Long.parseLong(b[1])){
			        	this.multiDidList.add(cur);
			        	if(isBeginZero){
			        		cur = "0" + (Long.parseLong(cur) + 1) + "";	
			        	}else{
			        		cur = (Long.parseLong(cur) + 1) + "";					        		
			        	}
			        }
				}else{
					this.multiDidList.add(a[i]);
				}
			}
		}
	}

	public boolean isMultiDidEnable() {
		return multiDidEnable;
	}

	public void setMultiDidEnable(boolean multiDidEnable) {
		this.multiDidEnable = multiDidEnable;
	}

	public String getMultiDidStrategy() {
		return multiDidStrategy;
	}

	public void setMultiDidStrategy(String multiDidStrategy) {
		this.multiDidStrategy = multiDidStrategy;
	}

	public String getMultiDidScope() {
		return multiDidScope;
	}

	public void setMultiDidScope(String multiDidScope) {
		this.multiDidScope = multiDidScope;
	}

	public List<String> getMultiDidList() {
		return multiDidList;
	}

	public void setMultiDidList(List<String> multiDidList) {
		this.multiDidList = multiDidList;
	}

	public int getMultiDidIndex() {
		return multiDidIndex;
	}

	public void setMultiDidIndex(int multiDidIndex) {
		this.multiDidIndex = multiDidIndex;
	}

	public boolean setValue(Hashtable<String, String> data){
		try{
			this.setNeedPrefix(data.get(Fields.NeedPrefix).equals("yes"));
			this.setDialout(data.get(Fields.Dialout).equals("yes"));
			this.setDidNum(data.get(Fields.DidNum));
			if(data.containsKey(Fields.MultiDidNum)){
				if(this.multiDidList == null){
					this.multiDidList = new ArrayList<String>();
				}
				this.setMultiDidNum(data.get(Fields.MultiDidNum));
				if(data.get(Fields.MultiDidNum)!=null && !data.get(Fields.MultiDidNum).toString().endsWith("")){
					String nums = data.get(Fields.MultiDidNum).toString();
					String a[] = nums.split(",");
					for(int i=0 ;i<a.length ;i++){
						if(a[i].indexOf("-") != -1){
							String b[] = a[i].split("-");
							boolean isBeginZero = false;
							if(b[0].startsWith("0")){
								isBeginZero = true;
							}
							String cur = b[0];
					        while(Long.parseLong(cur) <= Long.parseLong(b[1])){
					        	this.multiDidList.add(cur);
					        	if(isBeginZero){
					        		cur = "0" + (Long.parseLong(cur) + 1) + "";	
					        	}else{
					        		cur = (Long.parseLong(cur) + 1) + "";					        		
					        	}
					        }
						}else{
							this.multiDidList.add(a[i]);
						}
					}
				}
			}
			if(data.containsKey(Fields.MultiDidEnable)){
				this.setMultiDidEnable(data.get(Fields.MultiDidEnable).equals("yes"));
			}
			if(data.containsKey(Fields.MultiDidStrategy)){
				this.setMultiDidStrategy(data.get(Fields.MultiDidStrategy));
			}
			if(data.containsKey(Fields.MultiDidScope)){
				this.setMultiDidScope(data.get(Fields.MultiDidScope));
			}
		}catch (Exception e){
			return false;
		}
		return true;
	}

}
