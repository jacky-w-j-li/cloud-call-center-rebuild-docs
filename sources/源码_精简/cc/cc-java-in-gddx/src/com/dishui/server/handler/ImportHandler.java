package com.dishui.server.handler;

import java.util.Hashtable;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.command.Fields;
import com.dishui.util.excel.ExcelHeadHandler;
import com.dishui.util.excel.ExcelHeadHandler2;

public class ImportHandler {
	private static Logger log = Logger.getLogger(ImportHandler.class.getName());
	public static Hashtable<String, ImportTaskHandler> impTasks = new Hashtable<String, ImportTaskHandler>();
	public static Hashtable<String, QuickreplyImportTaskHandler> quickReplyImpTasks = new Hashtable<String, QuickreplyImportTaskHandler>();

	public static int batchCount = 1000;

	public static C5Response handle(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String method = action.getStringValue(Fields.Method);
			if (method.equals("import")) {
				String accountId = action.getStringValue(Fields.Account);
				ImportTaskHandler task = impTasks.get(accountId);
				if (task == null) {
					task = new ImportTaskHandler(accountId);
					impTasks.put(accountId, task);
				}
				response.setSucceed(true);
			} else if (method.equals("quickreplyimport")) {// 快捷回复实时导入
				String accountId = action.getStringValue(Fields.Account);
				String moduleType = action.getStringValue(Fields.MODULETYPE);
				// QuickreplyImportTaskHandler imptask =
				// quickReplyImpTasks.get(accountId);
				QuickreplyImportTaskHandler imptask = null;
				if (imptask == null) {
					imptask = new QuickreplyImportTaskHandler(accountId,moduleType);
					quickReplyImpTasks.put(accountId, imptask);
				}
				response.setSucceed(true);
			} else if (method.equals("getHeads")) {
				String fileName = action.getStringValue("file");
				String trueName = action.getStringValue("trueName");
				// fileName=AppConfig.getInstance().getVar("file.dir")+fileName;
				ExcelHeadHandler xlsHead = new ExcelHeadHandler();
				List<String> list = xlsHead.process(fileName, trueName);

				if (list == null) {
					response.addParameter("message", "解析表头异常，请检查Excel文件格式是否正确！");
					response.setSucceed(false);
				} else {
					response.addParameter("file", fileName);
					response.addParameter("heads", list);
					response.addParameter("trueName", trueName);
					response.setSucceed(true);
				}
            }else if(method.equals("getHeads2")){
                String fileName = action.getStringValue("file");
                String trueName = action.getStringValue("trueName");
//				fileName=AppConfig.getInstance().getVar("file.dir")+fileName;
                ExcelHeadHandler2 xlsHead=new ExcelHeadHandler2();
                List<String> list=xlsHead.process(fileName,trueName);
                if(list==null){
                    response.addParameter("message", "解析表头异常，请检查Excel文件格式是否正确！");
                    response.setSucceed(false);
                }else{
                    response.addParameter("file", fileName);
                    response.addParameter("heads", list);
                    response.addParameter("trueName", trueName);
                    response.setSucceed(true);
                }
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
