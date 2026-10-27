package com.m7.cc.ass.server.config;

public class ACServer {
	private static ACServer instance;
	
	public ACServer(){
		instance = this;
		
		//. Start http server
		ACSHttpServer.getInstance();
		
		System.out.println("ACS Server started.");
	}

	public static ACServer getInstance() {
		return instance;
	}
	
	// Aman zhai. 2010.05.13
	public void stopACServer()
	{
		
	}
	// <--
}
