package com.m7.cc.configuration.service;

public abstract class Context {
	private String name;
	private String exten;
	
	public Context(String context, String exten){
		this.name = context;
		this.exten = exten;
	}
	
	public String getContext() {
		return name;
	}

	public String getExten() {
		return exten;
	}
}
