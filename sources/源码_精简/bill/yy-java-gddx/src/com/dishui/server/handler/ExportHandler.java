package com.dishui.server.handler;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.bill.command.C5Action;
import com.dishui.bill.command.C5Response;
import com.dishui.bill.command.Fields;
import com.dishui.bill.command.JSONReader;
import com.dishui.bill.service.AppConfig;
import com.dishui.util.excel.*;
import com.dishui.util.excel.bill.*;
import com.dishui.util.excel.handler.BillTelRecordExport;


public class ExportHandler {
    private static Logger log = Logger.getLogger(ExportHandler.class.getName());

    public static C5Response handle(C5Action action) {
        long time = System.currentTimeMillis();
        C5Response response = new C5Response(action);
        try {
            String method = action.getStringValue(Fields.Method);
            String json = action.getStringValue(Fields.Query);
            json = URLDecoder.decode(json, "UTF-8");
            JSONReader jsonReader = new JSONReader();
            HashMap<String, Object> map1 = (HashMap<String, Object>) jsonReader.read(json);
            String type = method;
            map1.put("type", type);

            if (method.equalsIgnoreCase("exportCustomer")) {
                Map<String, Object> query = new HashMap<String, Object>();
                query = map1;

                XssfWriter writer = new CustomerExport();
                String fileName = writer.process("客户导出", query);
                String[] temp = fileName.split("\\|");

                response.setSucceed(true);
//				response.addParameter("filename", fileName);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2") + "fileDownload?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportReportQueue")) {
                Map<String, Object> query = new HashMap<String, Object>();
                query = map1;
                System.out.println(query);
//				if(action.hasKey(Fields.Query)){
//					 query=(Map<String,Object>)action.getParameterValue(Fields.Query);
//				 }
                XssfWriter writer = new ReportQueueExport();
                String fileName = writer.process("技能组对比报表导出", query);
                System.out.println(fileName);
                String[] temp = fileName.split("\\|");

                response.setSucceed(true);
                //response.addParameter("filename", fileName);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2") + "fileDownload?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportCdr")) {
                Map<String, Object> query = new HashMap<String, Object>();
                query = map1;
                System.out.println(query);

                XssfWriter writer = new CdrExport();
                String fileName = writer.process("通话清单导出", query);
                System.out.println(fileName);
                String[] temp = fileName.split("\\|");

                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2") + "fileDownload?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                log.log(Level.INFO, query.get("accountId").toString() + " Export Cdr Excel Success!");
                return response;
            } else if (method.equalsIgnoreCase("billTelRecord")) {
                Map<String, Object> query = map1;
                XssfWriter writer = new BillTelRecordExport();
                String fileName = writer.process("外呼清单导出", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2") + "fileDownload?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportTelList")) {
                Map<String, Object> query = map1;
                XssfWriter writer = new TelListExport();
                String fileName = writer.process("batch_call_list", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportFaxList")) {
                Map<String, Object> query = map1;
                XssfWriter writer = new FaxListExport();
                String fileName = writer.process("batch_fax_list", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportCdrDetail")) {
                Map<String, Object> query = map1;
                XssfWriter writer = new CdrDetailExport();
                String fileName = writer.process("cdr_detail", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportCdrMonth")) {
                Map<String, Object> query = map1;
                XssfWriter writer = new CdrMonthExport();
                String fileName = writer.process("cdr_month_report", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            }
            //用户中心   短信账单导出
            else if (method.equalsIgnoreCase("exportSmsMonthList")) {
                Map<String, Object> query = map1;
                XssfWriter writer = new SmsMonthExport();
                String fileName = writer.process("sms_month_report", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            }
            //用户中心    短信详单导出
            else if (method.equalsIgnoreCase("exportSmsDetail")) {
                Map<String, Object> query = map1;
                XssfWriter writer = new SmsDetailExport();
                String fileName = writer.process("sms_detail", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            }else if (method.equalsIgnoreCase("exportllDetail")) { //用户中心  流量包详单导出
                Map<String, Object> query = map1;
                XssfWriter writer = new LLDetailExport();
                String fileName = writer.process("ll_detail", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            }else if (method.equalsIgnoreCase("exportllMonthList")) { //用户中心  流量包导出
                Map<String, Object> query = map1;
                XssfWriter writer = new LLMonthListExport();
                String fileName = writer.process("ll_monthList", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            }else if (method.equalsIgnoreCase("exportyyDetail")) { //用户中心  语音验证码详单导出
                Map<String, Object> query = map1;
                XssfWriter writer = new YYDetailExport();
                String fileName = writer.process("yy_detail", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            }else if (method.equalsIgnoreCase("exportyyMonthList")) { //用户中心  语音验证码导出
                Map<String, Object> query = map1;
                XssfWriter writer = new YYMonthListExport();
                String fileName = writer.process("yy_monthList", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportFeeCust")) {
                Map<String, Object> query = map1;
                XssfWriter writer = new FeeCustExport();
                String fileName = writer.process("fee_customer", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportLineFee")) {      //线路成本导出
                Map<String, Object> query = map1;
                XssfWriter writer = new LineFeeExport();
                String fileName = writer.process("line_fee", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportLineDetail")) {      //线路话单明细导出
                Map<String, Object> query = map1;
                XssfWriter writer = new LineDetailExport();
                String fileName = writer.process("line_detail", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportSystemUser")) {      //systemUser.js系统用户导出
                Map<String, Object> query = map1;
                XssfWriter writer = new SystemUserExport();
                String fileName = writer.process("system_user", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportWeek")) {        //营运周报导出
                Map<String, Object> query = map1;
                XssfWriter writer = new WeekOperationExport();
                String fileName = writer.process("营运周报", query);
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportFinancedetail")) {      //收支明细清单导出
                Map<String, Object> query = map1;
                XssfWriter writer = new FinanceDetailExport();
                String fileName = writer.process("收支明细表", query);//
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportMonthreportTable")) {      //运营月报表导出
                Map<String, Object> query = map1;
                XssfWriter writer = new MonthReportExport();
                String fileName = writer.process("运营月报表", query);//
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportAreaWeek")) {      //销售区域周报表导出
                Map<String, Object> query = map1;
                XssfWriter writer = new SalesAreaWeekExport();
                String fileName = writer.process("销售区域周报", query);//
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportAreaMonth")) {      //销售区域月报表导出
                Map<String, Object> query = map1;
                XssfWriter writer = new SalesAreaMonthExport();
                String fileName = writer.process("销售区域月报", query);//
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            } else if (method.equalsIgnoreCase("exportGlobal")) {      //渠道整体报表导出
                Map<String, Object> query = map1;
                XssfWriter writer = new GlobalProxyExport();
                String fileName = writer.process("渠道整体报表", query);//
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            }else if (method.equalsIgnoreCase("exportPersonalMonth")) {      //销售个人月报导出
                Map<String, Object> query = map1;
                XssfWriter writer = new SalesPersonalMonthExport();
                String fileName = writer.process("销售个人月报报表", query);//
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            }else if (method.equalsIgnoreCase("exportPersonalSeason")) {      //销售个人季报导出
                Map<String, Object> query = map1;
                XssfWriter writer = new SalesPersonalSeasonExport();
                String fileName = writer.process("销售个人季报报表", query);//
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            }else if (method.equalsIgnoreCase("exportIncomAnalysisMonth")) {      //收入分析月报导出
                Map<String, Object> query = map1;
                XssfWriter writer = new IncomAnalysisMonthExport();
                String fileName = writer.process("收入分析月报报表", query);//
                String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.export") + "?name=" + temp[0] + "&file=" + temp[1] + "&type=" + type);
                return response;
            }


        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "export failed", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
            response.addParameter("result", "500");
        } finally {
            long duration = System.currentTimeMillis() - time;
            String msg = String.format("%s消耗时间[%d ms]", "export excel", duration);
            log.info(msg);
        }
        return response;
    }

}
