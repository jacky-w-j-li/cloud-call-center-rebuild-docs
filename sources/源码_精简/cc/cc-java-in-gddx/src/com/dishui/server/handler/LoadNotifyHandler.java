package com.dishui.server.handler;

import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;

import java.util.logging.Level;
import java.util.logging.Logger;

public class LoadNotifyHandler {
	private static Logger log = Logger.getLogger(LoadNotifyHandler.class.getName());
    private static int currentLoad=0;
    private static int currentBatchNum=1000;

    /**
     * http://127.0.0.1:9999/service?Action=loadNotify&load=3.6
     * @param action
     * @return
     */
	public static C5Response handle(C5Action action) {
		C5Response response = new C5Response(action);
		try {
            String load = action.getStringValue("load");
            double l=Double.parseDouble(load);
            int  _load=(int)l;

            if(currentLoad==_load){
                log.info("load["+_load+"] 已设置");
            }else{
                currentLoad= _load;
                if(_load==3){
                    currentBatchNum=500;
                    setImpBatchNum();
                }else if(_load==4){
                    currentBatchNum=250;
                    setImpBatchNum();
                }else if(_load==5){
                    currentBatchNum=125;
                    setImpBatchNum();
                }else if(_load==6){
                    currentBatchNum=60;
                    setImpBatchNum();
                }else if(_load==7){
                    currentBatchNum=30;
                    setImpBatchNum();
                }else if(_load>=8){
                    currentBatchNum=1;
                    setImpBatchNum();
                }else{
                    currentLoad=0;
                    currentBatchNum=1000;
                    setImpBatchNum();
                }
            }
            log.info("当前DB负载为["+l+"],导入线程数为["+ImportHandler.impTasks.size()+"],每线程每次入库数为["+currentBatchNum+"]");
            response.setSucceed(true);
			return response;
		} catch (Exception e) {
			e.printStackTrace();
			log.log(Level.WARNING, "LoadNotifyHandler failed", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
			response.addParameter("result", "500");
		}
		return response;
	}
    private static void setImpBatchNum() {
        ImportHandler.batchCount=currentBatchNum;
    }

}
