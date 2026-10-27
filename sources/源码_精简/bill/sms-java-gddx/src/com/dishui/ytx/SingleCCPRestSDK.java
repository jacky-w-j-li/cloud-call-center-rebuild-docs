package com.dishui.ytx;

import com.dishui.sms.WSPSSmsMaster;

public class SingleCCPRestSDK {
	public static CCPRestSDK instance;
	 public static CCPRestSDK getInstance(){
	        if(instance == null){
	            new SingleCCPRestSDK();
	        }
	        return instance;
	    }
	 private SingleCCPRestSDK(){
		 instance = new CCPRestSDK();
	 }
}
