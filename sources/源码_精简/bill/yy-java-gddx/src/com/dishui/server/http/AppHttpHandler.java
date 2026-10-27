package com.dishui.server.http;

import java.io.IOException;
import java.net.URLDecoder;
import java.util.Hashtable;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.bill.bill.AccountBillTask;
import com.dishui.bill.bill.CallBillThread;
import com.dishui.bill.bill.RepairBillData;
import com.dishui.bill.bill.RepairBillProxyFee;
import com.dishui.bill.command.C5Action;
import com.dishui.bill.command.C5Response;
import com.dishui.bill.service.AppConfig;
import com.dishui.bill.service.Utils;
import com.dishui.net.httpserver.Headers;
import com.dishui.net.httpserver.HttpExchange;
import com.dishui.net.httpserver.HttpHandler;
import com.dishui.server.handler.ExportHandler;
import com.dishui.server.handler.ImportHandler;
import com.dishui.server.handler.PaymentHandler;
import com.dishui.util.*;
import com.dishui.ytx.CCPRestSDK;
import com.dishui.ytx.SingleCCPRestSDK;
import com.dishui.ytx.utils.YtxTemplateVerification;

public class AppHttpHandler implements HttpHandler {
    private static final Logger log = Logger.getLogger(AppHttpHandler.class.getName());

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String requestMethod = exchange.getRequestMethod();
        try {
            if (requestMethod.equalsIgnoreCase("GET")) {
                processGet(exchange);
            } else if (requestMethod.equalsIgnoreCase("POST")) {
                processPost(exchange);
            }
        } catch (Exception e) {
            log.log(Level.WARNING,"handle http request has exception!",e);
            sendOK(e.getMessage(), exchange);
        }
    }

    private void processPost(HttpExchange exchange) throws IOException {
//        sendOK("Forbiden", exchange);
        String path = exchange.getRequestURI().getPath();
        log.log(Level.INFO, "request from client:" + path);

        String content_length = exchange.getRequestHeaders()
                .get("Content-length").get(0);
        int length = Integer.valueOf(content_length);
        byte[] data = new byte[1024];
        int count = 0;
        StringBuffer buffer = new StringBuffer();
        while ((count = exchange.getRequestBody().read(data)) != -1) {
            buffer.append(new String(data, 0, count, "UTF-8"));
            length -= count;
        }
        if (length != 0) {
            log.warning("Imcompleted POST data! [" + buffer.toString() + "]");
            sendOK("204", exchange);
            return;
        }

        if (path.endsWith("GDSmsService")) {
            log.info("GDSmsService:" + buffer.toString());
            String resStr = GuoDuSendSMS.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        } else if (path.endsWith("YMSmsService")) {
            log.info("YMSmsService:" + buffer.toString());
            String resStr = YMSendSMS.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        } else if (path.endsWith("YMYXSmsService")) {
            log.info("YMYXSmsService:" + buffer.toString());
            String resStr = YMYXSendSMS.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        } else if(path.endsWith("GDYZMSmsService")) {
            log.info("GDYZMSmsService:" + buffer.toString());
            String resStr = GDYZMSendSMS.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        } else if(path.endsWith("JZSmsService")) {
            log.info("JZSmsService:" + buffer.toString());
            String resStr = JZSmsUtil.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        } else if(path.endsWith("JZYXSmsService")) {
            log.info("JZYXSmsService:" + buffer.toString());
            String resStr = JZYXSmsUtil.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("QXHLSmsService")) {
            log.info("QXHLSmsService:" + buffer.toString());
            String resStr = QXHLSendSMS.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("QXHLYXSmsService")) {
            log.info("QXHLYXSmsService:" + buffer.toString());
            String resStr = QXHLYXSendSMS.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("JXFXSmsService")) {
            log.info("JXFXSmsService:" + buffer.toString());
            String resStr = JXFXSendSMS.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("JXFXTZSmsService")) {
            log.info("JXFXTZSmsService:" + buffer.toString());
            String resStr = JXFXTZSendSMS.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("JXJMTZSmsService")) {
            log.info("JXJMTZSmsService:" + buffer.toString());
            String resStr = JXJMTZSendSMS.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("JXJMYXSmsService")) {
            log.info("JXJMYXSmsService:" + buffer.toString());
            String resStr = JXJMYXSendSMS.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("JXJMDXSmsService")) {
            log.info("JXJMDXSmsService:" + buffer.toString());
            String resStr = JXJMDXSendSMS.handlerDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("YTXYXSmsService")) {//云通讯营销短信状态回调
            log.info("YTXYXSmsService:" + buffer.toString());
            CCPRestSDK ccpsdk =SingleCCPRestSDK.getInstance();
            String resStr = ccpsdk.handlerYTXYXDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("YTXSmsService")) {//云通讯短信状态回调
            log.info("YTXSmsService:" + buffer.toString());
            CCPRestSDK ccpsdk =SingleCCPRestSDK.getInstance();
            String resStr = ccpsdk.handlerYTXDeliverMessage(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("YTXSmsTemplateService")) {//短信模板审核回调
            log.info("YTXSmsTemplateService:" + buffer.toString());
            String resStr = YtxTemplateVerification.handlerytxTemplateVerification(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("YTXYxSmsTemplateService")) {//云通讯营销短信模板审核回调
            log.info("YTXYxSmsTemplateService:" + buffer.toString());
            String resStr = YtxTemplateVerification.handlerytxyxTemplateVerification(buffer.toString());
            sendOK(resStr, exchange);
            return;
        }else {
            sendOK("Forbiden", exchange);
            return;
        }
//        processString(buffer.toString(), exchange);
    }

    private void processGet(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String rrr = exchange.getRequestURI().getQuery();
        log.log(Level.INFO, "request from client:" + path + ' ' + rrr);
        if (path.endsWith("service")) {
            processService(exchange);
            return;
        }else if(path.endsWith("YMNewSmsService")) {
            String strData = exchange.getRequestURI().getQuery();
            String[] params = strData.split("\\&");
            Hashtable<String, String> map = new Hashtable<String, String>();
            if (params.length > 0) {
                for (int i = 0; i < params.length; i++) {
                    String[] a = params[i].split("=");
                    if(a.length>1)
                        map.put(a[0].trim(), a[1].trim());
                    else
                        map.put(a[0].trim(), "");
                }
            }
            log.info("YMNewSmsService:" + map.toString());
            String resStr = YMNewSendSMS.handlerDeliverMessage(map);
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("YMYXNewSmsService")) {
            String strData = exchange.getRequestURI().getQuery();
            String[] params = strData.split("\\&");
            Hashtable<String, String> map = new Hashtable<String, String>();
            if (params.length > 0) {
                for (int i = 0; i < params.length; i++) {
                    String[] a = params[i].split("=");
                    if(a.length>1)
                        map.put(a[0].trim(), a[1].trim());
                    else
                        map.put(a[0].trim(), "");
                }
            }
            log.info("YMYXNewSmsService:" + map.toString());
            String resStr = YMYXNewSendSMS.handlerDeliverMessage(map);
            sendOK(resStr, exchange);
            return;
        }else if(path.endsWith("YMZPNewSmsService")) {
            String strData = exchange.getRequestURI().getQuery();
            String[] params = strData.split("\\&");
            Hashtable<String, String> map = new Hashtable<String, String>();
            if (params.length > 0) {
                for (int i = 0; i < params.length; i++) {
                    String[] a = params[i].split("=");
                    if(a.length>1)
                        map.put(a[0].trim(), a[1].trim());
                    else
                        map.put(a[0].trim(), "");
                }
            }
            log.info("YMZPNewSmsService:" + map.toString());
            String resStr = YMZPNewSendSMS.handlerDeliverMessage(map);
            sendOK(resStr, exchange);
            return;
        } else {
            String data = AppConfig.serverName + AppConfig.version;
            sendOK(data, exchange);
            return;
        }
    }

    private void processService(HttpExchange exchange) throws IOException {
        String strData = exchange.getRequestURI().getQuery();
        String[] params = strData.split("\\&");
        Hashtable<String, String> map = new Hashtable<String, String>();
        if (params.length > 0) {
            for (int i = 0; i < params.length; i++) {
                String[] a = params[i].split("=");
                map.put(a[0].trim(), a[1].trim());
            }
        }
        String actionName = map.get("Action");
        C5Action action = new C5Action(actionName, Utils.getSynActionID(actionName));
        action.setValues(map);
        C5Response response = new C5Response(action);
        if (actionName.equals("getSipNum")) {
            response = AppServiceHander.getSipNum(action);
        } else if (actionName.equals("getSeriesSipNum")) {
            response = AppServiceHander.getSeriesSipNum(action);
        } else if (actionName.equals("getSkillGroupNum")) {
            response = AppServiceHander.getSkillGroupNum(action);
        } else if (actionName.equals("getIvrId")) {
            response = AppServiceHander.getIvrId(action);
        } else if (actionName.equals("getAccountId")) {
            response = AppServiceHander.getAccountId(action);
        } else if (actionName.equals("useServiceNum")) {
            response = AppServiceHander.useServiceNum(action);
        } else if (actionName.equals("buyServiceNum")) {
            response = AppServiceHander.buyServiceNum(action);
        } else if (actionName.equals("useNum400")) {
            response = AppServiceHander.userNum400(action);
        } else if (actionName.equals("releaseServiceNum")) {
            response = AppServiceHander.releaseServiceNum(action);
        } else if (actionName.equals("export")) {
            response = ExportHandler.handle(action);
        } else if (actionName.equals("import")) {
            response = ImportHandler.handle(action);
        } else if (actionName.equals("payment")) {
            response = PaymentHandler.handle(action);
        } else if (actionName.equals("taobao")) {
            response = AppServiceHander.taobao(action);
        } else if (actionName.equals("getMobileCode")){
            response = AppServiceHander.getMobileCode(action);
        } else if (actionName.equals("syncZJMonthConcume")){
            response = AccountBillTask.syncZJMonthConcume(action);
        } else if (actionName.equals("syncCCMonthConcume")){
            response = AccountBillTask.syncCCMonthConcume(action);
        } else if(actionName.equals("send")){
            response = AppServiceHander.HandlerSms(action);
        } else if(actionName.equals("getReport")){
            response = AppServiceHander.HandlerSms(action);
        } else if(actionName.equals("getBalance")){
            response = AppServiceHander.HandlerSms(action);
        } else if(actionName.equals("getSms")){
            response = AppServiceHander.HandlerSms(action);
        } else if(actionName.equals("ytxCommitDisplayNumbers")){
            response = AppServiceHander.HandlerYTXCommitDisplayNumbers(action);
        } else if (actionName.equals("repaireLineFee")){
            RepairBillData repair=new RepairBillData();
            response = repair.repaireLineFee(action);
        } else if (actionName.equals("repaireProxyFee")){
            RepairBillData repair=new RepairBillData();
            response = repair.repaireProxyFee(action);
        } else if (actionName.equals("repaireProxyTelIncome")){
            RepairBillData repair=new RepairBillData();
            response = repair.repaireProxyTelIncome(action);
        } else if (actionName.equals("repaireProxyFee2")){
            RepairBillProxyFee repair=new RepairBillProxyFee();
            response = repair.repaireProxyFee(action);
        }else if(actionName.equals("getSmssubcodeId")){//对应账户下的短信签名 subcode
            response = AppServiceHander.getSmscodeId(action);
        } else if(actionName.equals("getSmsTempleteId")){
            response = AppServiceHander.getSmsTempleteId(action);
        }else if(actionName.equals("getAiMuNeiYiCustInfo")){
            response = AppServiceHander.getAiMuNeiYiCustInfo(action);
        }else if (actionName.equals("deductCCMinConsume")){
            response = AccountBillTask.deductCCMinConsume(action);
        }else if (actionName.equals("backoutCCMinConsume")){
            response = AccountBillTask.backoutCCMinConsume(action);
        }else if (actionName.equals("smsWordsCheck")){
            response = AppServiceHander.smsWordsCheck(action);
        }else if (actionName.equals("YTXtemplateverification")){
            response = YtxTemplateVerification.templateverification(action);
        }else if (actionName.equals("YTXtemplateSelect")){
            response = YtxTemplateVerification.handlerytxTemplateSelect(action);
        }else if (actionName.equals("changeSingleCallSumToPbx")){
            response = CallBillThread.changeSingleCallSumToPbx(action);
        }else if(actionName.equals("changeCallSumByAccount")){
            response= CallBillThread.changeCallSumByAccount(action);
        }else if(actionName.equals("setCCRecordRights")){//设置录音权限
            response= CallBillThread.setCCRecordRights(action);
        }else {
            String data = "unknow action!";
            sendOK(data, exchange);
            return;
        }
        sendOK(response, exchange);
    }

    public static void sendOK(C5Response response, HttpExchange exchange) throws IOException {
        String data = response.getJsonString();
        log.log(Level.INFO, "response to client:" + data);
        sendOK(data, exchange);
    }

    public static void sendOK(String data, HttpExchange exchange) throws IOException {
        try {
            log.log(Level.INFO, "response to client:" + data);
            String callbackName = (String) exchange.getVar("callbackName");
            if (callbackName != null) {
                data = callbackName + "(" + data + ")";
                exchange.setVar("callbackName", null);
            }
            Headers responseHeaders = exchange.getResponseHeaders();
            responseHeaders.set("Content-Type", "text/plain");
            byte[] toSend = data.getBytes("UTF-8");
            responseHeaders.set("Content-Length", toSend.length + "");
            exchange.sendResponseHeaders(200, 0);
            exchange.getResponseBody().write(toSend);
            exchange.getResponseBody().flush();
            exchange.getResponseBody().close();
        } catch (Exception e) {
            // log.log(Level.WARNING, "", e);
        } finally {
            exchange.close();
        }
    }

    public static void send403(String data, HttpExchange exchange) throws IOException {
        try {
            String callbackName = (String) exchange.getVar("callbackName");
            if (callbackName != null) {
                data = callbackName + "(" + data + ")";
                exchange.setVar("callbackName", null);
            }
            Headers responseHeaders = exchange.getResponseHeaders();
            responseHeaders.set("Content-Type", "text/plain");
            byte[] toSend = data.getBytes("UTF-8");
            responseHeaders.set("Content-Length", toSend.length + "");
            exchange.sendResponseHeaders(403, 0);
            exchange.getResponseBody().write(toSend);
            exchange.getResponseBody().flush();
            exchange.getResponseBody().close();
        } catch (Exception e) {
            // log.log(Level.WARNING, "", e);
        } finally {
            exchange.close();
        }
    }

    public static void send(int type, String data, HttpExchange exchange) throws IOException {
        try {
            String callbackName = (String) exchange.getVar("callbackName");
            if (callbackName != null) {
                data = callbackName + "(" + data + ")";
                exchange.setVar("callbackName", null);
            }
            Headers responseHeaders = exchange.getResponseHeaders();
            responseHeaders.set("Content-Type", "text/plain");
            byte[] toSend = data.getBytes("UTF-8");
            responseHeaders.set("Content-Length", toSend.length + "");
            exchange.sendResponseHeaders(type, 0);
            exchange.getResponseBody().write(toSend);
            exchange.getResponseBody().flush();
            exchange.getResponseBody().close();
        } catch (Exception e) {
            // log.log(Level.WARNING, "", e);
        } finally {
            exchange.close();
        }
    }

}
