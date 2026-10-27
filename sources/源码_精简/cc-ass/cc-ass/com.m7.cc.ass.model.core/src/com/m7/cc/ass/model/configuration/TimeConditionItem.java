package com.m7.cc.ass.model.configuration;

public class TimeConditionItem {
	private String times = "*";
	private String daysOfWeek = "*";
	private String daysOfMoth = "*";
	private String moths = "*";
	
	public String getTimes() {
		return times;
	}

	public void setTimes(String times) {
		this.times = times;
	}

	public String getDaysOfWeek() {
		return daysOfWeek;
	}

	public void setDaysOfWeek(String daysOfWeek) {
		this.daysOfWeek = daysOfWeek;
	}

	public String getDaysOfMoth() {
		return daysOfMoth;
	}

	public void setDaysOfMoth(String daysOfMoth) {
		this.daysOfMoth = daysOfMoth;
	}

	public String getMoths() {
		return moths;
	}

	public void setMoths(String moths) {
		this.moths = moths;
	}
	
	public String getConditionString(){
		return times+","+daysOfWeek+","+daysOfMoth+","+moths;
	}
}
