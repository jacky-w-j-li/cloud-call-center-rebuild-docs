package com.dishui.checkNum;

public class UpNumWorker  implements Runnable{
	@Override
	public void run() {
		// TODO Auto-generated method stub
		ServiceNumService sns=new ServiceNumService();
		sns.getAllServiceNum();
	}
	

}
