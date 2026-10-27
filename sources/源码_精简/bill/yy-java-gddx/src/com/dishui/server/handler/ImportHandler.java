package com.dishui.server.handler;

import java.util.Hashtable;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.bill.command.C5Action;
import com.dishui.bill.command.C5Response;
import com.dishui.bill.command.Fields;
import com.dishui.util.excel.ExcelHeadHandler;



public class ImportHandler {
	private static Logger log = Logger.getLogger(ImportHandler.class.getName());
	public static Hashtable<String, ImportTaskHandler> impTasks = new Hashtable<String, ImportTaskHandler>();

	public static C5Response handle(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String method = action.getStringValue(Fields.Method);
			if(method.equals("import")){
				String accountId = action.getStringValue(Fields.Account);
				ImportTaskHandler task = impTasks.get(accountId);
				if (task == null) {
					task = new ImportTaskHandler(accountId);
					impTasks.put(accountId, task);
				}
				response.setSucceed(true);
			}else if(method.equals("getHeads")){
				String fileName = action.getStringValue("file");
				String trueName = action.getStringValue("trueName");
//				fileName=AppConfig.getInstance().getVar("file.dir")+fileName;
				List<String> list=ExcelHeadHandler.process(fileName,trueName);
				response.addParameter("file", fileName);
				response.addParameter("heads", list);
				response.addParameter("trueName", trueName);
				response.setSucceed(true);
			}
			return response;
		} catch (Exception e) {
			e.printStackTrace();
			log.log(Level.WARNING, "import failed", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
			response.addParameter("result", "500");
		}
		return response;
	}
}
