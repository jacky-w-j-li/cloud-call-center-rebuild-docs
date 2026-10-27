package com.m7.cc.ass.gateway.config;

public class GWServer {
	private static GWServer instance;
	
	private GWServer(){
		instance = this;
		
		//1. Start http server
		GWHttpServer.getInstance();
		
		System.out.println("GW Config Server started.");
	}

	public static GWServer getInstance() {
		if(instance == null) {
			new GWServer();
		}
		return instance;
	}
	
	public void stopACServer()
	{
		
	}
}
