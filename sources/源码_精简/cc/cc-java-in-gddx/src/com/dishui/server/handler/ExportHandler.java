package com.dishui.server.handler;

import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.command.Fields;
import com.dishui.manager.command.JSONReader;
import com.dishui.manager.service.AppConfig;
import com.dishui.util.excel.*;
import com.dishui.util.excel.handler.BillTel400RecordExport;
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
			String handlerType=method;
			map1.put("handlerType", handlerType);
			
			if (method.equalsIgnoreCase("exportCustomer")) {
				Map<String, Object> query = new HashMap<String, Object>();
				query=map1;
				
				XssfWriter writer = new CustomerExport();
				String fileName = writer.process("customerExport", query);
				String[] temp=fileName.split("\\|");
				
				response.setSucceed(true);
//				response.addParameter("filename", fileName);
				response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
				return response;
			}else if(method.equalsIgnoreCase("exportReportQueue")){
				Map<String, Object> query = map1;

				XssfWriter writer = new ReportQueueExport();
				String fileName = writer.process("技能组对比报表导出", query);
				String[] temp=fileName.split("\\|");

				response.setSucceed(true);
				response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
				return response;
			}else if(method.equalsIgnoreCase("exportCdr")){
				Map<String, Object> query = new HashMap<String, Object>();
				query=map1;
				System.out.println(query);

				XssfWriter writer = new CdrExport();
				String fileName = writer.process("通话清单导出", query);
				String[] temp=fileName.split("\\|");

				response.setSucceed(true);
				response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
				log.log(Level.INFO,query.get("accountId").toString()+" Export Cdr Excel Success!");
				return response;
			}else if(method.equalsIgnoreCase("billTelRecord")){
				Map<String, Object> query = map1;
				XssfWriter writer = new BillTelRecordExport();
				String fileName = writer.process("外呼清单导出", query);
				String[] temp=fileName.split("\\|");
				response.setSucceed(true);
				response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
				return response;
			}else if(method.equalsIgnoreCase("billTel400Record")){
                Map<String, Object> query = map1;
                XssfWriter writer = new BillTel400RecordExport();
                String fileName = writer.process("400清单导出", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                return response;
            }else if(method.equalsIgnoreCase("business")){
                Map<String,Object> query = map1;
                XssfWriter writer = new BusinessExport();
                String fileName = writer.process("业务清单导出", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("account").toString()+" Export business Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportTelList")){
                Map<String, Object> query = map1;
                XssfWriter writer = new TelListExport();
                String fileName = writer.process("batch_call_list", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                return response;
            }else if(method.equalsIgnoreCase("exportTelTaskList")){
                Map<String, Object> query = map1;
                XssfWriter writer = new TelTaskListExport();
                String fileName = writer.process("batch_call_list", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                return response;
            } else if(method.equalsIgnoreCase("exportCallRecord")){
                Map<String, Object> query = map1;
                XssfWriter writer = new CallRecordExport();
                String fileName = writer.process("来电登记单", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2") + "fileDownload?name=" + temp[0] + "&file=" + temp[1] + "&type=" + handlerType);
                return response;
            } else if (method.equalsIgnoreCase("exportRelayTimeReport")) {
                Map<String,Object> query = map1;
                XssfWriter writer = new RelayTimeReportExport();
                String fileName = writer.process("RelayTimeReport", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("ReportRelayAreaExport")){
                Map<String, Object> query = map1;
                XssfWriter writer = new RelayAreaReportExport();
                String fileName = writer.process("RelayAreaExport", query);
                String[] temp=fileName.split("\\|");

                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export Cdr Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportDialoutTime")){
                Map<String, Object> query = map1;

                XssfWriter writer = new ReportDialoutTimeExport();
                String fileName = writer.process("DialoutTimeExport", query);
                System.out.println(fileName);
                String[] temp=fileName.split("\\|");

                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export Cdr Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportAgent")){
                Map<String, Object> query = map1;

                XssfWriter writer = new ReportAgentExport();
                String fileName = writer.process("AgentReportExport", query);
                String[] temp=fileName.split("\\|");

                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2") + "fileDownload?name=" + temp[0] + "&file=" + temp[1] + "&type=" + handlerType);
                log.log(Level.INFO, query.get("accountId").toString() + " Export agent report Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("ReportDialoutAreaExport")){
                Map<String, Object> query = map1;

                XssfWriter writer = new ReportDialoutAreaExport();
                String fileName = writer.process("DialoutAreaReport", query);
                System.out.println(fileName);
                String[] temp=fileName.split("\\|");

                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2") + "fileDownload?name=" + temp[0] + "&file=" + temp[1] + "&type=" + handlerType);
                return response;
            } else if (method.equalsIgnoreCase("exportApproveSurveyReport")) {
                Map<String,Object> query = map1;
                XssfWriter writer = new ApproveSurveyReportExport();
                String fileName = writer.process("ApproveSurveyReport", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2") + "fileDownload?name=" + temp[0] + "&file=" + temp[1] + "&type=" + handlerType);
                log.log(Level.INFO, query.get("accountId").toString() + " Export approve survey report Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportReportQueueTime")){
                Map<String, Object> query = map1;

                XssfWriter writer = new ReportQueueTimeExport();
                String fileName = writer.process("QueueTimeReport", query);
                String[] temp=fileName.split("\\|");

                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2") + "fileDownload?name=" + temp[0] + "&file=" + temp[1] + "&type=" + handlerType);
                return response;
            } else if(method.equalsIgnoreCase("ReportRelayAreaCityExport")){
                Map<String, Object> query = map1;

                XssfWriter writer = new RelayAreaCityReportExport();
                String fileName = writer.process("RelayAreaCityExport", query);
                String[] temp=fileName.split("\\|");

                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export RelayAreaCityExport Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportCdrPeer")){
                Map<String, Object> query = new HashMap<String, Object>();
                query=map1;

                XssfWriter writer = new CdrPeerExport();
                String fileName = writer.process("座席状态日志导出", query);
                String[] temp=fileName.split("\\|");

                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export Cdr Peer Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportCdrPeerDetail")){
                Map<String, Object> query = new HashMap<String, Object>();
                query=map1;

                XssfWriter writer = new CdrPeerDetailExport();
                String fileName = writer.process("座席详细状态日志导出", query);
                String[] temp=fileName.split("\\|");

                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export Cdr Peer Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("questionnaire")){
                Map<String,Object> query = map1;
                XssfWriter writer = new QuestionnaireExport();
                String fileName = writer.process("问卷清单导出", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("account").toString()+" Export business Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportQualityCheckList")){
                Map<String,Object> query = map1;
                XssfWriter writer = new QualityCheckListExport();
                String fileName = writer.process("质检结果导出", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export Quality Check Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportCallSheetGradeResult")){
                Map<String,Object> query = map1;
                XssfWriter writer = new CallSheetGradeResultExport();
                String fileName = writer.process("座席质检导出", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export Call Sheet Grade Result Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportImAgent")){
                Map<String,Object> query = map1;
                XssfWriter writer = new ImAgentReportExport();
                String fileName = writer.process("在线客服座席工作量报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportMailAgent")){
                Map<String,Object> query = map1;
                XssfWriter writer = new MailAgentReportExport();
                String fileName = writer.process("邮件座席工作量报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportImBusiness")){
                Map<String,Object> query = map1;
                XssfWriter writer = new ImBusinesstReportExport();
                String fileName = writer.process("在线客服业务报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportImMessage")){
                Map<String,Object> query = map1;
                XssfWriter writer = new ImMessageReportExport();
                String fileName = writer.process("在线客服消息报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportImSourceAnalyse")){
                Map<String,Object> query = map1;
                XssfWriter writer = new ImSourceAnalyseExport();
                String fileName = writer.process("访客来源分析报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportCustomerIncrease")){
                Map<String,Object> query = map1;
                XssfWriter writer = new CustomerIncreaseReportExport();
                String fileName = writer.process("客户来源分析报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportBusinessAnalyse")){
                Map<String,Object> query = map1;
                XssfWriter writer = new BusinessAnalyseReportExport();
                String fileName = writer.process("工单分析报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            } else if(method.equalsIgnoreCase("exportBusinessAgent")){
                Map<String,Object> query = map1;
                XssfWriter writer = new BusinessAgentReportExport();
                String fileName = writer.process("工单座席工作量报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportImCSR")){
            	Map<String,Object> query = map1;
                XssfWriter writer = new ImCSRReportExport();
                String fileName = writer.process("在线客服坐席满意度报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportImChannelCSR")){
            	Map<String,Object> query = map1;
                XssfWriter writer = new ImChannelCSRReportExport();
                String fileName = writer.process("在线客服坐席满意度报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportImChannelCSR")){
            	Map<String,Object> query = map1;
                XssfWriter writer = new ImChannelCSRReportExport();
                String fileName = writer.process("在线客服渠道满意度报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportImSessionTime")){
            	Map<String,Object> query = map1;
                XssfWriter writer = new ImSessionTimeReportExport();
                String fileName = writer.process("会话数时间趋势报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
			}else if(method.equalsIgnoreCase("exportCustomerCdr")){
                Map<String,Object> query = map1;
                String account = query.get("accountId").toString();
                XssfWriter writer = new CustomerCdrExport();
                String fileName = writer.process("导出客户通话记录", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,account+" Export Customer Call Sheet Grade Result Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportWebchat")) {
            	Map<String, Object> query = map1;
            	XssfWriter writer = new WebchatReportExport();
            	String fileName = writer.process("聊天记录 ", query);
            	String[] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportCustomerStatus")){
                Map<String,Object> query = map1;
                XssfWriter writer = new CustomerStatusReportExport();
                String fileName = writer.process("座席客户状态分布报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export relay time report Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportQuesResultReport")){
                Map<String,Object> query = map1;
                String account = query.get("accountId").toString();
                XssfWriter writer = new QuesResultReportExport();
                String fileName = writer.process("问卷调查回访状态报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,account+" Export exportQuesResultReport Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportQuesAnswerReport")){
                Map<String,Object> query = map1;
                String account = query.get("accountId").toString();
                XssfWriter writer = new QuesAnswerReportExport();
                String fileName = writer.process("问卷调查问题明细报表", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,account+" Export exportQuesAnswerReport Excel Success!");
                return response;
            } else  if(method.equalsIgnoreCase("exportCustomerTask")){
                Map<String, Object> query = new HashMap<String, Object>();
                query=map1;
                XssfWriter writer = new CustomerTaskExport();
                String fileName = writer.process("未拨打号码", query);
                String[] temp=fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path", AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("account").toString()+" Export customerTask Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportCustomerSaleAgent")){
                Map<String,Object> query = new HashMap<String, Object>();
                query = map1;
                XssfWriter writer = new CustomerSaleAgentReportExport();
                String fileName = writer.process("座席商机分析报表",query);
                String [] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path",AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export customerSaleAgent Excel Success!");
                return response;
            }else if(method.equalsIgnoreCase("exportCustomerSale")){
                Map<String,Object> query = new HashMap<String, Object>();
                query = map1;
                XssfWriter writer = new CustomerSaleReportExport();
                String fileName = writer.process("商机分析报表",query);
                String [] temp = fileName.split("\\|");
                response.setSucceed(true);
                response.addParameter("path",AppConfig.getInstance().getVar("node.server2")+"fileDownload?name="+temp[0]+"&file="+temp[1]+"&type="+handlerType);
                log.log(Level.INFO,query.get("accountId").toString()+" Export customerSaleAgent Excel Success!");
                return response;
            }
		} catch (Exception e) {
			e.printStackTrace();
			log.log(Level.WARNING, "export failed", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
			response.addParameter("result", "500");
		}finally{
			long duration = System.currentTimeMillis() - time;
			String msg = String.format("%s消耗时间[%d ms]", "export excel", duration);
			log.info(msg);
		}
		return response;
	}

}
